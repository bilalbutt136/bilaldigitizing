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
// Grants admin access by inserting an email into public.admins and sets/creates Auth account with password.
// Only an authenticated whitelisted admin or master admin may add new admins or reset passwords.
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
    const action = body?.action || '';
    const newEmail = (body?.email || '').toLowerCase().trim();
    const adminName = (body?.name || '').trim();
    const password = body?.password || body?.newPassword || '';

    if (!newEmail || !newEmail.includes('@')) {
      return NextResponse.json({ success: false, error: 'A valid admin email is required.' }, { status: 400 });
    }

    // Handle Password Reset Action via POST
    if (action === 'resetPassword') {
      if (!password || password.length < 6) {
        return NextResponse.json({ success: false, error: 'Password must be at least 6 characters long.' }, { status: 400 });
      }

      // 1. Ensure email is in admins table
      await supabaseAdmin
        .from('admins')
        .upsert({ email: newEmail }, { onConflict: 'email' });

      // 2. Find and update user in Supabase Auth
      const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (listErr) throw listErr;

      const targetUser = (usersData?.users || []).find(u => (u.email || '').toLowerCase() === newEmail);

      if (targetUser) {
        const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
          password,
          user_metadata: {
            ...targetUser.user_metadata,
            role: 'admin'
          }
        });
        if (updateErr) throw updateErr;
      } else {
        const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: newEmail,
          password,
          email_confirm: true,
          user_metadata: { role: 'admin', full_name: adminName || newEmail.split('@')[0], name: adminName }
        });
        if (createErr) throw createErr;
      }

      return NextResponse.json({ success: true, message: `Password for ${newEmail} reset successfully.` });
    }

    // Handle Add New Admin (with optional or required password)
    const { data, error } = await supabaseAdmin
      .from('admins')
      .upsert({ email: newEmail }, { onConflict: 'email' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // If a password is provided during creation, create or update the Supabase Auth user
    if (password && password.length >= 6) {
      try {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuthUser = (usersData?.users || []).find(u => (u.email || '').toLowerCase() === newEmail);

        if (existingAuthUser) {
          await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
            password,
            user_metadata: {
              ...existingAuthUser.user_metadata,
              role: 'admin',
              full_name: adminName || existingAuthUser.user_metadata?.full_name || newEmail.split('@')[0],
              name: adminName || existingAuthUser.user_metadata?.name
            }
          });
        } else {
          await supabaseAdmin.auth.admin.createUser({
            email: newEmail,
            password,
            email_confirm: true,
            user_metadata: {
              role: 'admin',
              full_name: adminName || newEmail.split('@')[0],
              name: adminName || newEmail.split('@')[0]
            }
          });
        }
      } catch (authErr) {
        console.warn('[Admin Auth Provisioning Notice]', authErr.message);
      }
    }

    return NextResponse.json({ success: true, admin: data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create admin.' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users
// Resets password for an existing admin account
export async function PATCH(request) {
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
    const email = (body?.email || '').toLowerCase().trim();
    const newPassword = body?.newPassword || body?.password || '';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'A valid admin email is required.' }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // 1. Ensure email is in admins table
    await supabaseAdmin
      .from('admins')
      .upsert({ email }, { onConflict: 'email' });

    // 2. Find user in Supabase Auth
    const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
    if (listErr) throw listErr;

    const targetUser = (usersData?.users || []).find(u => (u.email || '').toLowerCase() === email);

    if (targetUser) {
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
        password: newPassword,
        user_metadata: {
          ...targetUser.user_metadata,
          role: 'admin'
        }
      });
      if (updateErr) throw updateErr;
    } else {
      const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: newPassword,
        email_confirm: true,
        user_metadata: { role: 'admin', full_name: email.split('@')[0], name: email.split('@')[0] }
      });
      if (createErr) throw createErr;
    }

    return NextResponse.json({ success: true, message: `Password for ${email} updated successfully.` });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to reset admin password.' },
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
