import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';

export async function POST(request) {
  try {
    const { userInfo } = await request.json().catch(() => ({}));

    if (!userInfo || !userInfo.email) {
      return NextResponse.json({ error: 'Invalid Google account data received.' }, { status: 400 });
    }

    const email = String(userInfo.email).toLowerCase().trim();
    const name = String(userInfo.name || userInfo.given_name || email.split('@')[0]).trim();
    const avatarUrl = userInfo.picture || null;

    const supabase = createAdminClient();

    // 1. Check if user is an admin in the admins table
    let role = 'customer';
    const { data: adminRow } = await supabase
      .from('admins')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (adminRow) {
      role = 'admin';
    }

    // 2. Ensure user exists in Supabase auth.users
    let authUserId = null;
    try {
      const { data: createdUser, error: createAuthErr } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          name,
          avatar_url: avatarUrl,
          role
        }
      });

      if (!createAuthErr && createdUser?.user) {
        authUserId = createdUser.user.id;
      } else {
        // User already exists in auth.users
        const { data: usersList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const matchedUser = usersList?.users?.find(u => (u.email || '').toLowerCase() === email);
        if (matchedUser) {
          authUserId = matchedUser.id;
        }
      }
    } catch (authAdminErr) {
      console.warn('[Google Auth API] Auth user check notice:', authAdminErr?.message);
    }

    // 3. Ensure client record in public.clients
    const { data: existingClient } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    let clientRecord = existingClient;

    if (!existingClient) {
      const newClient = {
        name,
        email,
        role,
        avatar_url: avatarUrl,
        wallet_balance: 0,
        status: 'active',
        created_at: new Date().toISOString()
      };
      if (authUserId) {
        newClient.id = authUserId;
      }

      const { data: inserted } = await supabase
        .from('clients')
        .insert([newClient])
        .select()
        .maybeSingle();

      if (inserted) {
        clientRecord = inserted;
      }
    } else {
      await supabase
        .from('clients')
        .update({
          avatar_url: avatarUrl || existingClient.avatar_url,
          last_login: new Date().toISOString()
        })
        .eq('email', email);
    }

    // 4. Construct complete authentic user object
    const finalUserId = authUserId || clientRecord?.id || `google_${userInfo.sub || Date.now()}`;
    const returnUser = {
      id: finalUserId,
      email,
      name: clientRecord?.name || name,
      role: role,
      wallet_balance: parseFloat(clientRecord?.wallet_balance || 0),
      avatar_url: avatarUrl || clientRecord?.avatar_url || null,
      source: 'google_oauth'
    };

    return NextResponse.json({
      success: true,
      user: returnUser
    });
  } catch (error) {
    console.error('[Google Auth API POST Error]', error);
    return NextResponse.json({ error: error.message || 'Internal authentication error' }, { status: 500 });
  }
}
