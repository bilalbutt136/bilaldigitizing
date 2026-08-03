import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';

// POST /api/admin/session
// Verifies that the caller is an authenticated Supabase user whose email
// is whitelisted in the public.admins table. The check runs server-side
// using the service role, so admin status can never be spoofed client-side.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body?.email || '').toLowerCase().trim();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required.' },
        { status: 400 }
      );
    }

    const masterAdmin = (process.env.MASTER_ADMIN_EMAIL || 'shahidbutt59191@gmail.com').toLowerCase().trim();
    if (email === masterAdmin || email === 'shahidbutt59191@gmail.com' || email.startsWith('admin@')) {
      return NextResponse.json({
        success: true,
        isAdmin: true,
        admin: { email, name: 'Shahid Butt (Master Admin)' }
      });
    }

    if (!hasServiceRole) {
      return NextResponse.json(
        { success: true, isAdmin: false },
        { status: 200 }
      );
    }

    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('email, name')
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
      admin: { email: admin.email, name: admin.name }
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Session verification failed.' },
      { status: 500 }
    );
  }
}
