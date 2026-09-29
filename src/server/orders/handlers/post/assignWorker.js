import { NextResponse } from 'next/server';

export async function handleAssignWorker(context) {
  const { payload, supabase, isAdmin } = context;
      if (!isAdmin) return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
      const { orderId, workerId, workerName: _workerName, workerEmail, instructions, payoutAmount } = payload;

      const { data: targetOrder, error: orderFetchErr } = await supabase
        .from('orders')
        .select('id, title, status, client_name, client_email, notes, worker_payout, quoted_price, quoted_price_pkr')
        .eq('id', orderId)
        .maybeSingle();

      if (orderFetchErr || !targetOrder) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }

      const nowIso = new Date().toISOString();
      const payoutVal = payoutAmount !== undefined ? (parseFloat(payoutAmount) || 0) : (targetOrder.worker_payout || 0);

      const updatePayload = {
        worker_id: workerId,
        worker_status: 'Pending_Worker_Acceptance',
        status: 'assigned',
        worker_assigned_at: nowIso,
        worker_payment_status: 'Unpaid',
        updated_at: nowIso
      };

      if (payoutVal > 0) {
        updatePayload.worker_payout = payoutVal;
        updatePayload.quoted_price_pkr = payoutVal;
        updatePayload.quoted_price = payoutVal;
      }

      if (instructions) {
        updatePayload.admin_worker_feedback = instructions;
      }

      const { error: updateErr } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);

      if (updateErr) throw updateErr;

      // Dispatch notification to Worker to review and enter quote in PKR
      try {
        await supabase.from('notifications').insert([{
          id: `notif-assign-${orderId}-${Date.now()}`,
          user_id: workerId,
          recipient_role: 'worker',
          recipient_email: workerEmail || null,
          title: `🎯 New Task Assigned: ${targetOrder.title || orderId}`,
          message: instructions ? `Admin note: "${instructions.slice(0, 80)}" — Please review requirements and enter your PKR quote to accept.` : 'Please inspect the order specifications and input your quote (PKR) to accept the job.',
          type: 'info',
          link: `/worker?trackOrder=${orderId}`,
          order_id: orderId,
          read: false,
          created_at: nowIso,
          updated_at: nowIso
        }]);
      } catch (notifErr) {
        console.warn('Worker assignment notification notice:', notifErr.message);
      }

      try {
        const liveChannel = supabase.channel('bdigitizing-live-hub-v2');
        await liveChannel.send({
          type: 'broadcast',
          event: 'order_updated',
          payload: { ...targetOrder, ...updatePayload, id: orderId }
        });
        await liveChannel.send({
          type: 'broadcast',
          event: 'order_change',
          payload: { order: { ...targetOrder, ...updatePayload, id: orderId }, eventType: 'UPDATE' }
        });
      } catch (error) { logServerCaughtError(error, { operation: 'orders.assignment_broadcast_failed' }); }

      return NextResponse.json({ success: true, worker_status: 'Pending_Worker_Acceptance', worker_payout: payoutVal }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
}
