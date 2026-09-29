import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin, hasServiceRole } from '../supabaseAdmin';
import { createAdminClient } from './admin';

function getConfiguredAdminEmails() {
  return [
    process.env.MASTER_ADMIN_EMAIL,
    process.env.ADMIN_EMAIL,
    process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ]
    .filter(Boolean)
    .map(email => String(email).toLowerCase().trim());
}

/**
 * Resolve privileged roles for a Supabase Auth user using only trusted,
 * server-controlled sources. user_metadata is intentionally never used
 * for authorization because account owners can edit it themselves.
 */
export async function resolveTrustedUserAccess(user, dbClientOverride = null) {
  if (!user?.email) {
    return { isAdmin: false, isWorker: false, workerData: null };
  }

  const email = String(user.email).toLowerCase().trim();
  const configuredAdmins = getConfiguredAdminEmails();

  if (configuredAdmins.includes(email)) {
    return { isAdmin: true, isWorker: false, workerData: null };
  }

  if (user.app_metadata?.role === 'admin' || user.app_metadata?.is_admin === true) {
    return { isAdmin: true, isWorker: false, workerData: null };
  }

  let dbClient = dbClientOverride;
  if (!dbClient) {
    try {
      dbClient = (hasServiceRole && supabaseAdmin) ? supabaseAdmin : createAdminClient();
    } catch {
      dbClient = null;
    }
  }

  if (!dbClient) {
    return { isAdmin: false, isWorker: false, workerData: null };
  }

  try {
    const { data: adminRecord } = await dbClient
      .from('admins')
      .select('email')
      .ilike('email', email)
      .maybeSingle();

    if (adminRecord) {
      return { isAdmin: true, isWorker: false, workerData: null };
    }

    const { data: clientRecord } = await dbClient
      .from('clients')
      .select('id, email, role')
      .ilike('email', email)
      .maybeSingle();

    if (clientRecord && (clientRecord.role === 'admin' || clientRecord.role === 'staff')) {
      return { isAdmin: true, isWorker: false, workerData: null };
    }

    const { data: profileRecord } = await dbClient
      .from('worker_profiles')
      .select('*')
      .ilike('email', email)
      .maybeSingle();

    if (profileRecord && String(profileRecord.status || '').toLowerCase() === 'active') {
      return { isAdmin: false, isWorker: true, workerData: profileRecord };
    }

    const { data: workerRecord } = await dbClient
      .from('workers')
      .select('*')
      .ilike('email', email)
      .maybeSingle();

    if (workerRecord && String(workerRecord.status || '').toLowerCase() === 'active') {
      return { isAdmin: false, isWorker: true, workerData: workerRecord };
    }

    if (clientRecord?.role === 'worker') {
      return { isAdmin: false, isWorker: true, workerData: clientRecord };
    }
  } catch (dbErr) {
    console.warn('[resolveTrustedUserAccess DB Check Warning]:', dbErr?.message);
  }

  return { isAdmin: false, isWorker: false, workerData: null };
}

/**
 * Retrieves and validates the authenticated user and trusted role server-side.
 * Inspects both Authorization Bearer tokens and Supabase SSR cookies.
 */
export async function getServerAuthUser(request) {
  try {
    let user = null;

    const authHeader = request?.headers?.get('Authorization') || request?.headers?.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token) {
        if (hasServiceRole && supabaseAdmin) {
          try {
            const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
            if (!userError && userData?.user) user = userData.user;
          } catch {}
        }

        if (!user) {
          try {
            const adminSb = createAdminClient();
            const { data: fallbackUserData, error: fallbackError } = await adminSb.auth.getUser(token);
            if (!fallbackError && fallbackUserData?.user) user = fallbackUserData.user;
          } catch {}
        }
      }
    }

    if (!user) {
      try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          {
            cookies: {
              getAll() {
                return cookieStore.getAll();
              },
              setAll(cookiesToSet) {
                try {
                  cookiesToSet.forEach(({ name, value, options }) => {
                    cookieStore.set(name, value, options);
                  });
                } catch {
                  // Ignore cookie refresh failures after headers have been committed.
                }
              }
            }
          }
        );

        const { data: cookieAuthData, error: cookieError } = await supabase.auth.getUser();
        if (!cookieError && cookieAuthData?.user) user = cookieAuthData.user;
      } catch {
        // Bearer authentication may still have succeeded above.
      }
    }

    if (!user?.email) {
      return {
        user: null,
        isAdmin: false,
        isWorker: false,
        workerData: null,
        error: 'Unauthenticated'
      };
    }

    const access = await resolveTrustedUserAccess(user);
    return { user, ...access, error: null };
  } catch (err) {
    console.error('[getServerAuthUser Exception]:', err);
    return {
      user: null,
      isAdmin: false,
      isWorker: false,
      workerData: null,
      error: err.message
    };
  }
}
