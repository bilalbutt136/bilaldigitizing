import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { createAdminClient } from '/supabase/admin';

// POST /api/admin/session
// Verifies that the caller is an authenticated Supabase user whose email
// is whitelisted in the public.admins table. The check runs server-side
// using the service role, so admin status can never be spoofed client-side.
export async function POST(request) {
  try {
    const supabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json().catch(() => ({}));
    let email = (body?.email || '').toLowerCase().trim();

    // Prefer the securely verified session email over the client-provided one
    if (user && user.email) {
      email = user.email.toLowerCase().trim();
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required.' },
        { status: 400 }
      );
    }

    const masterAdmin = (process.env.MASTER_ADMIN_EMAIL || '').toLowerCase().trim();
    if (masterAdmin && email === masterAdmin) {
      return NextResponse.json({
        success: true,
        isAdmin: true,
        admin: { email }
      });
    }

    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json(
        { success: true, isAdmin: false },
        { status: 200 }
      );
    }

    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!admin) {
      return NextResponse.json(
        { success: true, isAdmin: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      isAdmin: true,
      admin: { email: admin.email }
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Session verification failed.' },
      { status: 500 }
    );
  }
}
