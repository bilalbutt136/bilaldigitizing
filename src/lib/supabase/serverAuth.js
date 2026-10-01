import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin, hasServiceRole } from '../supabaseAdmin';
import { createAdminClient } from './admin';

const requestAuthCache = new WeakMap();
const ADMIN_MFA_POLICY_TTL_MS = 5000;
let adminMfaPolicyCache = { value: true, expiresAt: 0 };

export function invalidateAdminMfaPolicyCache() {
  adminMfaPolicyCache = { value: true, expiresAt: 0 };
}

export async function getAdminMfaPolicy(dbClientOverride = null, { force = false } = {}) {
  const now = Date.now();
  if (!force && adminMfaPolicyCache.expiresAt > now) {
    return adminMfaPolicyCache.value;
  }

  let dbClient = dbClientOverride;
  if (!dbClient) {
    try {
      dbClient = (hasServiceRole && supabaseAdmin) ? supabaseAdmin : createAdminClient();
    } catch {
      dbClient = null;
    }
  }

  if (!dbClient || typeof dbClient.rpc !== 'function') {
    // Fail closed: if policy cannot be resolved, require MFA.
    return true;
  }

  try {
    const { data, error } = await dbClient.rpc('admin_mfa_required');
    if (error) {
      if (error.code !== 'PGRST202' && error.code !== '42883') {
        console.warn('[Admin MFA Policy Warning]:', error.message);
      }
      return true;
    }

    const required = data !== false;
    adminMfaPolicyCache = {
      value: required,
      expiresAt: now + ADMIN_MFA_POLICY_TTL_MS
    };
    return required;
  } catch (error) {
    console.warn('[Admin MFA Policy Failure]:', error?.message);
    return true;
  }
}

function getVerifiedJwtAal(token) {
  if (!token) return 'aal1';
  try {
    const parts = String(token).split('.');
    if (parts.length < 2) return 'aal1';
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload?.aal === 'aal2' ? 'aal2' : 'aal1';
  } catch {
    return 'aal1';
  }
}

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
        // The RPC exists in current production. If it fails because the database
        // is saturated or a statement times out, do not amplify one failing auth
        // check into four additional role queries. Fail closed on privileges.
        return { isAdmin: false, isWorker: false, workerData: null };
      }
    }
  } catch (rpcErr) {
    console.warn('[resolveTrustedUserAccess RPC Failure]:', rpcErr?.message);
    // The RPC is deployed in production. A thrown network/database failure is
    // not a reason to fan out into four more queries while the backend is unhealthy.
    return { isAdmin: false, isWorker: false, workerData: null };
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
    let authLevel = 'aal1';

    const authHeader = request?.headers?.get('Authorization') || request?.headers?.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token) {
        if (hasServiceRole && supabaseAdmin) {
          try {
            const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
            if (!userError && userData?.user) {
              user = userData.user;
              authLevel = getVerifiedJwtAal(token);
            }
          } catch {}
        }

        if (!user) {
          try {
            const adminSb = createAdminClient();
            const { data: fallbackUserData, error: fallbackError } = await adminSb.auth.getUser(token);
            if (!fallbackError && fallbackUserData?.user) {
              user = fallbackUserData.user;
              authLevel = getVerifiedJwtAal(token);
            }
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
        if (!cookieError && cookieAuthData?.user) {
          user = cookieAuthData.user;
          try {
            const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (!aalError && aalData?.currentLevel === 'aal2') {
              authLevel = 'aal2';
            }
          } catch {}
        }
      } catch {
        // Bearer authentication may still have succeeded above.
      }
    }

    if (!user?.email) {
      return {
        user: null,
        isAdmin: false,
        isAdminIdentity: false,
        isWorker: false,
        workerData: null,
        authLevel: 'aal1',
        mfaEnabled: false,
        mfaRequired: false,
        error: 'Unauthenticated'
      };
    }

    const access = await resolveTrustedUserAccess(user);
    const isAdminIdentity = Boolean(access?.isAdmin);
    const mfaEnabled = isAdminIdentity ? await getAdminMfaPolicy() : false;
    const isAdmin = isAdminIdentity && (!mfaEnabled || authLevel === 'aal2');

    return {
      user,
      ...access,
      isAdminIdentity,
      isAdmin,
      authLevel,
      mfaEnabled,
      mfaRequired: isAdminIdentity && mfaEnabled && authLevel !== 'aal2',
      error: null
    };
  } catch (err) {
    console.error('[getServerAuthUser Exception]:', err);
    return {
      user: null,
      isAdmin: false,
      isAdminIdentity: false,
      isWorker: false,
      workerData: null,
      authLevel: 'aal1',
      mfaEnabled: false,
      mfaRequired: false,
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
