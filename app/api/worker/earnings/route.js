import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

export async function GET(request) {
  try {
    const { user, isAdmin, isWorker } = await getServerAuthUser(request);
    if (!user || (!isAdmin && !isWorker)) {
      return NextResponse.json({ error: 'Unauthorized. Worker or Admin credentials required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let targetWorkerId = user.id;

    // If admin, allow specifying workerId or querying all
    if (isAdmin) {
      const requestedId = searchParams.get('workerId');
      if (requestedId) targetWorkerId = requestedId;
      else if (searchParams.get('all') === 'true') targetWorkerId = null;
    }

    const supabase = createAdminClient();

    let query = supabase
      .from('worker_earnings')
      .select('*')
      .order('created_at', { ascending: false });

    if (targetWorkerId) {
      query = query.eq('worker_id', targetWorkerId);
    }

    const { data: ledger, error } = await query;
    if (error) {
      console.warn('[Worker Earnings Fetch Notice]:', error.message);
    }

    const items = ledger || [];

    // Compute totals
    const totalEarned = items
      .filter(item => item.status === 'paid')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const pendingPayout = items
      .filter(item => item.status === 'pending')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    return NextResponse.json({
      success: true,
      workerId: targetWorkerId,
      totalEarned: Number(totalEarned.toFixed(2)),
      pendingPayout: Number(pendingPayout.toFixed(2)),
      count: items.length,
      ledger: items
    });
  } catch (err) {
    console.error('[Worker Earnings GET Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
