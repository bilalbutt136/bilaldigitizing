import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin, hasServiceRole } from '../supabaseAdmin';
import { createAdminClient } from './admin';

const requestAuthCache = new WeakMap();

function getConfiguredAdminEmails() {
  return [
    process.env.MASTER_ADMIN_EMAIL,
    process.env.ADMIN_EMAIL,
    process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ]
    .filter(Boolean)
    .map(email => String(email).toLowerCase().trim());
}

function normalizeTrustedAccess(data) {
  if (!data || typeof data !== 'object') return null;

  return {
    isAdmin: Boolean(data.is_admin ?? data.isAdmin),
    isWorker: Boolean(data.is_worker ?? data.isWorker),
    workerData: data.worker_data ?? data.workerData ?? null
  };
}

/**
 * Resolve privileged roles for a Supabase Auth user using only trusted,
 * server-controlled sources. user_metadata is intentionally never used
 * for authorization because account owners can edit it themselves.
 *
 * The primary path is one server-only RPC, replacing several independent
 * PostgREST role lookups. The parallel query fallback keeps deployments safe
 * while a new migration is rolling out.
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
    if (typeof dbClient.rpc === 'function') {
      const { data: rpcData, error: rpcError } = await dbClient.rpc(
        'resolve_trusted_user_access',
        { p_email: email }
      );

      if (!rpcError) {
        const normalized = normalizeTrustedAccess(rpcData);
        if (normalized) return normalized;
      } else if (rpcError.code !== 'PGRST202' && rpcError.code !== '42883') {
        console.warn('[resolveTrustedUserAccess RPC Warning]:', rpcError.message);
      }
    }
  } catch (rpcErr) {
    console.warn('[resolveTrustedUserAccess RPC Fallback]:', rpcErr?.message);
  }

  try {
    const [adminResult, clientResult, profileResult, workerResult] = await Promise.all([
      dbClient
        .from('admins')
        .select('email')
        .ilike('email', email)
        .maybeSingle(),
      dbClient
        .from('clients')
        .select('id, email, role')
        .ilike('email', email)
        .maybeSingle(),
      dbClient
        .from('worker_profiles')
        .select('*')
        .ilike('email', email)
        .maybeSingle(),
      dbClient
        .from('workers')
        .select('*')
        .ilike('email', email)
        .maybeSingle()
    ]);

    const adminRecord = adminResult?.data || null;
    const clientRecord = clientResult?.data || null;
    const profileRecord = profileResult?.data || null;
    const workerRecord = workerResult?.data || null;

    if (adminRecord) {
      return { isAdmin: true, isWorker: false, workerData: null };
    }

    if (clientRecord && (clientRecord.role === 'admin' || clientRecord.role === 'staff')) {
      return { isAdmin: true, isWorker: false, workerData: null };
    }

    if (profileRecord && String(profileRecord.status || '').toLowerCase() === 'active') {
      return { isAdmin: false, isWorker: true, workerData: profileRecord };
    }

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

async function getServerAuthUserUncached(request) {
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

/**
 * Request-scoped auth memoization.
 *
 * Next route handlers frequently call getServerAuthUser(request) more than once
 * through nested helpers. Caching the in-flight Promise against the Request
 * object guarantees only one Supabase Auth verification and one trusted-role
 * resolution for that request lifecycle. WeakMap avoids cross-request identity
 * leakage and allows automatic garbage collection after the request completes.
 */
export async function getServerAuthUser(request) {
  const cacheable = request && (typeof request === 'object' || typeof request === 'function');

  if (!cacheable) {
    return getServerAuthUserUncached(request);
  }

  const cached = requestAuthCache.get(request);
  if (cached) return cached;

  const authPromise = getServerAuthUserUncached(request);
  requestAuthCache.set(request, authPromise);
  return authPromise;
}
