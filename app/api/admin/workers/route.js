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

    // 1. Fetch from worker_profiles (preferred rich source)
    let profiles = [];
    try {
      const { data, error } = await adminClient
        .from('worker_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        profiles = data;
      }
    } catch (err) {
      console.warn('worker_profiles query notice:', err?.message);
    }

    // 2. Fetch from workers table as well to merge
    let directoryWorkers = [];
    try {
      const { data, error } = await adminClient
        .from('workers')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data) {
        directoryWorkers = data;
      }
    } catch (err) {
      console.warn('workers directory query notice:', err?.message);
    }

    // Merge profiles and directory workers into unified worker objects
    const map = new Map();

    directoryWorkers.forEach(w => {
      map.set(w.id || w.email, {
        id: w.id,
        name: w.name,
        email: w.email,
        phone: w.phone,
        specialty: w.specialty || 'Embroidery Digitizer',
        status: w.status || 'active',
        assigned_orders_count: w.assigned_orders_count || 0,
        completed_orders_count: w.completed_orders_count || 0,
        created_at: w.created_at,
        updated_at: w.updated_at
      });
    });

    profiles.forEach(p => {
      const existing = map.get(p.id || p.email) || {};
      map.set(p.id || p.email, {
        ...existing,
        id: p.id || existing.id,
        name: p.name || existing.name,
        email: p.email || existing.email,
        phone: p.phone || existing.phone,
        specialty: p.primary_software || existing.specialty || 'Embroidery Digitizer',
        experience_years: p.experience_years || 1,
        primary_software: p.primary_software || 'Wilcom',
        portfolio_sample_url: p.portfolio_sample_url,
        portfolio_file_name: p.portfolio_file_name,
        bio: p.bio,
        status: p.status || existing.status || 'pending',
        rejection_reason: p.rejection_reason,
        total_earned: p.total_earned || 0,
        pending_payout: p.pending_payout || 0,
        created_at: p.created_at || existing.created_at,
        updated_at: p.updated_at || existing.updated_at
      });
    });

    const allWorkers = Array.from(map.values());

    // Compute live order counts and earnings per worker if admin
    if (isAdmin) {
      try {
        const { data: allOrders } = await adminClient
          .from('orders')
          .select('id, worker_id, status, worker_status, worker_payout, worker_payout_status');

        const { data: allEarnings } = await adminClient
          .from('worker_earnings')
          .select('worker_id, amount, status');

        if (allOrders) {
          allWorkers.forEach(w => {
            const workerOrders = allOrders.filter(o => o.worker_id === w.id);
            w.assigned_orders_count = workerOrders.length;
            w.completed_orders_count = workerOrders.filter(
              o => o.worker_status === 'Completed' || o.status === 'completed'
            ).length;

            // Compute earnings
            if (allEarnings) {
              const we = allEarnings.filter(e => e.worker_id === w.id);
              w.total_earned = we
                .filter(e => e.status === 'paid')
                .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
              w.pending_payout = we
                .filter(e => e.status === 'pending')
                .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
            }
          });
        }
      } catch (countErr) {
        console.warn('Orders count aggregation notice:', countErr?.message);
      }
    }

    // Separate active workers from pending applications
    const activeWorkers = allWorkers.filter(w => w.status === 'active' || w.status === 'busy' || w.status === 'suspended');
    const applications = allWorkers.filter(w => w.status === 'pending' || w.status === 'rejected');

    return NextResponse.json({
      success: true,
      workers: isAdmin ? allWorkers : allWorkers.filter(w => w.status === 'active'),
      activeWorkers,
      applications
    });
  } catch (error) {
    console.error('[Admin Workers API GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user || !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, payload = {} } = body;
    const adminClient = (hasServiceRole && supabaseAdmin) ? supabaseAdmin : createAdminClient();

    if (!adminClient) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // 1. APPROVE WORKER APPLICATION
    if (action === 'approveWorker') {
      const { workerId, email } = payload;
      if (!workerId && !email) {
        return NextResponse.json({ error: 'Worker ID or email is required.' }, { status: 400 });
      }

      // Update worker_profiles
      let query = adminClient
        .from('worker_profiles')
        .update({ status: 'active', updated_at: new Date().toISOString() });
      if (workerId) query = query.eq('id', workerId);
      else query = query.eq('email', email);
      await query;

      // Update workers directory
      let wQuery = adminClient
        .from('workers')
        .update({ status: 'active', updated_at: new Date().toISOString() });
      if (workerId) wQuery = wQuery.eq('id', workerId);
      else wQuery = wQuery.eq('email', email);
      await wQuery;

      // Update Supabase Auth user metadata
      if (workerId) {
        try {
          await adminClient.auth.admin.updateUserById(workerId, {
            user_metadata: { role: 'worker', status: 'active', worker_status: 'active' }
          });
        } catch (authErr) {
          console.warn('[Approve Auth Metadata Warning]:', authErr.message);
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Worker application approved! Account is now active.' 
      });
    }

    // 2. REJECT WORKER APPLICATION
    if (action === 'rejectWorker') {
      const { workerId, email, reason } = payload;
      if (!workerId && !email) {
        return NextResponse.json({ error: 'Worker ID or email is required.' }, { status: 400 });
      }

      let query = adminClient
        .from('worker_profiles')
        .update({ 
          status: 'rejected', 
          rejection_reason: reason || 'Requirements not met at this time',
          updated_at: new Date().toISOString() 
        });
      if (workerId) query = query.eq('id', workerId);
      else query = query.eq('email', email);
      await query;

      let wQuery = adminClient
        .from('workers')
        .update({ status: 'rejected', updated_at: new Date().toISOString() });
      if (workerId) wQuery = wQuery.eq('id', workerId);
      else wQuery = wQuery.eq('email', email);
      await wQuery;

      return NextResponse.json({ 
        success: true, 
        message: 'Application marked as rejected.' 
      });
    }

    // 3. SUSPEND OR REACTIVATE WORKER
    if (action === 'updateWorkerStatus' || action === 'suspendWorker' || action === 'reactivateWorker') {
      const { workerId, status } = payload;
      const newStatus = action === 'suspendWorker' ? 'suspended' : (action === 'reactivateWorker' ? 'active' : status);

      await adminClient
        .from('worker_profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', workerId);

      await adminClient
        .from('workers')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', workerId);

      return NextResponse.json({ 
        success: true, 
        status: newStatus,
        message: `Worker account status set to ${newStatus}.` 
      });
    }

    // 4. SEND PASSWORD RESET EMAIL
    if (action === 'sendPasswordReset') {
      const { email } = payload;
      const cleanEmail = (email || '').toLowerCase().trim();
      if (!cleanEmail) {
        return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 });
      }

      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://bilaldigitizing.vercel.app';
      const redirectUrl = `${origin}/worker/reset-password`;

      const { data, error: resetErr } = await adminClient.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl
      });

      if (resetErr) {
        return NextResponse.json({ error: resetErr.message }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        message: `Secure password reset link dispatched to ${cleanEmail}.` 
      });
    }

    // 5. MARK EARNINGS AS PAID
    if (action === 'markEarningsPaid') {
      const { earningId, workerId, orderId } = payload;

      let updateQuery = adminClient
        .from('worker_earnings')
        .update({ 
          status: 'paid', 
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        });

      if (earningId) {
        updateQuery = updateQuery.eq('id', earningId);
      } else if (orderId) {
        updateQuery = updateQuery.eq('order_id', orderId);
      } else if (workerId) {
        updateQuery = updateQuery.eq('worker_id', workerId).eq('status', 'pending');
      } else {
        return NextResponse.json({ error: 'earningId, orderId, or workerId required.' }, { status: 400 });
      }

      const { error: earnErr } = await updateQuery;
      if (earnErr) throw earnErr;

      // Also update orders table if orderId is provided
      if (orderId) {
        await adminClient
          .from('orders')
          .update({ worker_payout_status: 'paid' })
          .eq('id', orderId);
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Payout marked as paid in ledger.' 
      });
    }

    // 6. CREATE WORKER DIRECTLY (Admin Manual Add)
    if (action === 'createWorker') {
      const { email, name, phone, specialty } = payload;
      const cleanEmail = (email || '').toLowerCase().trim();
      const cleanName = (name || '').trim();

      if (!cleanEmail || !cleanName) {
        return NextResponse.json({ error: 'Worker name and valid email are required.' }, { status: 400 });
      }

      let userId = null;
      try {
        const { data: authUserData } = await adminClient.auth.admin.listUsers();
        const matched = authUserData?.users?.find(u => u.email?.toLowerCase().trim() === cleanEmail);
        if (matched) userId = matched.id;
      } catch {}

      const workerRecord = {
        name: cleanName,
        email: cleanEmail,
        phone: phone || null,
        specialty: specialty || 'Embroidery Digitizer',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (userId) workerRecord.id = userId;

      const { data: newWorker, error: insertErr } = await adminClient
        .from('workers')
        .insert([workerRecord])
        .select()
        .single();

      if (insertErr) throw insertErr;

      return NextResponse.json({ success: true, worker: newWorker });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Admin Workers API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
