import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { createAdminClient } from '/supabase/admin';

export async function POST(request) {
  try {
    const supabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Server misconfiguration' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const amount = parseFloat(body.amount);
    const method = body.method; // Don't default to 'card'
    const orderId = body.orderId;
    
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }

    // Fetch Bolt config from site_config
    const { data: configRow } = await supabaseAdmin
      .from('site_config')
      .select('value')
      .eq('key', 'boltpayouts_config')
      .maybeSingle();

    const boltConfig = configRow?.value || {};
    const apiKey = boltConfig.apiKey;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Payment gateway not configured by administrator.' }, { status: 503 });
    }

    const payload = {
      amount: amount,
      username: user.email,
      method: method === 'all' ? 'all' : (method || 'all')
    };

    // Call BoltPayouts API
    const boltResponse = await fetch('https://www.boltpayouts.xyz/api/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    const boltData = await boltResponse.json().catch(() => ({}));

    if (!boltResponse.ok || !boltData.success) {
      console.error("BoltPayouts API Error:", boltData);
      const errorMessage = boltData.error || boltData.message || JSON.stringify(boltData) || 'Payment provider error';
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        details: boltData
      }, { status: boltResponse.status === 200 ? 400 : boltResponse.status });
    }

    const boltOrderId = boltData.orderId;
    const paymentUrl = boltData.paymentUrl || boltData.taptapupRedirectUrl;

    // Create Invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert([{
        user_id: user.id,
        client_email: user.email,
        amount: amount,
        payment_method: method,
        status: 'pending',
        bolt_order_id: boltOrderId,
        invoice_number: `INV-${Date.now()}`,
        order_id: orderId || null
      }])
      .select()
      .single();

    if (invoiceError) {
      console.error('Invoice creation error:', invoiceError);
      return NextResponse.json({ success: false, error: 'Failed to create invoice' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      invoice: invoice,
      paymentUrl: paymentUrl
    });

  } catch (err) {
    console.error('Bolt create exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
