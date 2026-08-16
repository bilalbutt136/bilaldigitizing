import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

// GET /api/admin/users
// Returns the whitelisted admin emails (server-side, verified admins only).
export async function GET(request) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 500 }
      );
    }

    const { user, isAdmin } = await getServerAuthUser(request);

    if (!user || !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('email, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, admins: data || [] });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch admins.' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users
// Grants admin access by inserting an email into public.admins.
// Only an authenticated whitelisted admin or master admin may add new admins.
export async function POST(request) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 500 }
      );
    }

    const { user, isAdmin } = await getServerAuthUser(request);

    if (!user || !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const newEmail = (body?.email || '').toLowerCase().trim();

    if (!newEmail || !newEmail.includes('@')) {
      return NextResponse.json({ success: false, error: 'A valid admin email is required.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('admins')
      .upsert({ email: newEmail }, { onConflict: 'email' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, admin: data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create admin.' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users?email=...
// Removes admin access. Master admin cannot be removed.
export async function DELETE(request) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 500 }
      );
    }

    const { user, isAdmin } = await getServerAuthUser(request);

    if (!user || !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const email = (request.nextUrl.searchParams.get('email') || '').toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
    }

    const masterAdmin = (process.env.MASTER_ADMIN_EMAIL || '').toLowerCase().trim();
    if (email === masterAdmin) {
      return NextResponse.json(
        { success: false, error: 'The master admin account cannot be removed.' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from('admins').delete().eq('email', email);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to remove admin.' },
      { status: 500 }
    );
  }
}
