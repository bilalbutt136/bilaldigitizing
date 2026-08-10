import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { createAdminClient } from '../../../../src/lib/supabase/admin';

async function isCallerAdmin(body) {
  if (!body?.callerEmail) return false;
  const clean = String(body.callerEmail).toLowerCase().trim();
  const master = (process.env.MASTER_ADMIN_EMAIL || '').toLowerCase().trim();
  if (master && clean === master) return true;
  if (!hasServiceRole) return false;
  const { data } = await supabaseAdmin
    .from('admins')
    .select('email')
    .eq('email', clean)
    .maybeSingle();
  return Boolean(data);
}

// GET /api/admin/users
// Returns the whitelisted admin emails (server-side, admins only).
export async function GET(request) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json(
        { success: true, admins: [], notice: 'Server is missing SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 200 }
      );
    }

    const supabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    let callerEmail = (request.headers.get('x-admin-email') || '').toLowerCase().trim();
    if (user && user.email) callerEmail = user.email.toLowerCase().trim();

    if (!callerEmail || !(await isCallerAdmin({ callerEmail }))) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin privileges required.' },
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
// Only an existing whitelisted admin (or an account matching the
// configured master admin email) may add new admins.
export async function POST(request) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const newEmail = (body?.email || '').toLowerCase().trim();
    
    const supabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    let callerEmail = (body?.callerEmail || '').toLowerCase().trim();
    if (user && user.email) callerEmail = user.email.toLowerCase().trim();

    if (!newEmail) {
      return NextResponse.json({ success: false, error: 'Admin email is required.' }, { status: 400 });
    }

    const masterAdmin = (process.env.MASTER_ADMIN_EMAIL || '').toLowerCase().trim();
    const callerIsMaster = masterAdmin && callerEmail === masterAdmin;
    const callerIsAdmin = await isCallerAdmin({ callerEmail });

    if (!callerIsMaster && !callerIsAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
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
        { status: 400 }
      );
    }

    const email = (request.nextUrl.searchParams.get('email') || '').toLowerCase().trim();
    
    const supabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    let callerEmail = (request.headers.get('x-admin-email') || '').toLowerCase().trim();
    if (user && user.email) callerEmail = user.email.toLowerCase().trim();

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

    const callerIsMaster = masterAdmin && callerEmail === masterAdmin;
    const callerIsAdmin = await isCallerAdmin({ callerEmail });
    if (!callerIsMaster && !callerIsAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin privileges required.' },
        { status: 403 }
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
