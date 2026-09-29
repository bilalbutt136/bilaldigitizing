import { withApiObservability, logServerCaughtError } from '../../../../src/lib/observability/apiObservability.js';
import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

async function GET_impl(request) {
  try {
    const { user, isAdmin, isWorker, workerData } = await getServerAuthUser(request);

    if (!user?.email) {
      return NextResponse.json({ authenticated: false, worker: null }, { status: 401 });
    }

    const cleanEmail = user.email.toLowerCase().trim();

    if (isAdmin) {
      return NextResponse.json({
        authenticated: true,
        isAdmin: true,
        worker: {
          id: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name || 'Studio Administrator',
          email: cleanEmail,
          role: 'admin',
          status: 'Active',
          specialty: 'Studio Management'
        }
      });
    }

    if (!isWorker || !workerData) {
      // Resolve a non-active worker status only for a useful denial message.
      let deniedStatus = 'pending';
      let deniedName = user.user_metadata?.full_name || user.user_metadata?.name || cleanEmail.split('@')[0];

      try {
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
          .from('worker_profiles')
          .select('name, status')
          .or(`id.eq.${user.id},email.eq.${cleanEmail}`)
          .maybeSingle();

        if (profile) {
          deniedStatus = String(profile.status || 'pending').toLowerCase();
          deniedName = profile.name || deniedName;
        } else {
          const { data: worker } = await adminClient
            .from('workers')
            .select('name, status')
            .or(`id.eq.${user.id},email.eq.${cleanEmail}`)
            .maybeSingle();

          if (worker) {
            deniedStatus = String(worker.status || 'pending').toLowerCase();
            deniedName = worker.name || deniedName;
          }
        }
      } catch (error) { logServerCaughtError(error, { operation: 'worker.denied_session_lookup_failed' }); }

      return NextResponse.json({
        authenticated: false,
        status: deniedStatus,
        name: deniedName,
        worker: null,
        error: 'Worker account is not active.'
      }, { status: 403 });
    }

    return NextResponse.json({
      authenticated: true,
      worker: {
        id: workerData.id || user.id,
        name: workerData.name || user.user_metadata?.full_name || user.user_metadata?.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: workerData.phone || user.user_metadata?.phone || null,
        specialty: workerData.primary_software || workerData.specialty || 'Embroidery Digitizer',
        status: workerData.status || 'Active',
        role: 'worker'
      }
    });
  } catch (err) {
    console.error('[Worker Session API Error]:', err);
    return NextResponse.json(
      { authenticated: false, worker: null, error: 'Unable to verify worker session.' },
      { status: 500 }
    );
  }
}

export const GET = withApiObservability(GET_impl);
