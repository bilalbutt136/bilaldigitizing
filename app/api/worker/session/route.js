import { NextResponse } from 'next/server';
import { createClient } from '../../../../src/lib/supabase/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';

export async function GET(request) {
  try {
    const supabaseServer = await createClient();
    const adminClient = (hasServiceRole && supabaseAdmin) ? supabaseAdmin : createAdminClient();

    let user = null;

    // 1. Try to get user from cookies via SSR client
    try {
      const { data: authData } = await supabaseServer.auth.getUser();
      user = authData?.user;
    } catch {}

    // 2. If not found in cookies, try Authorization header
    if (!user && adminClient) {
      const authHeader = request.headers.get('authorization') || '';
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '').trim();
        const { data: tokenData } = await adminClient.auth.getUser(token);
        user = tokenData?.user;
      }
    }

    if (!user) {
      return NextResponse.json({ authenticated: false, worker: null }, { status: 401 });
    }

    const cleanEmail = (user.email || '').toLowerCase().trim();

    // 3. Admin user
    const isAdmin = user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';
    if (isAdmin) {
      return NextResponse.json({
        authenticated: true,
        isAdmin: true,
        worker: {
          id: user.id,
          name: user.user_metadata?.full_name || 'Studio Administrator',
          email: cleanEmail,
          role: 'admin',
          status: 'Active',
          specialty: 'Studio Management'
        }
      });
    }

    // 4. Query worker profile
    let profile = null;
    if (adminClient) {
      try {
        const { data: profData } = await adminClient
          .from('worker_profiles')
          .select('*')
          .or(`id.eq.${user.id},email.eq.${cleanEmail}`)
          .maybeSingle();
        profile = profData;
      } catch {}

      if (!profile) {
        try {
          const { data: workerData } = await adminClient
            .from('workers')
            .select('*')
            .or(`id.eq.${user.id},email.eq.${cleanEmail}`)
            .maybeSingle();
          if (workerData) profile = workerData;
        } catch {}
      }
    }

    const rawStatus = profile?.status || user.user_metadata?.worker_status || user.user_metadata?.status || 'Pending';
    const normalizedStatus = (rawStatus || '').toLowerCase();
    const displayName = profile?.name || user.user_metadata?.full_name || user.user_metadata?.name || cleanEmail.split('@')[0];

    if (normalizedStatus !== 'active') {
      return NextResponse.json({
        authenticated: false,
        status: normalizedStatus,
        name: displayName,
        worker: null,
        error: `Worker account status is ${rawStatus}`
      }, { status: 403 });
    }

    return NextResponse.json({
      authenticated: true,
      worker: {
        id: profile?.id || user.id,
        name: displayName,
        email: cleanEmail,
        phone: profile?.phone || user.user_metadata?.phone,
        specialty: profile?.primary_software || profile?.specialty || 'Embroidery Digitizer',
        status: profile?.status || 'Active',
        role: 'worker'
      }
    });
  } catch (err) {
    console.error('[Worker Session API Error]:', err);
    return NextResponse.json({ authenticated: false, worker: null, error: err.message }, { status: 500 });
  }
}
