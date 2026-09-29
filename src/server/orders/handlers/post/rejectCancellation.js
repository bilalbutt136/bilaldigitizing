import { NextResponse } from 'next/server';

export async function handleRejectCancellation(context) {
  const { payload, supabase, user, isAdmin } = context;
      if (!user || !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
      }
      const { orderId, rejectionReason } = payload;
      const rawOrderId = String(orderId || '').trim();
      const cleanOrdId = rawOrderId.replace(/^#+/, '');
      const withHash = `#${cleanOrdId}`;
      const candidateIds = Array.from(new Set([rawOrderId, cleanOrdId, withHash])).filter(Boolean);

      const { data: orderData } = await supabase
        .from('orders')
        .select('id, client_email, client_name, user_id, title, status, notes')
        .in('id', candidateIds)
        .maybeSingle();

      if (!orderData) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }

      let notesObj = {};
      try {
        notesObj = typeof orderData.notes === 'string' && orderData.notes.trim().startsWith('{')
          ? JSON.parse(orderData.notes)
          : (typeof orderData.notes === 'object' && orderData.notes ? orderData.notes : {});
      } catch {
        notesObj = {};
      }

      const cancellation = notesObj.cancellation || {};
      const revertStatus = cancellation.previous_status || 'in_progress';
      const cleanRejection = String(rejectionReason || 'Cancellation request declined by studio operations. Order remains active in production.').trim();

      cancellation.status = 'rejected';
      cancellation.resolved_at = new Date().toISOString();
      cancellation.admin_rejection_reason = cleanRejection;
      notesObj.cancellation = cancellation;

      const nowIso = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from('orders')
        .update({
          status: revertStatus,
          notes: JSON.stringify(notesObj),
          updated_at: nowIso
        })
        .eq('id', orderData.id);

      if (updateErr) throw updateErr;

      // Customer Notification
      if (orderData.client_email) {
        try {
          await supabase.from('notifications').insert([{
            id: `notif-rejected-cancel-${cleanOrdId}-${Date.now()}`,
            user_id: orderData.user_id || null,
            recipient_role: 'client',
            recipient_email: orderData.client_email.toLowerCase().trim(),
            title: `ℹ Cancellation Declined: Order #${cleanOrdId}`,
            message: `Your cancellation request for Order #${cleanOrdId} was declined. Reason: "${cleanRejection}". Work continues in ${revertStatus}.`,
            type: 'warning',
            order_id: cleanOrdId,
            link: `/client-portal?tab=orders&trackOrder=${cleanOrdId}`,
            read: false,
            created_at: nowIso,
            updated_at: nowIso
          }]);
        } catch (notifErr) {
          console.warn('Customer reject notification error:', notifErr.message);
        }
      }

      // Broadcast to live channel
      try {
        const liveChannel = supabase.channel('bdigitizing-live-hub-v2');
        await liveChannel.send({
          type: 'broadcast',
          event: 'cancellation_rejected',
          payload: { orderId: cleanOrdId, status: revertStatus, rejectionReason: cleanRejection }
        });
        await liveChannel.send({
          type: 'broadcast',
          event: 'order_updated',
          payload: { ...orderData, status: revertStatus, notes: notesObj }
        });
        await liveChannel.send({
          type: 'broadcast',
          event: 'order_change',
          payload: { order: { ...orderData, status: revertStatus, notes: notesObj }, eventType: 'UPDATE' }
        });
      } catch (error) { logServerCaughtError(error, { operation: 'orders.cancellation_rejected_broadcast_failed' }); }

      return NextResponse.json({
        success: true,
        status: revertStatus,
        rejectionReason: cleanRejection
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
}
