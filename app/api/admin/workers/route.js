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

    // 3. Check auth.users for any users with worker role to auto-sync
    let authWorkers = [];
    try {
      const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 100 });
      if (authData?.users) {
        authWorkers = authData.users.filter(u => 
          u.user_metadata?.role === 'worker' || 
          u.user_metadata?.worker_status || 
          u.app_metadata?.role === 'worker'
        );
      }
    } catch (authErr) {
      console.warn('auth workers query notice:', authErr?.message);
    }

    // Merge profiles, directory workers, and auth users into unified worker objects
    const map = new Map();

    // From Auth users first
    authWorkers.forEach(u => {
      const uEmail = (u.email || '').toLowerCase().trim();
      const meta = u.user_metadata || {};
      map.set(u.id || uEmail, {
        id: u.id,
        name: meta.full_name || meta.name || uEmail.split('@')[0],
        email: uEmail,
        phone: meta.phone || null,
        specialty: meta.primary_software || 'Embroidery Digitizer',
        experience_years: meta.experience_years || 1,
        primary_software: meta.primary_software || 'Wilcom',
        status: meta.worker_status || meta.status || 'Pending',
        assigned_orders_count: 0,
        completed_orders_count: 0,
        created_at: u.created_at,
        updated_at: u.updated_at || u.created_at
      });
    });

    directoryWorkers.forEach(w => {
      const key = w.id || (w.email || '').toLowerCase().trim();
      const existing = map.get(key) || {};
      map.set(key, {
        ...existing,
        id: w.id || existing.id,
        name: w.name || existing.name,
        email: w.email || existing.email,
        phone: w.phone || existing.phone,
        specialty: w.specialty || existing.specialty || 'Embroidery Digitizer',
        status: w.status || existing.status || 'Active',
        assigned_orders_count: w.assigned_orders_count || 0,
        completed_orders_count: w.completed_orders_count || 0,
        created_at: w.created_at || existing.created_at,
        updated_at: w.updated_at || existing.updated_at
      });
    });

    profiles.forEach(p => {
      const key = p.id || (p.email || '').toLowerCase().trim();
      const existing = map.get(key) || {};
      map.set(key, {
        ...existing,
        id: p.id || existing.id,
        name: p.name || existing.name,
        email: p.email || existing.email,
        phone: p.phone || existing.phone,
        specialty: p.primary_software || existing.specialty || 'Embroidery Digitizer',
        experience_years: p.experience_years || existing.experience_years || 1,
        primary_software: p.primary_software || existing.primary_software || 'Wilcom',
        portfolio_sample_url: p.portfolio_sample_url,
        portfolio_file_name: p.portfolio_file_name,
        bio: p.bio,
        status: p.status || existing.status || 'Pending',
        rejection_reason: p.rejection_reason,
        total_earned: p.total_earned || 0,
        pending_payout: p.pending_payout || 0,
        created_at: p.created_at || existing.created_at,
        updated_at: p.updated_at || existing.updated_at
      });
    });

    const allWorkers = Array.from(map.values());

    // Auto-heal: Ensure any auth workers not in worker_profiles get saved to worker_profiles
    try {
      for (const w of allWorkers) {
        const hasProfile = profiles.some(p => p.id === w.id || p.email?.toLowerCase() === w.email?.toLowerCase());
        if (!hasProfile && w.id && w.email) {
          adminClient.from('worker_profiles').upsert([{
            id: w.id,
            name: w.name,
            email: w.email,
            phone: w.phone,
            experience_years: w.experience_years || 1,
            primary_software: w.primary_software || 'Wilcom',
            status: w.status || 'Pending',
            created_at: w.created_at || new Date().toISOString()
          }], { onConflict: 'id' }).then(() => {});
        }
      }
    } catch {}

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
              o => o.worker_status === 'Completed' || (o.status || '').toLowerCase() === 'completed'
            ).length;

            // Compute earnings
            if (allEarnings) {
              const we = allEarnings.filter(e => e.worker_id === w.id);
              w.total_earned = we
                .filter(e => (e.status || '').toLowerCase() === 'paid')
                .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
              w.pending_payout = we
                .filter(e => (e.status || '').toLowerCase() === 'pending')
                .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
            }
          });
        }
      } catch (countErr) {
        console.warn('Orders count aggregation notice:', countErr?.message);
      }
    }

    // Separate active workers from pending applications (case-insensitive)
    const activeWorkers = allWorkers.filter(w => {
      const s = (w.status || '').toLowerCase();
      return s === 'active' || s === 'busy' || s === 'suspended';
    });
    const applications = allWorkers.filter(w => {
      const s = (w.status || '').toLowerCase();
      return s === 'pending' || s === 'rejected';
    });

    return NextResponse.json({
      success: true,
      workers: isAdmin ? allWorkers : allWorkers.filter(w => (w.status || '').toLowerCase() === 'active'),
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

      // Fetch worker details for Email 2
      let workerName = 'Digitizer';
      let workerEmail = email;

      try {
        let pQuery = adminClient.from('worker_profiles').select('name, email');
        if (workerId) pQuery = pQuery.eq('id', workerId);
        else pQuery = pQuery.eq('email', email);
        const { data: pData } = await pQuery.maybeSingle();
        if (pData) {
          if (pData.name) workerName = pData.name;
          if (pData.email) workerEmail = pData.email;
        }
      } catch {}

      // Update worker_profiles
      let query = adminClient
        .from('worker_profiles')
        .update({ status: 'Active', updated_at: new Date().toISOString() });
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
            user_metadata: { role: 'worker', status: 'Active', worker_status: 'Active' }
          });
        } catch (authErr) {
          console.warn('[Approve Auth Metadata Warning]:', authErr.message);
        }
      }

      // Dispatch EMAIL 2: Account Approved Notification via Resend
      if (workerEmail) {
        try {
          const { sendWorkerAccountApprovedEmail } = await import('../../../../src/lib/workerPortalEmails');
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bilaldigitizing.vercel.app';
          await sendWorkerAccountApprovedEmail({
            to: workerEmail,
            name: workerName,
            loginUrl: `${siteUrl}/portal/login`
          });
        } catch (emailErr) {
          console.warn('[Admin Approve Email 2 Notice]:', emailErr?.message);
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Worker application approved! Account is now active and activation email dispatched.' 
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
