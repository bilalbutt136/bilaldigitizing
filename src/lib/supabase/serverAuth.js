import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin, hasServiceRole } from '../supabaseAdmin';

/**
 * Retrieves and validates the authenticated user and admin status server-side.
 * Inspects both 'Authorization: Bearer <token>' headers and HTTP-only session cookies.
 *
 * @param {Request} request - The incoming Next.js Request object
 * @returns {Promise<{ user: import('@supabase/supabase-js').User | null, isAdmin: boolean, error: string | null }>}
 */
export async function getServerAuthUser(request) {
  try {
    let user = null;

    // 1. Check Authorization Bearer Header (Mobile, CLI, direct API calls)
    const authHeader = request?.headers?.get('Authorization') || request?.headers?.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token && hasServiceRole && supabaseAdmin) {
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (!userError && userData?.user) {
          user = userData.user;
        }
      }
    }

    // 2. Check Next.js Cookies via @supabase/ssr
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
                  // Ignore setAll in Server Components / Route Handlers if headers already sent
                }
              },
            },
          }
        );
        const { data: cookieAuthData, error: cookieError } = await supabase.auth.getUser();
        if (!cookieError && cookieAuthData?.user) {
          user = cookieAuthData.user;
        }
      } catch (cookieErr) {
        // Continue if cookie resolution fails
      }
    }

    if (!user || !user.email) {
      return { user: null, isAdmin: false, error: 'Unauthenticated' };
    }

    const email = user.email.toLowerCase().trim();

    // 3. Master Admin & Configured Admin Email Check
    const masterAdmin = (process.env.MASTER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'bilalbutt136@gmail.com').toLowerCase().trim();
    if (masterAdmin && (email === masterAdmin || email === 'bilaldigitizing@gmail.com' || email === 'bilalbutt136@gmail.com')) {
      return { user, isAdmin: true, error: null };
    }

    // 4. Metadata Role Check (Supabase auth user_metadata or app_metadata)
    if (user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin' || user.user_metadata?.is_admin === true) {
      return { user, isAdmin: true, error: null };
    }

    // 5. Database Admins Whitelist Check using service role
    if (hasServiceRole && supabaseAdmin) {
      const { data: adminRecord } = await supabaseAdmin
        .from('admins')
        .select('email')
        .ilike('email', email)
        .maybeSingle();

      if (adminRecord) {
        return { user, isAdmin: true, error: null };
      }

      // Also check clients table if role === 'admin' or 'staff'
      const { data: clientRecord } = await supabaseAdmin
        .from('clients')
        .select('role')
        .ilike('email', email)
        .maybeSingle();

      if (clientRecord && (clientRecord.role === 'admin' || clientRecord.role === 'staff')) {
        return { user, isAdmin: true, error: null };
      }
    }

    return { user, isAdmin: false, error: null };
  } catch (err) {
    console.error('[getServerAuthUser Exception]:', err);
    return { user: null, isAdmin: false, error: err.message };
  }
}
