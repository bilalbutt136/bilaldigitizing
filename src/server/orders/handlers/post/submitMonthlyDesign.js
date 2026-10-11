import { NextResponse } from 'next/server';
import { prepareMonthlySubmission } from '../../../../utils/monthlyProgress.js';

// Each upload creates exactly one new design slot. An order-row compare-and-swap
// prevents two simultaneous uploads from exceeding the purchased allowance.
export async function handleSubmitMonthlyDesign({ payload, supabase, user, isAdmin }) {
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  const orderId = String(payload?.orderId || '').trim();
  if (!/^[#a-zA-Z0-9_-]{3,100}$/.test(orderId)) {
    return NextResponse.json({ error: 'Invalid order ID.' }, { status: 400 });
  }
  const clean = orderId.replace(/^#+/, '');
  const candidates = [...new Set([orderId, clean, '#' + clean])];
  const { data: order, error: fetchError } = await supabase.from('orders')
    .select('id, notes, status, payment_status, paid_at, created_at, updated_at, client_email, user_id')
    .in('id', candidates).maybeSingle();
  if (fetchError) return NextResponse.json({ error: 'Could not load order.' }, { status: 503 });
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  const owner = (order.user_id && order.user_id === user.id) ||
    (user.email && order.client_email?.toLowerCase().trim() === user.email.toLowerCase().trim());
  if (!owner && !isAdmin) return NextResponse.json({ error: 'Not authorized for this order.' }, { status: 403 });
  if (String(order.payment_status).toLowerCase() !== 'paid') {
    return NextResponse.json({ error: 'Please complete payment before uploading designs.' }, { status: 409 });
  }
  if (['cancelled', 'cancellation_requested', 'refunded'].includes(String(order.status).toLowerCase())) {
    return NextResponse.json({ error: 'This order cannot accept more designs.' }, { status: 409 });
  }
  let notes;
  try { notes = typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes; } catch {}
  if (!notes?.monthlyBundle) return NextResponse.json({ error: 'Not a monthly plan.' }, { status: 400 });
  const referenceStart = order.paid_at || order.created_at;
  let saved;
  try {
    saved = prepareMonthlySubmission(notes, payload?.file, payload?.title, referenceStart, payload?.designId);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
  // File must come from this site's configured upload provider, not an unrelated account.
  try {
    const fileUrl = new URL(String(payload?.file?.url || ''));
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const storageHost = storageUrl ? new URL(storageUrl).hostname : '';
    const isCloud = fileUrl.hostname === 'res.cloudinary.com' &&
      Boolean(cloudName) && fileUrl.pathname.split('/')[1] === cloudName;
    const isStorage = Boolean(storageHost) && fileUrl.hostname === storageHost &&
      fileUrl.pathname.includes('/storage/v1/object/public/client-uploads/monthly-designs/');
    if (!isCloud && !isStorage) {
      return NextResponse.json({ error: 'Upload must use the studio storage service.' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid upload address.' }, { status: 400 });
  }
  const prior = Date.parse(order.updated_at);
  const time = new Date(Math.max(Date.now(), Number.isFinite(prior) ? prior + 1 : Date.now())).toISOString();
  const { data: updated, error: saveError } = await supabase.from('orders')
    .update({ notes: JSON.stringify({ ...notes, monthlyDesigns: saved.designs }), status: 'in_progress', updated_at: time })
    .eq('id', order.id).eq('updated_at', order.updated_at).select('id');
  if (saveError) return NextResponse.json({ error: 'Could not save design. Retry shortly.' }, { status: 503 });
  if (!updated?.length) return NextResponse.json({ error: 'Order changed during upload. Refresh and retry.' }, { status: 409 });
  // Admin receives one concise notification per new design. Notification failure
  // cannot undo a successfully recorded customer submission.
  try {
    await supabase.from('notifications').insert([{
      id: 'monthly-upload-' + order.id + '-' + String(payload.designId),
      user_id: null, recipient_role: 'admin',
      title: 'Monthly Design #' + saved.progress.uploaded + ' Submitted',
      message: (order.client_email || 'Customer') + ' submitted ' + saved.designs.at(-1).name,
      type: 'info', order_id: order.id, read: false,
      link: '/admin-portal?tab=orders&trackOrder=' + encodeURIComponent(order.id),
      created_at: time, updated_at: time
    }]);
  } catch (error) {
    console.warn('[Monthly design notification notice]', error?.message);
  }
  return NextResponse.json({
    success: true,
    uploaded: saved.progress.uploaded, quota: saved.progress.quota,
    remaining: saved.progress.remaining, designNumber: saved.progress.uploaded,
    status: 'in_progress'
  }, { headers: { 'Cache-Control': 'no-store' } });
}
