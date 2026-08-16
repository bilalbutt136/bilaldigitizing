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

    const cleanUserEmail = user.email.toLowerCase().trim();

    let query = supabaseAdmin
      .from('invoices')
      .select('*')
      .or(`id.eq.${invoiceId},bolt_order_id.eq.${invoiceId}`);

    if (!isAdmin) {
      query = query.ilike('client_email', cleanUserEmail);
    }

    const { data: invoice } = await query.maybeSingle();

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: invoice.status,
      amount: invoice.amount,
      payment_method: invoice.payment_method || invoice.method,
      method: invoice.method || invoice.payment_method,
      invoice: invoice
    });

  } catch (err) {
    console.error('Bolt status exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
