import { withApiObservability, logServerCaughtError } from '../../../../src/lib/observability/apiObservability.js';
import { NextResponse } from 'next/server';
import { unstable_cache, revalidateTag } from 'next/cache';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';
import { enforceApiBurstLimit } from '../../../../src/lib/apiBurstGuard.js';

const WORKER_DIRECTORY_TAG = 'admin-workers-directory';

const loadWorkerDirectory = unstable_cache(
  async () => {
    const adminClient = (hasServiceRole && supabaseAdmin) ? supabaseAdmin : createAdminClient();
    if (!adminClient) throw new Error('Database service unavailable');

    const { data, error } = await adminClient.rpc('get_admin_worker_directory');
    if (error) throw error;

    const allWorkers = Array.isArray(data) ? data : [];
    const activeWorkers = allWorkers.filter(worker => {
      const status = String(worker.status || '').toLowerCase();
      return status === 'active' || status === 'busy' || status === 'suspended';
    });
    const applications = allWorkers.filter(worker => {
      const status = String(worker.status || '').toLowerCase();
      return status === 'pending' || status === 'rejected';
    });

    return { allWorkers, activeWorkers, applications };
  },
  ['admin-workers-directory-v5'],
  { revalidate: 30, tags: [WORKER_DIRECTORY_TAG] }
);

async function GET_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'admin-workers-get', 60, 60_000);
  if (burstResponse) return burstResponse;

  try {
    const { user, isAdmin, isWorker } = await getServerAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin && !isWorker) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { allWorkers, activeWorkers, applications } = await loadWorkerDirectory();
    const visibleWorkers = isAdmin
      ? allWorkers
      : activeWorkers.filter(worker => String(worker.status || '').toLowerCase() === 'active');

    return NextResponse.json(
      {
        success: true,
        workers: visibleWorkers,
        activeWorkers: isAdmin ? activeWorkers : visibleWorkers,
        applications: isAdmin ? applications : []
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=15, stale-while-revalidate=30'
        }
      }
    );
  } catch (error) {
    console.error('[Admin Workers API GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function POST_impl(request) {
  let shouldInvalidateWorkerDirectory = false;

  const burstResponse = enforceApiBurstLimit(request, 'admin-workers-post', 30, 60_000);
  if (burstResponse) return burstResponse;

  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user || !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, payload = {} } = body;
    shouldInvalidateWorkerDirectory = new Set([
      'approveWorker',
      'rejectWorker',
      'updateWorkerStatus',
      'suspendWorker',
      'reactivateWorker',
      'markEarningsPaid',
      'createWorker'
    ]).has(action);
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
      } catch (error) { logServerCaughtError(error, { operation: 'workers.profile_lookup_failed' }); }

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
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bdigitizing.com';
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

      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://bdigitizing.com';
      const redirectUrl = `${origin}/worker/reset-password`;

      const { error: resetErr } = await adminClient.auth.resetPasswordForEmail(cleanEmail, {
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
      } catch (error) { logServerCaughtError(error, { operation: 'workers.auth_lookup_failed' }); }

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
  } finally {
    if (shouldInvalidateWorkerDirectory) {
      try {
        revalidateTag(WORKER_DIRECTORY_TAG, 'max');
      } catch (cacheErr) {
        console.warn('[Admin Workers Cache Invalidation Notice]:', cacheErr?.message);
      }
    }
  }
}

export const GET = withApiObservability(GET_impl);
export const POST = withApiObservability(POST_impl);
