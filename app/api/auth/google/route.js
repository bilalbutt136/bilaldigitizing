import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';

export async function POST(request) {
  try {
    const { userInfo } = await request.json().catch(() => ({}));

    if (!userInfo || !userInfo.email) {
      return NextResponse.json({ error: 'Invalid Google user information received.' }, { status: 400 });
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

    // 2. Check or create client profile in public.clients table
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

      const { data: inserted, error: insertErr } = await supabase
        .from('clients')
        .insert([newClient])
        .select()
        .maybeSingle();

      if (!insertErr && inserted) {
        clientRecord = inserted;
      }
    } else {
      // Update avatar or role if needed
      await supabase
        .from('clients')
        .update({
          avatar_url: avatarUrl || existingClient.avatar_url,
          last_login: new Date().toISOString()
        })
        .eq('email', email);
    }

    // 3. Check or create auth user in Supabase auth.users using admin API
    let authUserId = clientRecord?.id || `google_${userInfo.sub || Date.now()}`;
    
    try {
      const { data: usersList } = await supabase.auth.admin.listUsers();
      const matchedUser = usersList?.users?.find(u => (u.email || '').toLowerCase() === email);

      if (matchedUser) {
        authUserId = matchedUser.id;
      } else {
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
        }
      }
    } catch (authAdminErr) {
      console.warn('[Google Auth API] Admin user provision notice:', authAdminErr?.message);
    }

    // 4. Construct complete authentic user object
    const returnUser = {
      id: authUserId,
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
