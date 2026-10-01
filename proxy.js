import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const ADMIN_PREFIXES = ['/admin', '/admin-portal'];
const CLIENT_PREFIXES = ['/client', '/client-portal'];
const WORKER_PREFIXES = ['/worker', '/worker-portal', '/portal'];
const PROTECTED_PREFIXES = [...ADMIN_PREFIXES, ...CLIENT_PREFIXES, ...WORKER_PREFIXES];

const AUTH_VERIFY_TIMEOUT_MS = 5000;
const ROLE_LOOKUP_TIMEOUT_MS = 3500;

const PUBLIC_AUTH_PATHS = [
  '/login',
  '/signup',
  '/reset-password',
  '/secure-admin-login',
  '/worker-login',
  '/worker/register',
  '/worker-register',
  '/worker/forgot-password',
  '/worker/reset-password',
  '/portal/login',
  '/portal/register',
  '/portal/forgot-password',
  '/portal/reset-password',
  '/auth-unavailable',
  '/auth',
  '/auth/callback'
];

function withTimeout(promise, timeoutMs = AUTH_VERIFY_TIMEOUT_MS, label = 'Authentication request') {
  let timer = null;

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        const error = new Error(`${label} timed out after ${timeoutMs}ms`);
        error.name = 'AuthenticationTimeoutError';
        reject(error);
      }, timeoutMs);
    })
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function isConfiguredAdmin(email) {
  const cleanEmail = String(email || '').toLowerCase().trim();
  if (!cleanEmail) return false;

  return [
    process.env.MASTER_ADMIN_EMAIL,
    process.env.ADMIN_EMAIL,
    process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ]
    .filter(Boolean)
    .some(value => String(value).toLowerCase().trim() === cleanEmail);
}

function hasTrustedAdminMetadata(user) {
  return Boolean(
    user?.app_metadata?.role === 'admin' ||
    user?.app_metadata?.is_admin === true ||
    isConfiguredAdmin(user?.email)
  );
}

function getLoginUrl(request, pathname, isWorkerRoute) {
  const loginUrl = request.nextUrl.clone();

  if (pathname === '/portal' || pathname.startsWith('/portal/')) {
    loginUrl.pathname = '/portal/login';
  } else if (ADMIN_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    loginUrl.pathname = '/secure-admin-login';
  } else if (isWorkerRoute) {
    loginUrl.pathname = '/worker-login';
  } else {
    loginUrl.pathname = '/login';
  }

  loginUrl.search = '';
  loginUrl.searchParams.set('redirect', pathname);
  return loginUrl;
}

function getAdminMfaUrl(request) {
  const mfaUrl = request.nextUrl.clone();
  const originalTarget = `${request.nextUrl.pathname}${request.nextUrl.search || ''}`;
  mfaUrl.pathname = '/secure-admin-login';
  mfaUrl.search = '';
  mfaUrl.searchParams.set('mfa', 'required');
  mfaUrl.searchParams.set('redirect', originalTarget);
  return mfaUrl;
}

function copyResponseCookies(sourceResponse, targetResponse) {
  sourceResponse?.cookies?.getAll?.().forEach(cookie => {
    targetResponse.cookies.set(cookie.name, cookie.value, cookie);
  });
  return targetResponse;
}

function getAuthUnavailableResponse(request) {
  const unavailableUrl = request.nextUrl.clone();
  const originalTarget = `${request.nextUrl.pathname}${request.nextUrl.search || ''}`;

  unavailableUrl.pathname = '/auth-unavailable';
  unavailableUrl.search = '';
  unavailableUrl.searchParams.set('redirect', originalTarget);

  const response = NextResponse.redirect(unavailableUrl, 307);
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  response.headers.set('Retry-After', '5');
  return response;
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_AUTH_PATHS.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return NextResponse.next();
  }

  const isProtectedRoute = PROTECTED_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    cookie =>
      cookie.name.includes('sb-') ||
      cookie.name.includes('auth-token') ||
      cookie.name.includes('supabase') ||
      cookie.name.includes('bdigi_auth')
  );

  const isWorkerRoute = WORKER_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!hasAuthCookie) {
    return NextResponse.redirect(getLoginUrl(request, pathname, isWorkerRoute));
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Proxy authentication configuration is missing.');
      return getAuthUnavailableResponse(request);
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          }
        }
      }
    );

    const authResult = await withTimeout(
      supabase.auth.getUser(),
      AUTH_VERIFY_TIMEOUT_MS,
      'Supabase authentication verification'
    );
    const user = authResult?.data?.user || null;

    if (!user) {
      const redirectResponse = NextResponse.redirect(getLoginUrl(request, pathname, isWorkerRoute));
      return copyResponseCookies(supabaseResponse, redirectResponse);
    }

    const isAdminRoute = ADMIN_PREFIXES.some(
      prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    const isClientRoute = CLIENT_PREFIXES.some(
      prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    let isAdminIdentity = hasTrustedAdminMetadata(user);

    if (!isAdminIdentity && (isAdminRoute || isClientRoute)) {
      const adminResult = await withTimeout(
        supabase
          .from('admins')
          .select('email')
          .ilike('email', user.email)
          .maybeSingle(),
        ROLE_LOOKUP_TIMEOUT_MS,
        'Admin authorization verification'
      );

      if (adminResult?.error) {
        throw new Error('Admin authorization lookup failed.');
      }
      isAdminIdentity = Boolean(adminResult?.data);
    }

    // Admin and client workspaces are mutually exclusive. An administrator
    // account can never fall through into the customer portal.
    if (isClientRoute && isAdminIdentity) {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = '/admin-portal';
      adminUrl.search = '';
      const redirectResponse = NextResponse.redirect(adminUrl);
      return copyResponseCookies(supabaseResponse, redirectResponse);
    }

    if (isAdminRoute) {
      if (!isAdminIdentity) {
        const clientUrl = request.nextUrl.clone();
        clientUrl.pathname = '/client-portal';
        clientUrl.search = '';
        const redirectResponse = NextResponse.redirect(clientUrl);
        return copyResponseCookies(supabaseResponse, redirectResponse);
      }

      const aalResult = await withTimeout(
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        AUTH_VERIFY_TIMEOUT_MS,
        'Admin MFA assurance verification'
      );

      if (aalResult?.error) {
        throw new Error('Admin MFA assurance verification failed.');
      }

      if (aalResult?.data?.currentLevel !== 'aal2') {
        const redirectResponse = NextResponse.redirect(getAdminMfaUrl(request), 307);
        return copyResponseCookies(supabaseResponse, redirectResponse);
      }
    }

    if (isWorkerRoute) {
      const hasTrustedMetadata =
        user.app_metadata?.role === 'worker' ||
        user.app_metadata?.role === 'admin' ||
        user.app_metadata?.is_admin === true ||
        isConfiguredAdmin(user.email);

      if (!hasTrustedMetadata) {
        const [workerResult, profileResult, adminResult] = await Promise.all([
          withTimeout(
            supabase
              .from('workers')
              .select('id, status')
              .ilike('email', user.email)
              .maybeSingle(),
            ROLE_LOOKUP_TIMEOUT_MS,
            'Worker authorization verification'
          ),
          withTimeout(
            supabase
              .from('worker_profiles')
              .select('id, status')
              .ilike('email', user.email)
              .maybeSingle(),
            ROLE_LOOKUP_TIMEOUT_MS,
            'Worker profile authorization verification'
          ),
          withTimeout(
            supabase
              .from('admins')
              .select('email')
              .ilike('email', user.email)
              .maybeSingle(),
            ROLE_LOOKUP_TIMEOUT_MS,
            'Worker admin authorization verification'
          )
        ]);

        const workerStatus = String(workerResult?.data?.status || '').toLowerCase();
        const profileStatus = String(profileResult?.data?.status || '').toLowerCase();
        const isAuthorized =
          workerStatus === 'active' ||
          profileStatus === 'active' ||
          Boolean(adminResult?.data);

        const lookupFailed = Boolean(
          workerResult?.error ||
          profileResult?.error ||
          adminResult?.error
        );

        if (!isAuthorized && lookupFailed) {
          throw new Error('Worker authorization lookup failed.');
        }

        if (!isAuthorized) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = pathname.startsWith('/portal') ? '/portal/login' : '/client-portal';
          redirectUrl.search = '';
          const redirectResponse = NextResponse.redirect(redirectUrl);
          return copyResponseCookies(supabaseResponse, redirectResponse);
        }
      }
    }

    return supabaseResponse;
  } catch (err) {
    console.warn('Middleware auth verification failed closed:', err?.message || err);
    return getAuthUnavailableResponse(request);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)'
  ]
};
