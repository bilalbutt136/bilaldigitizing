import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Protected paths that require authentication
const PROTECTED_PREFIXES = ['/admin', '/admin-portal', '/client-portal', '/client', '/dashboard', '/worker', '/worker-portal', '/portal'];

// Admin paths that require admin authorization
const ADMIN_PREFIXES = ['/admin', '/admin-portal'];

// Worker paths that require worker authorization
const WORKER_PREFIXES = ['/worker', '/worker-portal', '/portal'];

// Public authentication routes that MUST NEVER be intercepted or redirected to login
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

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 0. Fast Path: Immediately pass public authentication routes to prevent any redirect chains
  if (PUBLIC_AUTH_PATHS.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return NextResponse.next();
  }

  // 1. Fast Path: Immediately pass all public routes, API routes, and static assets with 0ms latency
  const isProtectedRoute = PROTECTED_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // 2. Fast Cookie Check: If requesting a protected route but has no auth cookies at all, redirect immediately
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    c => c.name.includes('sb-') || c.name.includes('auth-token') || c.name.includes('supabase')
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

  // 3. For protected routes with auth cookies, initialize Supabase with a fail-safe timeout
  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.next();
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
          },
        },
      }
    );

    // Timeout helper to guarantee middleware never hangs beyond 1.5 seconds
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase Auth Timeout')), 1500)
    );

    const userPromise = supabase.auth.getUser();
    const { data: { user } = {} } = await Promise.race([userPromise, timeoutPromise]);

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

    // Check admin authorization if visiting admin portal
    const isAdminRoute = ADMIN_PREFIXES.some(
      prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    if (isAdminRoute && user) {
      const adminPromise = supabase.from('admins').select('email').eq('email', user.email).maybeSingle();
      const { data: adminData } = await Promise.race([adminPromise, timeoutPromise]).catch(() => ({ data: null }));

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

    // Check worker authorization if visiting worker portal
    if (isWorkerRoute && user) {
      const isWorkerMeta = 
        user.user_metadata?.role === 'worker' || 
        user.app_metadata?.role === 'worker' || 
        user.user_metadata?.role === 'admin' ||
        user.app_metadata?.role === 'admin' ||
        (user.user_metadata?.worker_status || '').toLowerCase() === 'active';

      if (!isWorkerMeta) {
        const workerPromise = supabase.from('workers').select('id, status').eq('email', user.email).maybeSingle();
        const { data: workerData } = await Promise.race([workerPromise, timeoutPromise]).catch(() => ({ data: null }));
        const workerStatus = (workerData?.status || '').toLowerCase();

        if (!workerData || workerStatus !== 'active') {
          // Check worker_profiles
          const profilePromise = supabase.from('worker_profiles').select('id, status').eq('email', user.email).maybeSingle();
          const { data: profileData } = await Promise.race([profilePromise, timeoutPromise]).catch(() => ({ data: null }));
          const profileStatus = (profileData?.status || '').toLowerCase();

          if (!profileData || profileStatus !== 'active') {
            // Check if admin
            const adminPromise = supabase.from('admins').select('email').eq('email', user.email).maybeSingle();
            const { data: adminData } = await Promise.race([adminPromise, timeoutPromise]).catch(() => ({ data: null }));

            if (!adminData) {
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
      }
    }

    return supabaseResponse;
  } catch (err) {
    // If Supabase times out or throws at the edge, allow request through to client-side auth verification
    console.warn('Middleware auth verification fallback:', err?.message || err);
    return supabaseResponse;
  }
}

export const config = {
  matcher: [
    /*
     * Match only application pages, excluding static files, images, icons, and API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
