import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    let role = 'customer';
    let balance = 0;

    // Check if user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('email')
      .eq('email', email)
      .single();

    if (!adminError && adminData) {
      role = 'admin';
    }

    // Check client profile for wallet balance and fallback role
    const { data, error } = await supabase
      .from('clients')
      .select('role, wallet_balance, name')
      .eq('email', email)
      .single();

    if (!error && data) {
      if (role !== 'admin') {
        role = data.role || 'customer';
      }
      balance = data.wallet_balance || 0;
    }

    return NextResponse.json({ role, balance });
  } catch (error) {
    console.error('[Auth Profile API GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
