import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_PREFIXES = ['/admin', '/admin-portal', '/worker', '/worker-portal', '/portal'];
const ADMIN_PREFIXES = ['/admin', '/admin-portal'];
const WORKER_PREFIXES = ['/worker', '/worker-portal', '/portal'];

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
  '/auth',
  '/auth/callback'
];

function withTimeout(promise, timeoutMs = 1500) {
  let timer = null;

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Supabase Auth Timeout')), timeoutMs);
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
    const loginUrl = request.nextUrl.clone();

    if (pathname === '/portal' || pathname.startsWith('/portal/')) {
      loginUrl.pathname = '/portal/login';
    } else if (isWorkerRoute) {
      loginUrl.pathname = '/worker-login';
    } else {
      loginUrl.pathname = '/login';
    }

    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Authentication service is unavailable.' },
        { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '30' } }
      );
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

    const {
      data: { user } = {}
    } = await withTimeout(supabase.auth.getUser());

    if (!user) {
      const loginUrl = request.nextUrl.clone();

      if (pathname === '/portal' || pathname.startsWith('/portal/')) {
        loginUrl.pathname = '/portal/login';
      } else if (isWorkerRoute) {
        loginUrl.pathname = '/worker-login';
      } else {
        loginUrl.pathname = '/login';
      }

      loginUrl.searchParams.set('redirect', pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      supabaseResponse.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirectResponse;
    }

    const isAdminRoute = ADMIN_PREFIXES.some(
      prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    if (isAdminRoute && !hasTrustedAdminMetadata(user)) {
      const { data: adminData } = await withTimeout(
        supabase
          .from('admins')
          .select('email')
          .ilike('email', user.email)
          .maybeSingle()
      ).catch(() => ({ data: null }));

      if (!adminData) {
        const clientUrl = request.nextUrl.clone();
        clientUrl.pathname = '/client-portal';
        const redirectResponse = NextResponse.redirect(clientUrl);
        supabaseResponse.cookies.getAll().forEach(cookie => {
          redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        return redirectResponse;
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
              .maybeSingle()
          ).catch(() => ({ data: null })),
          withTimeout(
            supabase
              .from('worker_profiles')
              .select('id, status')
              .ilike('email', user.email)
              .maybeSingle()
          ).catch(() => ({ data: null })),
          withTimeout(
            supabase
              .from('admins')
              .select('email')
              .ilike('email', user.email)
              .maybeSingle()
          ).catch(() => ({ data: null }))
        ]);

        const workerStatus = String(workerResult?.data?.status || '').toLowerCase();
        const profileStatus = String(profileResult?.data?.status || '').toLowerCase();
        const isAuthorized =
          workerStatus === 'active' ||
          profileStatus === 'active' ||
          Boolean(adminResult?.data);

        if (!isAuthorized) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = pathname.startsWith('/portal') ? '/portal/login' : '/client-portal';
          const redirectResponse = NextResponse.redirect(redirectUrl);
          supabaseResponse.cookies.getAll().forEach(cookie => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
          });
          return redirectResponse;
        }
      }
    }

    return supabaseResponse;
  } catch (err) {
    console.warn('Middleware auth verification failed closed:', err?.message || err);
    return NextResponse.json(
      { error: 'Authentication verification is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '15' } }
    );
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)'
  ]
};
