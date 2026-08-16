import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAuthenticatedUser(request) {
  let user = null;
  const authHeader = request?.headers?.get('Authorization') || request?.headers?.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const adminClient = createAdminClient();
    const { data: userData } = await adminClient.auth.getUser(token);
    if (userData?.user) {
      user = userData.user;
    }
  }

  if (!user) {
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                try { cookieStore.set(name, value, options); } catch {}
              });
            },
          },
        }
      );
      const { data: { user: cookieUser } } = await supabase.auth.getUser();
      user = cookieUser;
    } catch {}
  }

  if (!user) return { user: null, isAdmin: false };
  
  // Check admin status using the service role client
  const adminClient = createAdminClient();
  const { data: adminData } = await adminClient.from('admins').select('email').eq('email', user.email.toLowerCase()).maybeSingle();
  return { user, isAdmin: !!adminData };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const supabase = createAdminClient();

    if (action === 'fetchAll') {
      const { isAdmin } = await getAuthenticatedUser(request);
      if (!isAdmin) {
        return NextResponse.json({ clients: [] });
      }
      
      const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ clients: data || [] });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Clients API GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { action, payload } = data;
    const supabase = createAdminClient();

    if (action === 'upsert') {
      const { user, isAdmin } = await getAuthenticatedUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const { email, provider, ...rest } = payload;
      
      if (!isAdmin && email !== user.email) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { error } = await supabase
        .from('clients')
        .upsert({ email, ...rest, updated_at: new Date().toISOString() }, { onConflict: 'email' });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Clients API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
