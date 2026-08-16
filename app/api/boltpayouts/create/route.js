import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

export async function POST(request) {
  try {
    const { user } = await getServerAuthUser(request);

    if (!user || !user.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Server misconfiguration: Database service client unavailable' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const amount = parseFloat(body.amount);
    const method = body.method || 'all';
    const orderId = body.orderId || null;
    
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
      method: method === 'all' ? 'all' : method
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
      const errorMessage = boltData.error || boltData.message || 'Payment provider gateway error';
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        details: boltData
      }, { status: boltResponse.status === 200 ? 400 : boltResponse.status });
    }

    const boltOrderId = boltData.orderId || boltData.id;
    const paymentUrl = boltData.paymentUrl || boltData.taptapupRedirectUrl || boltData.url;

    // Create Invoice with comprehensive column mapping
    const invoicePayload = {
      user_id: user.id || null,
      client_email: user.email.toLowerCase().trim(),
      amount: amount,
      method: method,
      payment_method: method,
      status: 'pending',
      bolt_order_id: boltOrderId,
      payment_url: paymentUrl,
      invoice_number: `INV-${Date.now()}`,
      order_id: orderId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let invoice = null;
    try {
      const { data: createdInvoice, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .insert([invoicePayload])
        .select()
        .single();

      if (invoiceError) throw invoiceError;
      invoice = createdInvoice;
    } catch (invErr) {
      console.warn('[BoltPayouts Create] Primary invoice insert warning, trying core schema fallback:', invErr.message);
      // Fallback with base columns only
      const coreInvoicePayload = {
        user_id: user.id || null,
        client_email: user.email.toLowerCase().trim(),
        amount: amount,
        method: method,
        status: 'pending',
        bolt_order_id: boltOrderId,
        order_id: orderId
      };

      const { data: fallbackInvoice, error: fallbackErr } = await supabaseAdmin
        .from('invoices')
        .insert([coreInvoicePayload])
        .select()
        .single();

      if (fallbackErr) {
        console.error('[BoltPayouts Create] Fallback invoice insert failed:', fallbackErr);
        // Even if DB logging failed, return the active payment URL so the customer is not blocked from paying
        invoice = {
          id: boltOrderId || `temp-${Date.now()}`,
          ...coreInvoicePayload,
          paymentUrl: paymentUrl
        };
      } else {
        invoice = fallbackInvoice;
      }
    }

    return NextResponse.json({
      success: true,
      invoice: invoice,
      paymentUrl: paymentUrl
    });

  } catch (err) {
    console.error('Bolt create exception:', err);
    return NextResponse.json({ success: false, error: err.message || 'Payment initiation error' }, { status: 500 });
  }
}
