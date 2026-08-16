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
    }

    // Check client profile for wallet balance and details
    const { data } = await supabase
      .from('clients')
      .select('role, wallet_balance, name')
      .eq('email', requestedEmail)
      .maybeSingle();

    if (data) {
      if (role !== 'admin') {
        role = data.role || 'customer';
      }
      balance = parseFloat(data.wallet_balance || 0);
    }

    return NextResponse.json({ role, balance });
  } catch (error) {
    console.error('[Auth Profile API GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
