import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

export async function GET(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedEmail = (searchParams.get('email') || user.email).toLowerCase().trim();

    if (!isAdmin && requestedEmail !== user.email.toLowerCase().trim()) {
      return NextResponse.json({ error: 'Forbidden: Cannot access another user profile.' }, { status: 403 });
    }

    const supabase = createAdminClient();

    let role = 'customer';
    let balance = 0;

    // Check if user is an admin
    const { data: adminData } = await supabase
      .from('admins')
      .select('email')
      .eq('email', requestedEmail)
      .maybeSingle();

    if (adminData) {
      role = 'admin';
    } else {
      // Check if user is a worker
      try {
        const { data: profileData } = await supabase
          .from('worker_profiles')
          .select('id, name, email, primary_software, status')
          .eq('email', requestedEmail)
          .maybeSingle();

        if (profileData && profileData.status === 'active') {
          role = 'worker';
        } else {
          const { data: workerData } = await supabase
            .from('workers')
            .select('id, name, email, specialty, status')
            .eq('email', requestedEmail)
            .maybeSingle();

          if (workerData && workerData.status === 'active') {
            role = 'worker';
          }
        }
      } catch (wErr) {
        console.warn('Worker profile check notice:', wErr?.message);
      }
    }

    // Check client profile for wallet balance and details
    const { data } = await supabase
      .from('clients')
      .select('role, wallet_balance, name')
      .eq('email', requestedEmail)
      .maybeSingle();

    if (data) {
      if (role !== 'admin' && role !== 'worker') {
        role = data.role || 'customer';
      }
      balance = parseFloat(data.wallet_balance || 0);
    } else if (user.user_metadata?.role === 'worker') {
      role = 'worker';
    }

    return NextResponse.json({ role, balance });
  } catch (error) {
    console.error('[Auth Profile API GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
