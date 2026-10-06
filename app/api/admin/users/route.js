import { withApiObservability } from '../../../../src/lib/observability/apiObservability.js';
import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { getServerAuthUser, invalidateTrustedAccessCache } from '../../../../src/lib/supabase/serverAuth';
import { enforceApiBurstLimit } from '../../../../src/lib/apiBurstGuard.js';

// GET /api/admin/users
// Returns the whitelisted admin emails (server-side, verified admins only).
async function GET_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'admin-users-get', 20, 60_000);
  if (burstResponse) return burstResponse;

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
      .select('email, name, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, admins: data || [] }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch admins.' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users
// Grants admin access by inserting an email into public.admins, syncing clients table, and creating/updating Auth account.
async function POST_impl(request) {
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
        .upsert({ email: newEmail, name: adminName || newEmail.split('@')[0] }, { onConflict: 'email' });

      // 2. Ensure clients table has admin role
      await supabaseAdmin
        .from('clients')
        .update({ role: 'admin' })
        .ilike('email', newEmail);

      // 3. Find and update user in Supabase Auth
      const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (listErr) throw listErr;

      const targetUser = (usersData?.users || []).find(u => (u.email || '').toLowerCase() === newEmail);

      if (targetUser) {
        const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
          password,
          app_metadata: {
            ...targetUser.app_metadata,
            role: 'admin',
            is_admin: true
          },
          user_metadata: {
            ...targetUser.user_metadata,
            role: 'admin',
            is_admin: true,
            name: adminName || targetUser.user_metadata?.name || newEmail.split('@')[0],
            full_name: adminName || targetUser.user_metadata?.full_name || newEmail.split('@')[0]
          }
        });
        if (updateErr) throw updateErr;
      } else {
        const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: newEmail,
          password,
          email_confirm: true,
          app_metadata: { role: 'admin', is_admin: true },
          user_metadata: { role: 'admin', is_admin: true, full_name: adminName || newEmail.split('@')[0], name: adminName || newEmail.split('@')[0] }
        });
        if (createErr) throw createErr;
      }

      invalidateTrustedAccessCache(newEmail);
      return NextResponse.json({ success: true, message: `Password for ${newEmail} reset successfully.` });
    }

    // Handle Add New Admin
    const { data, error } = await supabaseAdmin
      .from('admins')
      .upsert({ email: newEmail, name: adminName || newEmail.split('@')[0] }, { onConflict: 'email' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Update or insert clients table with admin role
    const { error: clientUpdateErr } = await supabaseAdmin
      .from('clients')
      .update({ role: 'admin', name: adminName || undefined })
      .ilike('email', newEmail);

    if (clientUpdateErr) {
      console.warn('[Admin Create: Clients table update notice]', clientUpdateErr.message);
    }

    // Sync Supabase Auth Account
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = (usersData?.users || []).find(u => (u.email || '').toLowerCase() === newEmail);

      if (existingAuthUser) {
        const updateFields = {
          app_metadata: {
            ...existingAuthUser.app_metadata,
            role: 'admin',
            is_admin: true
          },
          user_metadata: {
            ...existingAuthUser.user_metadata,
            role: 'admin',
            is_admin: true,
            full_name: adminName || existingAuthUser.user_metadata?.full_name || newEmail.split('@')[0],
            name: adminName || existingAuthUser.user_metadata?.name || newEmail.split('@')[0]
          }
        };
        if (password && password.length >= 6) {
          updateFields.password = password;
        }
        await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, updateFields);
      } else if (password && password.length >= 6) {
        await supabaseAdmin.auth.admin.createUser({
          email: newEmail,
          password,
          email_confirm: true,
          app_metadata: {
            role: 'admin',
            is_admin: true
          },
          user_metadata: {
            role: 'admin',
            is_admin: true,
            full_name: adminName || newEmail.split('@')[0],
            name: adminName || newEmail.split('@')[0]
          }
        });
      }
    } catch (authErr) {
      console.warn('[Admin Auth Provisioning Notice]', authErr.message);
    }

    invalidateTrustedAccessCache(newEmail);
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
async function PATCH_impl(request) {
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

    // 2. Ensure clients table has admin role
    await supabaseAdmin
      .from('clients')
      .update({ role: 'admin' })
      .ilike('email', email);

    // 3. Find user in Supabase Auth
    const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
    if (listErr) throw listErr;

    const targetUser = (usersData?.users || []).find(u => (u.email || '').toLowerCase() === email);

    if (targetUser) {
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
        password: newPassword,
        app_metadata: {
          ...targetUser.app_metadata,
          role: 'admin',
          is_admin: true
        },
        user_metadata: {
          ...targetUser.user_metadata,
          role: 'admin',
          is_admin: true
        }
      });
      if (updateErr) throw updateErr;
    } else {
      const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: newPassword,
        email_confirm: true,
        app_metadata: { role: 'admin', is_admin: true },
        user_metadata: { role: 'admin', is_admin: true, full_name: email.split('@')[0], name: email.split('@')[0] }
      });
      if (createErr) throw createErr;
    }

    invalidateTrustedAccessCache(email);
    return NextResponse.json({ success: true, message: `Password for ${email} updated successfully.` });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to reset admin password.' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users?email=...
// Fully revokes administrator access: deletes from public.admins, demotes clients role to customer, and updates Supabase Auth app_metadata.
async function DELETE_impl(request) {
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

    const callerEmail = String(user.email || '').toLowerCase().trim();
    if (email === callerEmail) {
      return NextResponse.json(
        { success: false, error: 'You cannot revoke your own administrator account.' },
        { status: 400 }
      );
    }

    const configuredAdmins = [
      process.env.MASTER_ADMIN_EMAIL,
      process.env.ADMIN_EMAIL,
      process.env.NEXT_PUBLIC_ADMIN_EMAIL
    ]
      .filter(Boolean)
      .map(e => String(e).toLowerCase().trim());

    if (configuredAdmins.includes(email)) {
      return NextResponse.json(
        { success: false, error: 'The master admin account cannot be removed.' },
        { status: 400 }
      );
    }

    // 1. Delete from public.admins table
    const { error: adminDeleteErr } = await supabaseAdmin.from('admins').delete().ilike('email', email);
    if (adminDeleteErr) {
      return NextResponse.json({ success: false, error: adminDeleteErr.message }, { status: 500 });
    }

    // 2. Demote client profile role in public.clients table to customer
    try {
      await supabaseAdmin
        .from('clients')
        .update({ role: 'customer' })
        .ilike('email', email);
    } catch (clientErr) {
      console.warn('[Admin Revoke: Clients table demote notice]', clientErr.message);
    }

    // 3. Demote in Supabase Auth app_metadata and user_metadata
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const targetUser = (usersData?.users || []).find(u => (u.email || '').toLowerCase() === email);

      if (targetUser) {
        await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
          app_metadata: {
            ...targetUser.app_metadata,
            role: 'customer',
            is_admin: false
          },
          user_metadata: {
            ...targetUser.user_metadata,
            role: 'customer',
            is_admin: false
          }
        });
      }
    } catch (authErr) {
      console.warn('[Admin Revoke: Auth metadata demote notice]', authErr.message);
    }

    // 4. Invalidate memory cache so privileges expire immediately
    invalidateTrustedAccessCache(email);

    return NextResponse.json({ success: true, message: `Administrator privileges successfully revoked for ${email}.` });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to remove admin.' },
      { status: 500 }
    );
  }
}

export const GET = withApiObservability(GET_impl);
export const POST = withApiObservability(POST_impl);
export const PATCH = withApiObservability(PATCH_impl);
export const DELETE = withApiObservability(DELETE_impl);
