import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

function formatBoltAmount(amt) {
  const num = parseFloat(amt);
  if (isNaN(num) || num <= 0) return 0.99;
  
  // If already ending in .99
  if (Math.abs(num - (Math.floor(num) + 0.99)) < 0.001) {
    return Number(num.toFixed(2));
  }
  
  // Convert standard amount (e.g. 16.00 -> 15.99, 10.00 -> 9.99, 20.00 -> 19.99, 35.00 -> 34.99)
  const rounded = Math.ceil(num) - 0.01;
  return Number(Math.max(0.99, rounded).toFixed(2));
}

function extractSolanaAddress(url, boltData = {}) {
  if (boltData?.receivingAddress) return boltData.receivingAddress;
  if (boltData?.solanaAddress) return boltData.solanaAddress;
  if (boltData?.pyusdAddress) return boltData.pyusdAddress;
  if (boltData?.address && !String(boltData.address).startsWith('lnbc')) return boltData.address;
  if (boltData?.walletAddress) return boltData.walletAddress;
  if (boltData?.recipient) return boltData.recipient;
  if (boltData?.destinationAddress) return boltData.destinationAddress;

  if (!url || typeof url !== 'string') return null;

  try {
    const parsed = new URL(url);
    const paramAddr = parsed.searchParams.get('address') || 
                      parsed.searchParams.get('solanaAddress') || 
                      parsed.searchParams.get('pyusdAddress') || 
                      parsed.searchParams.get('wallet') || 
                      parsed.searchParams.get('to') || 
                      parsed.searchParams.get('recipient') ||
                      parsed.searchParams.get('destination');
    if (paramAddr && paramAddr.length >= 32 && paramAddr.length <= 44) {
      return paramAddr;
    }
  } catch (e) {}

  const matches = url.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/g);
  if (matches && matches.length > 0) {
    const valid = matches.find(m => 
      !m.toLowerCase().includes('http') && 
      !m.toLowerCase().includes('boltpayouts') && 
      !m.toLowerCase().includes('taptapup') &&
      !m.toLowerCase().includes('checkout') &&
      !m.toLowerCase().includes('invoice')
    );
    if (valid) return valid;
  }

  return null;
}

function extractLightningInvoice(url, boltData = {}) {
  if (boltData?.lightningInvoice) return boltData.lightningInvoice;
  if (boltData?.invoice && String(boltData.invoice).startsWith('lnbc')) return boltData.invoice;
  if (boltData?.paymentRequest) return boltData.paymentRequest;
  if (boltData?.lightning) return boltData.lightning;
  if (boltData?.address && (String(boltData.address).startsWith('lnbc') || String(boltData.address).includes('@'))) {
    return boltData.address;
  }

  if (!url || typeof url !== 'string') return null;

  if (url.startsWith('lightning:')) return url.replace('lightning:', '');

  try {
    const parsed = new URL(url);
    const param = parsed.searchParams.get('lightning') || 
                  parsed.searchParams.get('invoice') || 
                  parsed.searchParams.get('req') || 
                  parsed.searchParams.get('ln');
    if (param) return param;
  } catch (e) {}

  const match = url.match(/lnbc[0-9a-zA-Z]+/);
  if (match) return match[0];

  return null;
}

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
    const rawAmount = parseFloat(body.amount);
    const rawMethod = body.method || 'card';
    const orderId = body.orderId || null;
    
    if (isNaN(rawAmount) || rawAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    }

    // Format amount into standard .99 format expected by BoltPayouts
    const boltAmount = formatBoltAmount(rawAmount);

    // Map UI methods to correct BoltPayouts backend methods
    let gatewayMethod = rawMethod;
    if (rawMethod === 'dollarpay_cashapp' || rawMethod === 'cashapp' || rawMethod === 'lightning') {
      gatewayMethod = 'lightning';
    } else if (rawMethod === 'dollarpay_paypal' || rawMethod === 'paypal' || rawMethod === 'pyusd') {
      gatewayMethod = 'pyusd';
    } else if (rawMethod === 'dollarpay_apple_pay') {
      gatewayMethod = 'card';
    } else if (rawMethod === 'dollarpay_google_pay') {
      gatewayMethod = 'card';
    } else if (rawMethod === 'card') {
      gatewayMethod = 'card';
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
      amount: boltAmount,
      username: user.email,
      method: gatewayMethod === 'all' ? 'all' : gatewayMethod
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
    const solanaAddress = extractSolanaAddress(paymentUrl, boltData);
    const lightningInvoice = extractLightningInvoice(paymentUrl, boltData);

    // Create Invoice with comprehensive column mapping
    const invoicePayload = {
      user_id: user.id || null,
      client_email: user.email.toLowerCase().trim(),
      amount: boltAmount,
      method: rawMethod,
      payment_method: rawMethod,
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
        amount: boltAmount,
        method: rawMethod,
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
      paymentUrl: paymentUrl,
      method: rawMethod,
      gatewayMethod: gatewayMethod,
      solanaAddress: solanaAddress,
      lightningInvoice: lightningInvoice,
      lightningAddress: lightningInvoice,
      pyusdAddress: solanaAddress,
      amount: boltAmount
    });

  } catch (err) {
    console.error('Bolt create exception:', err);
    return NextResponse.json({ success: false, error: err.message || 'Payment initiation error' }, { status: 500 });
  }
}
