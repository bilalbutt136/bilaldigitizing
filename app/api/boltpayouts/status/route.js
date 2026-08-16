import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

export async function GET(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);

    if (!user || !user.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Server misconfiguration' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: 'Missing invoiceId' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('invoices')
      .select('status, amount, payment_method, client_email')
      .eq('id', invoiceId);

    if (!isAdmin) {
      query = query.eq('client_email', user.email);
    }

    const { data: invoice } = await query.maybeSingle();

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: invoice.status,
      amount: invoice.amount,
      payment_method: invoice.payment_method
    });

  } catch (err) {
    console.error('Bolt status exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
