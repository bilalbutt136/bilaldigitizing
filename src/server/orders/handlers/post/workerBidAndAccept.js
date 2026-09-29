import { NextResponse } from 'next/server';
import { getServerAuthUser } from '../../../../lib/supabase/serverAuth';

export async function handleWorkerBidAndAccept(context) {
  const { request, payload, supabase, user, isAdmin } = context;
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { orderId, quotedPrice, notes } = payload;

      const { data: targetOrder, error: orderFetchErr } = await supabase
        .from('orders')
        .select('id, title, status, worker_id, client_name, client_email')
        .eq('id', orderId)
        .maybeSingle();

      if (orderFetchErr || !targetOrder) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }

      if (!isAdmin) {
        const { isWorker: _isWorker, workerData } = await getServerAuthUser(request);
        const currentWorkerId = workerData?.id || user.id;
        if (targetOrder.worker_id && targetOrder.worker_id !== currentWorkerId && targetOrder.worker_id !== user.id) {
          return NextResponse.json({ error: 'Forbidden: You are not the assigned worker for this order.' }, { status: 403 });
        }
      }

      const pkrAmount = parseFloat(quotedPrice);
      if (isNaN(pkrAmount) || pkrAmount <= 0) {
        return NextResponse.json({ error: 'A valid quote in PKR (greater than 0) is required to accept this job.' }, { status: 400 });
      }

      const nowIso = new Date().toISOString();
      const updatePayload = {
        quoted_price: pkrAmount,
        quoted_price_pkr: pkrAmount,
        worker_payout: pkrAmount,
        worker_status: 'In_Progress',
        status: 'in_progress',
        worker_payment_status: 'Unpaid',
        worker_accepted_at: nowIso,
        updated_at: nowIso
      };

      if (notes) {
        updatePayload.worker_bid_notes = notes;
      }

      const { error: updateErr } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);

      if (updateErr) throw updateErr;

      // Also record or update worker_earnings in pending state
      try {
        await supabase.from('worker_earnings').upsert([{
          worker_id: targetOrder.worker_id,
          order_id: orderId,
          order_number: String(targetOrder.id),
          amount: pkrAmount,
          status: 'pending',
          notes: `Accepted quote: Rs. ${pkrAmount.toLocaleString()} PKR`,
          created_at: nowIso,
          updated_at: nowIso
        }], { onConflict: 'order_id' });
      } catch (earnErr) {
        console.warn('Worker earnings upsert notice:', earnErr?.message);
      }

      // Notify Admin that worker has submitted PKR quote and accepted
      try {
        await supabase.from('notifications').insert([{
          id: `notif-bid-${orderId}-${Date.now()}`,
          recipient_role: 'admin',
          title: `⚡ Job Accepted: ${targetOrder.title || orderId}`,
          message: `Worker accepted the job with a quote of Rs. ${pkrAmount.toLocaleString()} PKR. Order is now In Progress.`,
          type: 'info',
          link: `/admin-portal?tab=orders&trackOrder=${orderId}`,
          order_id: orderId,
          read: false,
          created_at: nowIso,
          updated_at: nowIso
        }]);
      } catch (notifErr) {
        console.warn('Admin notification notice:', notifErr?.message);
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
      } catch (error) { logServerCaughtError(error, { operation: 'orders.worker_accept_broadcast_failed' }); }

      return NextResponse.json({
        success: true,
        worker_status: 'In_Progress',
        quoted_price_pkr: pkrAmount
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
}
