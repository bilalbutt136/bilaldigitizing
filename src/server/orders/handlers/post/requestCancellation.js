import { NextResponse } from 'next/server';

export async function handleRequestCancellation(context) {
  const { payload, supabase, user, isAdmin } = context;
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { orderId, reason } = payload;
      const cleanReason = String(reason || '').trim();
      if (!cleanReason) {
        return NextResponse.json({ error: 'A cancellation reason is required.' }, { status: 400 });
      }

      const rawOrderId = String(orderId || '').trim();
      const cleanOrdId = rawOrderId.replace(/^#+/, '');
      const withHash = `#${cleanOrdId}`;
      const candidateIds = Array.from(new Set([rawOrderId, cleanOrdId, withHash])).filter(Boolean);

      const { data: orderData } = await supabase
        .from('orders')
        .select('id, client_email, client_name, user_id, title, status, payment_status, price, cost, notes')
        .in('id', candidateIds)
        .maybeSingle();

      if (!orderData) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }

      if (!isAdmin) {
        const isClientOwner = (orderData?.client_email?.toLowerCase().trim() === user.email?.toLowerCase().trim()) || (orderData?.user_id && orderData.user_id === user.id);
        if (!isClientOwner) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      }

      const curStatus = (orderData.status || '').toLowerCase();
      if (curStatus === 'delivered' || curStatus === 'completed') {
        return NextResponse.json({ error: 'Delivered or completed orders cannot be cancelled.' }, { status: 400 });
      }
      if (curStatus === 'cancelled') {
        return NextResponse.json({ error: 'This order is already cancelled.' }, { status: 400 });
      }
      if (curStatus === 'cancellation_requested') {
        return NextResponse.json({ error: 'Cancellation request has already been submitted and is awaiting administrator review.' }, { status: 400 });
      }

      const nowIso = new Date().toISOString();
      const clientName = orderData.client_name || user.user_metadata?.full_name || 'Client';
      const clientEmail = (orderData.client_email || user.email || '').toLowerCase().trim();
      const canonicalOrderId = orderData.id;

      let notesObj = {};
      try {
        notesObj = typeof orderData.notes === 'string' && orderData.notes.trim().startsWith('{')
          ? JSON.parse(orderData.notes)
          : (typeof orderData.notes === 'object' && orderData.notes ? orderData.notes : {});
      } catch {
        notesObj = {};
      }

      const cancelRecord = {
        id: `cancel_${Date.now()}`,
        reason: cleanReason,
        requested_by: clientName,
        requested_by_email: clientEmail,
        requested_at: nowIso,
        status: 'pending',
        previous_status: orderData.status || 'in_progress',
        amount: parseFloat(orderData.price || orderData.cost || 0)
      };

      notesObj.cancellation = cancelRecord;
      notesObj.cancellations = [cancelRecord, ...(Array.isArray(notesObj.cancellations) ? notesObj.cancellations : [])];

      const { error: updateErr } = await supabase
        .from('orders')
        .update({
          status: 'cancellation_requested',
          notes: JSON.stringify(notesObj),
          updated_at: nowIso
        })
        .eq('id', canonicalOrderId);

      if (updateErr) throw updateErr;

      // Admin Notification
      try {
        await supabase.from('notifications').insert([{
          id: `notif-cancel-${cleanOrdId}-${Date.now()}`,
          recipient_role: 'admin',
          recipient_email: null,
          title: `⚠️ Cancellation Requested: ${orderData.title || '#' + cleanOrdId}`,
          message: `${clientName} (${clientEmail}) requested cancellation for Order #${cleanOrdId}. Reason: "${cleanReason.slice(0, 120)}"`,
          type: 'warning',
          order_id: cleanOrdId,
          link: `/admin-portal?tab=orders&trackOrder=${cleanOrdId}`,
          read: false,
          created_at: nowIso,
          updated_at: nowIso
        }]);
      } catch (notifErr) {
        console.warn('Admin cancellation notification error:', notifErr.message);
      }

      // Customer Notification
      if (clientEmail) {
        try {
          await supabase.from('notifications').insert([{
            id: `notif-cust-cancel-${cleanOrdId}-${Date.now()}`,
            user_id: user?.id || orderData.user_id || null,
            recipient_role: 'client',
            recipient_email: clientEmail,
            title: `⏳ Cancellation Request Submitted`,
            message: `Your cancellation request for Order #${cleanOrdId} has been submitted for studio review. Reason: "${cleanReason.slice(0, 100)}"`,
            type: 'warning',
            order_id: cleanOrdId,
            link: `/client-portal?tab=orders&trackOrder=${cleanOrdId}`,
            read: false,
            created_at: nowIso,
            updated_at: nowIso
          }]);
        } catch (notifErr) {
          console.warn('Customer cancellation notification error:', notifErr.message);
        }
      }

      // Broadcast to live channel
      try {
        const liveChannel = supabase.channel('bdigitizing-live-hub-v2');
        await liveChannel.send({
          type: 'broadcast',
          event: 'cancellation_requested',
          payload: { orderId: cleanOrdId, status: 'cancellation_requested', cancellation: cancelRecord }
        });
        await liveChannel.send({
          type: 'broadcast',
          event: 'order_updated',
          payload: { ...orderData, status: 'cancellation_requested', id: canonicalOrderId, notes: notesObj }
        });
        await liveChannel.send({
          type: 'broadcast',
          event: 'order_change',
          payload: { order: { ...orderData, status: 'cancellation_requested', id: canonicalOrderId, notes: notesObj }, eventType: 'UPDATE' }
        });
      } catch (error) { logServerCaughtError(error, { operation: 'orders.cancellation_requested_broadcast_failed' }); }

      return NextResponse.json({ success: true, status: 'cancellation_requested', cancellation: cancelRecord }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
}
