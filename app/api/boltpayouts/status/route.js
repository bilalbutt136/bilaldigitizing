import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { createClient } from '../../../../src/lib/supabase/server';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Server misconfiguration' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: 'Missing invoiceId' }, { status: 400 });
    }

    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('status, amount, payment_method')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .maybeSingle();

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
