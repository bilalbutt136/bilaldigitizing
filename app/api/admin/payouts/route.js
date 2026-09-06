import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

export async function GET(request) {
  try {
    const { user, isAdmin, isWorker } = await getServerAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin && !isWorker) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminClient = (hasServiceRole && supabaseAdmin) ? supabaseAdmin : createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const workerIdParam = searchParams.get('workerId') || (isWorker && !isAdmin ? user.id : null);

    // Case 1: Fetch detailed ledger & payouts for a specific worker
    if (workerIdParam) {
      // 1. Fetch Worker Profile
      let workerInfo = null;
      const { data: profile } = await adminClient
        .from('worker_profiles')
        .select('*')
        .eq('id', workerIdParam)
        .maybeSingle();

      if (profile) {
        workerInfo = profile;
      } else {
        const { data: dirWorker } = await adminClient
          .from('workers')
          .select('*')
          .eq('id', workerIdParam)
          .maybeSingle();
        workerInfo = dirWorker || { id: workerIdParam, name: 'Worker', email: '' };
      }

      // 2. Fetch completed / delivered orders assigned to this worker
      const { data: ordersData, error: ordersErr } = await adminClient
        .from('orders')
        .select('id, title, status, worker_status, quoted_price, quoted_price_pkr, worker_payout, worker_payment_status, worker_file_url, created_at, updated_at, client_name')
        .eq('worker_id', workerIdParam)
        .order('created_at', { ascending: false });

      if (ordersErr) {
        console.warn('Payout orders query notice:', ordersErr.message);
      }

      const allOrders = ordersData || [];

      // Filter to completed or delivered orders (or any where worker submitted and completed)
      const completedOrders = allOrders.filter(o => {
        const ws = (o.worker_status || '').toLowerCase();
        const s = (o.status || '').toLowerCase();
        return ws === 'completed' || s === 'completed' || s === 'delivered';
      });

      // Calculate totals
      let totalUnpaidPkr = 0;
      let totalPaidPkr = 0;
      let unpaidOrders = [];
      let paidOrders = [];

      completedOrders.forEach(ord => {
        const costPkr = parseFloat(ord.quoted_price_pkr || ord.quoted_price || ord.worker_payout || 0) || 0;
        const pStatus = (ord.worker_payment_status || 'Unpaid').toLowerCase();

        if (pStatus === 'paid') {
          totalPaidPkr += costPkr;
          paidOrders.push({ ...ord, costPkr, paymentStatus: 'Paid' });
        } else {
          totalUnpaidPkr += costPkr;
          unpaidOrders.push({ ...ord, costPkr, paymentStatus: 'Unpaid' });
        }
      });

      // 3. Fetch past payouts for this worker
      let payouts = [];
      try {
        const { data: payoutsData, error: pErr } = await adminClient
          .from('payouts')
          .select('*')
          .eq('worker_id', workerIdParam)
          .order('created_at', { ascending: false });

        if (!pErr && payoutsData) {
          payouts = payoutsData;
        }
      } catch (err) {
        console.warn('Payouts table query notice:', err.message);
      }

      return NextResponse.json({
        worker: workerInfo,
        orders: completedOrders.map(o => ({
          ...o,
          costPkr: parseFloat(o.quoted_price_pkr || o.quoted_price || o.worker_payout || 0) || 0,
          paymentStatus: (o.worker_payment_status || 'Unpaid') === 'Paid' ? 'Paid' : 'Unpaid'
        })),
        unpaidOrders,
        paidOrders,
        payouts,
        totalUnpaidPkr,
        totalPaidPkr,
        unpaidOrdersCount: unpaidOrders.length,
        paidOrdersCount: paidOrders.length
      });
    }

    // Case 2: Admin overview of all workers & their unpaid balances
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    // Fetch all active/approved workers
    const { data: workerProfiles } = await adminClient
      .from('worker_profiles')
      .select('id, name, email, phone, specialty, primary_software, status')
      .order('name', { ascending: true });

    const { data: allOrders } = await adminClient
      .from('orders')
      .select('id, worker_id, status, worker_status, quoted_price, quoted_price_pkr, worker_payout, worker_payment_status');

    // Aggregate by worker
    const workerBalanceMap = {};
    (workerProfiles || []).forEach(w => {
      workerBalanceMap[w.id] = {
        ...w,
        completedCount: 0,
        unpaidCount: 0,
        unpaidBalancePkr: 0,
        totalEarnedPkr: 0
      };
    });

    (allOrders || []).forEach(ord => {
      if (!ord.worker_id) return;
      const ws = (ord.worker_status || '').toLowerCase();
      const s = (ord.status || '').toLowerCase();
      const isCompleted = ws === 'completed' || s === 'completed' || s === 'delivered';
      if (!isCompleted) return;

      const costPkr = parseFloat(ord.quoted_price_pkr || ord.quoted_price || ord.worker_payout || 0) || 0;
      const isPaid = (ord.worker_payment_status || '').toLowerCase() === 'paid';

      if (!workerBalanceMap[ord.worker_id]) {
        workerBalanceMap[ord.worker_id] = {
          id: ord.worker_id,
          name: 'Worker',
          email: '',
          completedCount: 0,
          unpaidCount: 0,
          unpaidBalancePkr: 0,
          totalEarnedPkr: 0
        };
      }

      workerBalanceMap[ord.worker_id].completedCount += 1;
      workerBalanceMap[ord.worker_id].totalEarnedPkr += costPkr;

      if (!isPaid) {
        workerBalanceMap[ord.worker_id].unpaidCount += 1;
        workerBalanceMap[ord.worker_id].unpaidBalancePkr += costPkr;
      }
    });

    // Recent payouts list
    let recentPayouts = [];
    try {
      const { data: pData } = await adminClient
        .from('payouts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (pData) recentPayouts = pData;
    } catch {}

    return NextResponse.json({
      workers: Object.values(workerBalanceMap),
      recentPayouts
    });

  } catch (error) {
    console.error('[Admin Payouts API GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch ledger' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user || !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, payload } = body;

    const adminClient = (hasServiceRole && supabaseAdmin) ? supabaseAdmin : createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    if (action === 'markAsPaid') {
      const { 
        workerId, 
        workerName, 
        workerEmail, 
        orderIds, 
        paymentMethod, 
        referenceNote, 
        totalAmount, 
        invoicePdfUrl 
      } = payload;

      if (!workerId || !Array.isArray(orderIds) || orderIds.length === 0) {
        return NextResponse.json({ error: 'Worker ID and at least one Order ID are required.' }, { status: 400 });
      }

      const totalVal = parseFloat(totalAmount) || 0;
      const nowIso = new Date().toISOString();
      const payoutNumber = `PAY-PKR-${Date.now().toString().slice(-6)}`;

      // 1. Update all selected orders to Paid
      const { error: updateOrdersErr } = await adminClient
        .from('orders')
        .update({
          worker_payment_status: 'Paid',
          worker_payout_status: 'paid',
          updated_at: nowIso
        })
        .in('id', orderIds);

      if (updateOrdersErr) {
        throw updateOrdersErr;
      }

      // 2. Insert record into public.payouts
      let createdPayout = null;
      try {
        const { data: payoutData, error: payoutErr } = await adminClient
          .from('payouts')
          .insert([{
            payout_number: payoutNumber,
            worker_id: workerId,
            worker_name: workerName || 'Worker',
            worker_email: workerEmail || '',
            total_amount: totalVal,
            currency: 'PKR',
            payment_method: paymentMethod || 'Bank Transfer',
            reference_note: referenceNote || null,
            order_ids: orderIds,
            order_count: orderIds.length,
            invoice_pdf_url: invoicePdfUrl || null,
            created_by: user.id,
            created_at: nowIso,
            updated_at: nowIso
          }])
          .select()
          .single();

        if (payoutErr) {
          console.warn('Payouts table insert notice:', payoutErr.message);
        } else {
          createdPayout = payoutData;
        }
      } catch (pErr) {
        console.warn('Payout record exception:', pErr.message);
      }

      // 3. Update worker_earnings ledger records for this worker & these orders
      try {
        await adminClient
          .from('worker_earnings')
          .update({
            status: 'paid',
            paid_at: nowIso,
            notes: `Paid in Payout #${payoutNumber} via ${paymentMethod || 'Bank'}`
          })
          .eq('worker_id', workerId)
          .in('order_id', orderIds);
      } catch (earnErr) {
        console.warn('worker_earnings update notice:', earnErr.message);
      }

      // 4. Send notification to the Worker
      try {
        await adminClient.from('notifications').insert([{
          id: `notif-payout-${payoutNumber}-${Date.now()}`,
          user_id: workerId,
          recipient_role: 'worker',
          recipient_email: workerEmail || null,
          title: `💰 Payment Dispatched: Rs. ${totalVal.toLocaleString()} PKR`,
          message: `Your payment of Rs. ${totalVal.toLocaleString()} PKR (${orderIds.length} orders) has been settled via ${paymentMethod || 'manual transfer'}. Invoice receipt generated.`,
          type: 'success',
          link: '/worker?tab=earnings',
          order_id: orderIds[0] || null,
          read: false,
          created_at: nowIso,
          updated_at: nowIso
        }]);
      } catch (notifErr) {
        console.warn('Worker payout notification notice:', notifErr.message);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully marked ${orderIds.length} orders as Paid. Payout #${payoutNumber} recorded.`,
        payout: createdPayout || {
          payout_number: payoutNumber,
          worker_id: workerId,
          total_amount: totalVal,
          currency: 'PKR',
          payment_method: paymentMethod || 'Bank Transfer',
          order_ids: orderIds,
          created_at: nowIso
        }
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Admin Payouts API POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to process payout' }, { status: 500 });
  }
}
