import { NextResponse } from 'next/server';

const FULL_ORDER_LIST_FIELDS = 'id, title, client_name, client_email, service_category, service_type, fabric_type, requested_formats, is_rush, price, cost, status, payment_status, artwork_url, image_url, logo, user_id, worker_id, worker_status, worker_file_url, worker_file_name, worker_files, worker_notes, worker_payout, worker_payout_status, admin_worker_feedback, worker_assigned_at, worker_submitted_at, worker_reviewed_at, paid_at, output_file_url, notes, created_at, updated_at, order_files(id, file_name, file_format, file_type, public_url, file_url, uploaded_by, created_at)';

const ADMIN_SUMMARY_FIELDS = 'id, title, client_name, client_email, service_category, service_type, fabric_type, requested_formats, is_rush, price, cost, status, payment_status, artwork_url, image_url, logo, user_id, worker_id, worker_status, worker_file_url, worker_file_name, worker_files, worker_notes, worker_payout, worker_payout_status, admin_worker_feedback, worker_assigned_at, worker_submitted_at, worker_reviewed_at, paid_at, created_at, updated_at';

export async function handleFetchAll(context) {
  const { searchParams, supabase, user, isAdmin, isWorker, workerData } = context;

  if (!user?.email) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const clientEmailFilter = searchParams.get('clientEmail') || searchParams.get('email');
  const workerIdParam = searchParams.get('workerId');
  const wantsAdminSummary = isAdmin && searchParams.get('view') === 'summary';

  let targetEmail = null;
  let targetWorkerId = null;

  if (isAdmin) {
    targetEmail = clientEmailFilter ? clientEmailFilter.toLowerCase().trim() : null;
    targetWorkerId = workerIdParam || null;
  } else if (isWorker) {
    targetWorkerId = workerData?.id || user.id;
  } else {
    targetEmail = user.email.toLowerCase().trim();
  }

  const applyAuthorizationScope = (query) => {
    if (isAdmin) {
      if (targetWorkerId) return query.eq('worker_id', targetWorkerId);
      if (targetEmail) return query.ilike('client_email', targetEmail);
      return query;
    }

    if (isWorker) {
      return query.eq('worker_id', targetWorkerId);
    }

    const isValidUuid = typeof user.id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);

    const ownership = [];
    if (isValidUuid) ownership.push('user_id.eq.' + user.id);
    ownership.push('client_email.ilike.' + targetEmail);
    return query.or(ownership.join(','));
  };

  let data = null;

  try {
    let query = supabase
      .from('orders')
      .select(wantsAdminSummary ? ADMIN_SUMMARY_FIELDS : FULL_ORDER_LIST_FIELDS)
      .order('created_at', { ascending: false });

    query = applyAuthorizationScope(query);
    if (wantsAdminSummary) {
      query = query.limit(500);
    }
    const res = await query;
    if (res.error) throw res.error;
    data = res.data;
  } catch (nestedErr) {
    console.warn('Nested orders query fallback notice:', nestedErr);

    // A timeout/cancel means the database is already under pressure. Repeating
    // almost the same large query immediately makes the overload worse.
    if (nestedErr?.code === '57014' || /statement timeout|canceling statement/i.test(nestedErr?.message || '')) {
      throw nestedErr;
    }

    // The summary projection has no nested relationship to fall back from.
    if (wantsAdminSummary) {
      throw nestedErr;
    }

    let fallbackQuery = supabase
      .from('orders')
      .select('id, title, client_name, client_email, service_category, service_type, fabric_type, requested_formats, is_rush, price, status, payment_status, artwork_url, image_url, logo, user_id, worker_id, worker_status, worker_file_url, worker_file_name, worker_files, output_file_url, notes, created_at, updated_at, order_files(id, file_name, file_format, file_type, public_url, file_url, uploaded_by, created_at)')
      .order('created_at', { ascending: false });

    fallbackQuery = applyAuthorizationScope(fallbackQuery);
    const fallbackRes = await fallbackQuery;
    if (fallbackRes.error) throw fallbackRes.error;
    data = fallbackRes.data;
  }

  const orders = wantsAdminSummary
    ? (data || []).map(order => ({ ...order, _summaryOnly: true }))
    : (data || []);

  return NextResponse.json({ orders }, {
    headers: {
      'Cache-Control': 'private, max-age=15, stale-while-revalidate=45'
    }
  });
}
