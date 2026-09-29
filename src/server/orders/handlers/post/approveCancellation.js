import { NextResponse } from 'next/server';

export async function handleApproveCancellation(context) {
  const { payload, supabase, user, isAdmin } = context;
      if (!user || !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
      }
      const { orderId, adminNote } = payload;
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

      let notesObj = {};
      try {
        notesObj = typeof orderData.notes === 'string' && orderData.notes.trim().startsWith('{')
          ? JSON.parse(orderData.notes)
          : (typeof orderData.notes === 'object' && orderData.notes ? orderData.notes : {});
      } catch {
        notesObj = {};
      }

      const cancellation = notesObj.cancellation || {};

      // Strict Idempotency Check: Never issue duplicate refund or double process
      if (cancellation.refund_issued === true) {
        return NextResponse.json({ error: 'A wallet refund has already been issued for this order cancellation.' }, { status: 400 });
      }

      const canonicalOrderId = orderData.id;
      const nowIso = new Date().toISOString();
      const pStatus = (orderData.payment_status || '').toLowerCase();
      const isPaid = pStatus === 'paid' || pStatus === 'completed' || pStatus === 'wallet';
      const refundAmount = parseFloat(orderData.price || orderData.cost || cancellation.amount || 0);

      let refundSuccess = false;
      let finalBalance = null;

      if (isPaid && refundAmount > 0) {
        const clientEmail = (orderData.client_email || '').toLowerCase().trim();
        let clientRecord = null;
        if (orderData.user_id) {
          const { data: byId } = await supabase.from('clients').select('id, email, wallet_balance, name').eq('id', orderData.user_id).maybeSingle();
          if (byId) clientRecord = byId;
        }
        if (!clientRecord && clientEmail) {
          const { data: byEmail } = await supabase.from('clients').select('id, email, wallet_balance, name').ilike('email', clientEmail).maybeSingle();
          if (byEmail) clientRecord = byEmail;
        }

        if (clientRecord) {
          const idempotencyDesc = `Refund for Cancelled Order #${cleanOrdId} (+ $${refundAmount.toFixed(2)})`;
          const { data: existingTx } = await supabase
            .from('transactions')
            .select('id')
            .eq('description', idempotencyDesc)
            .maybeSingle();

          if (!existingTx && !cancellation.refund_issued) {
            const currentBal = parseFloat(clientRecord.wallet_balance || 0);
            finalBalance = parseFloat((currentBal + refundAmount).toFixed(2));
            await supabase.from('clients').update({ wallet_balance: finalBalance, updated_at: nowIso }).eq('id', clientRecord.id);

            await supabase.from('transactions').insert([{
              user_id: clientRecord.id,
              client_email: clientEmail,
              type: 'refund',
              amount: refundAmount,
              payment_method: 'Studio Wallet Refund',
              description: idempotencyDesc,
              created_at: nowIso
            }]);
            refundSuccess = true;
          } else {
            refundSuccess = true;
            finalBalance = parseFloat(clientRecord.wallet_balance || 0);
          }
        }
      }

      cancellation.status = 'approved';
      cancellation.resolved_at = nowIso;
      cancellation.admin_note = (adminNote || '').trim();
      if (refundSuccess) {
        cancellation.refund_issued = true;
        cancellation.refund_amount = refundAmount;
        cancellation.refunded_at = nowIso;
      }
      notesObj.cancellation = cancellation;

      const { error: updateErr } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: isPaid ? 'refunded' : orderData.payment_status,
          notes: JSON.stringify(notesObj),
          updated_at: nowIso
        })
        .eq('id', canonicalOrderId);

      if (updateErr) throw updateErr;

      // Customer Notification
      if (orderData.client_email) {
        try {
          const refundText = refundSuccess
            ? ` $${refundAmount.toFixed(2)} has been credited to your Studio Wallet.`
            : '';
          await supabase.from('notifications').insert([{
            id: `notif-approved-cancel-${cleanOrdId}-${Date.now()}`,
            user_id: orderData.user_id || null,
            recipient_role: 'client',
            recipient_email: orderData.client_email.toLowerCase().trim(),
            title: `✕ Order #${cleanOrdId} Cancellation Approved`,
            message: `Your cancellation request for Order #${cleanOrdId} was approved.${refundText}`,
            type: 'info',
            order_id: cleanOrdId,
            link: `/client-portal?tab=orders&trackOrder=${cleanOrdId}`,
            read: false,
            created_at: nowIso,
            updated_at: nowIso
          }]);
        } catch (notifErr) {
          console.warn('Customer cancel notification error:', notifErr.message);
        }
      }

      // Broadcast to live channel
      try {
        const liveChannel = supabase.channel('bdigitizing-live-hub-v2');
        await liveChannel.send({
          type: 'broadcast',
          event: 'cancellation_approved',
          payload: { orderId: cleanOrdId, status: 'cancelled', refundIssued: refundSuccess, refundAmount }
        });
        await liveChannel.send({
          type: 'broadcast',
          event: 'order_updated',
          payload: { ...orderData, status: 'cancelled', id: canonicalOrderId, payment_status: isPaid ? 'refunded' : orderData.payment_status, notes: notesObj }
        });
        await liveChannel.send({
          type: 'broadcast',
          event: 'order_change',
          payload: { order: { ...orderData, status: 'cancelled', id: canonicalOrderId, payment_status: isPaid ? 'refunded' : orderData.payment_status, notes: notesObj }, eventType: 'UPDATE' }
        });
      } catch (error) { logServerCaughtError(error, { operation: 'orders.cancellation_approved_broadcast_failed' }); }

      return NextResponse.json({
        success: true,
        status: 'cancelled',
        refundIssued: refundSuccess,
        refundAmount: refundSuccess ? refundAmount : 0,
        newBalance: finalBalance
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
}
