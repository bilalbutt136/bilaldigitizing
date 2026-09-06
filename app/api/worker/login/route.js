import { NextResponse } from 'next/server';
import { createClient } from '../../../../src/lib/supabase/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { identifier, email, username, password } = body;

    const query = (identifier || email || username || '').trim();
    const cleanPass = (password || '').trim();

    if (!query || !cleanPass) {
      return NextResponse.json({
        success: false,
        error: 'Please enter both your username or email address and password.'
      }, { status: 400 });
    }

    const adminClient = (hasServiceRole && supabaseAdmin) ? supabaseAdmin : createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ success: false, error: 'Database service unavailable.' }, { status: 503 });
    }

    let resolvedEmail = query;

    // 1. If identifier does NOT contain '@', resolve username/name to email
    if (!query.includes('@')) {
      // Check worker_profiles by name (case-insensitive)
      const { data: profileByName } = await adminClient
        .from('worker_profiles')
        .select('email, name')
        .ilike('name', query)
        .maybeSingle();

      if (profileByName?.email) {
        resolvedEmail = profileByName.email;
      } else {
        // Check workers table by name
        const { data: workerByName } = await adminClient
          .from('workers')
          .select('email, name')
          .ilike('name', query)
          .maybeSingle();

        if (workerByName?.email) {
          resolvedEmail = workerByName.email;
        } else {
          // Check worker_profiles where email starts with query
          const { data: profileByPrefix } = await adminClient
            .from('worker_profiles')
            .select('email')
            .ilike('email', `${query}@%`)
            .maybeSingle();

          if (profileByPrefix?.email) {
            resolvedEmail = profileByPrefix.email;
          } else {
            // Check auth.users list
            try {
              const { data: usersList } = await adminClient.auth.admin.listUsers();
              const match = usersList?.users?.find(u => {
                const name = (u.user_metadata?.full_name || u.user_metadata?.name || '').toLowerCase().trim();
                const q = query.toLowerCase().trim();
                const prefix = (u.email || '').split('@')[0].toLowerCase().trim();
                return name === q || prefix === q;
              });

              if (match?.email) {
                resolvedEmail = match.email;
              } else {
                return NextResponse.json({
                  success: false,
                  error: `No digitizer account found matching username "${query}". Please use your registered email address.`
                }, { status: 404 });
              }
            } catch (uErr) {
              console.warn('[User List Search Warning]:', uErr?.message);
              return NextResponse.json({
                success: false,
                error: `Could not find worker account for "${query}".`
              }, { status: 404 });
            }
          }
        }
      }
    }

    resolvedEmail = resolvedEmail.toLowerCase().trim();

    // 2. Authenticate with Supabase Auth using server client (sets cookies on response)
    const supabaseServer = await createClient();
    const { data: authData, error: authError } = await supabaseServer.auth.signInWithPassword({
      email: resolvedEmail,
      password: cleanPass
    });

    if (authError || !authData?.user) {
      return NextResponse.json({
        success: false,
        error: authError?.message || 'Invalid username/email or password combination.'
      }, { status: 401 });
    }

    const user = authData.user;

    // 3. Admin user bypass
    const isAdmin = user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';
    if (isAdmin) {
      return NextResponse.json({
        success: true,
        isAdmin: true,
        user,
        session: authData.session,
        workerProfile: {
          id: user.id,
          name: user.user_metadata?.full_name || 'Studio Administrator',
          email: resolvedEmail,
          role: 'admin',
          status: 'Active'
        }
      });
    }

    // 4. Query worker status from worker_profiles & workers
    let profile = null;
    try {
      const { data: profData } = await adminClient
        .from('worker_profiles')
        .select('*')
        .or(`id.eq.${user.id},email.eq.${resolvedEmail}`)
        .maybeSingle();
      profile = profData;
    } catch {}

    if (!profile) {
      try {
        const { data: workerData } = await adminClient
          .from('workers')
          .select('*')
          .or(`id.eq.${user.id},email.eq.${resolvedEmail}`)
          .maybeSingle();
        if (workerData) profile = workerData;
      } catch {}
    }

    const rawStatus = profile?.status || user.user_metadata?.worker_status || user.user_metadata?.status || 'Pending';
    const normalizedStatus = (rawStatus || '').toLowerCase();
    const displayName = profile?.name || user.user_metadata?.full_name || user.user_metadata?.name || resolvedEmail.split('@')[0];

    // Status check: Pending
    if (normalizedStatus === 'pending') {
      await supabaseServer.auth.signOut();
      return NextResponse.json({
        success: false,
        status: 'pending',
        name: displayName,
        error: 'Your application is currently under review. You will be notified once approved.'
      }, { status: 403 });
    }

    // Status check: Suspended
    if (normalizedStatus === 'suspended') {
      await supabaseServer.auth.signOut();
      return NextResponse.json({
        success: false,
        status: 'suspended',
        name: displayName,
        error: 'Your workstation account is currently suspended. Please contact portal administration.'
      }, { status: 403 });
    }

    // Status check: Rejected
    if (normalizedStatus === 'rejected') {
      await supabaseServer.auth.signOut();
      return NextResponse.json({
        success: false,
        status: 'rejected',
        name: displayName,
        error: 'Your application has been reviewed and was not approved at this time.'
      }, { status: 403 });
    }

    // Active worker: Ensure user metadata in Auth has role: 'worker' and status: 'Active'
    if (user.user_metadata?.role !== 'worker' || user.user_metadata?.status !== 'Active') {
      try {
        await adminClient.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            role: 'worker',
            status: 'Active',
            worker_status: 'Active'
          }
        });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      user,
      session: authData.session,
      workerProfile: {
        id: profile?.id || user.id,
        name: displayName,
        email: resolvedEmail,
        phone: profile?.phone || user.user_metadata?.phone,
        specialty: profile?.primary_software || profile?.specialty || 'Embroidery Digitizer',
        status: profile?.status || 'Active',
        role: 'worker'
      }
    });
  } catch (err) {
    console.error('[Worker Login API Error]:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'An unexpected authentication error occurred.'
    }, { status: 500 });
  }
}
