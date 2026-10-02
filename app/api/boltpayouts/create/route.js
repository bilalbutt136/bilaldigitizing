import { withApiObservability } from '../../../../src/lib/observability/apiObservability.js';
import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';
import { checkDistributedRateLimit, getClientIp, getRateLimitHeaders } from '../../../../src/lib/rateLimit';
import {
  resolveAuthoritativePayment,
  PaymentAuthorizationError
} from '../../../../src/lib/payments/paymentAuthorization';
import {
  createBoltPayment,
  extractBoltPaymentDetails,
  formatBoltAmount,
  getBoltPayoutsConfig,
  normalizeBoltMethod
} from '../../../../src/lib/payments/boltPayouts';

function paymentReference(payment) {
  if (payment.type === 'custom_offer') return `offer:${payment.offerId}`;
  if (payment.type === 'order_payment') return `order:${payment.orderId}`;
  return 'deposit';
}

async function POST_impl(request) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Payment service is temporarily unavailable.' },
        { status: 503 }
      );
    }

    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user?.email) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const rateLimit = await checkDistributedRateLimit(
      `boltpayouts-create:${user.id || getClientIp(request)}`,
      20,
      60_000
    );
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many payment requests. Please wait a moment.' },
        { status: rateLimit.unavailable ? 503 : 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json().catch(() => ({}));
    const payment = await resolveAuthoritativePayment({
      supabase: supabaseAdmin,
      user,
      isAdmin,
      body: {
        ...body,
        type: body.offerId ? 'custom_offer' : (body.orderId ? 'order_payment' : 'deposit')
      },
      allowDeposit: true
    });

    const providerAmount = formatBoltAmount(payment.amount);
    if (!Number.isFinite(providerAmount) || providerAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid payment amount.' }, { status: 409 });
    }

    const config = await getBoltPayoutsConfig();
    if (!config.apiKey || config.isActive === false) {
      return NextResponse.json(
        { success: false, error: 'Payment gateway is temporarily unavailable. Please contact studio support.' },
        { status: 503 }
      );
    }

    const method = normalizeBoltMethod(body.method || 'card');
    const { data: providerData, providerMethod } = await createBoltPayment({
      apiKey: config.apiKey,
      amount: providerAmount,
      email: payment.targetEmail,
      method
    });

    const providerOrderId = String(
      providerData?.orderId || providerData?.id || providerData?.order_id || ''
    ).trim();

    if (!providerOrderId) {
      return NextResponse.json(
        { success: false, error: 'Payment provider did not return a valid payment identifier.' },
        { status: 502 }
      );
    }

    const details = extractBoltPaymentDetails(providerData);
    if (!details.paymentUrl && !details.solanaAddress && !details.lightningInvoice) {
      return NextResponse.json(
        { success: false, error: 'Payment provider did not return a usable checkout destination.' },
        { status: 502 }
      );
    }

    const nowIso = new Date().toISOString();
    const invoicePayload = {
      user_id: payment.targetUserId || user.id,
      client_email: payment.targetEmail,
      amount: providerAmount,
      method: method.requestedMethod,
      payment_method: method.requestedMethod,
      status: 'pending',
      bolt_order_id: providerOrderId,
      payment_url: details.paymentUrl,
      reference_id: paymentReference(payment),
      description:
        payment.type === 'deposit'
          ? 'Studio Wallet top-up'
          : payment.type === 'custom_offer'
            ? `Custom offer payment: ${payment.title || payment.offerId}`
            : `Order payment: ${payment.orderId}`,
      invoice_number: `INV-${Date.now()}-${providerOrderId.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}`,
      order_id: payment.orderId || payment.offerId || null,
      created_at: nowIso,
      updated_at: nowIso
    };

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert([invoicePayload])
      .select()
      .single();

    if (invoiceError || !invoice) {
      console.error('[BoltPayouts Create] Invoice persistence failed:', invoiceError?.message);
      return NextResponse.json(
        { success: false, error: 'Payment session could not be persisted. Please try again.' },
        { status: 503 }
      );
    }

    if (payment.type === 'custom_offer' && payment.offerId) {
      const { error: offerUpdateError } = await supabaseAdmin
        .from('custom_offers')
        .update({
          stripe_session_id: providerOrderId,
          payment_intent_id: providerOrderId,
          updated_at: nowIso
        })
        .eq('id', payment.offerId);

      if (offerUpdateError) {
        console.warn('[BoltPayouts Create] Offer payment reference sync warning:', offerUpdateError.message);
      }
    }

    return NextResponse.json({
      success: true,
      invoice,
      paymentUrl: details.paymentUrl,
      method: method.requestedMethod,
      gatewayMethod: providerMethod,
      solanaAddress: details.solanaAddress,
      lightningInvoice: details.lightningInvoice,
      lightningAddress: details.lightningInvoice,
      pyusdAddress: details.solanaAddress,
      amount: providerAmount
    });
  } catch (error) {
    if (error instanceof PaymentAuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    const status = Number(error?.status);
    console.error('[BoltPayouts Create] Payment initiation failed:', error?.message);
    return NextResponse.json(
      { success: false, error: 'Payment initiation failed. Please try again or contact support.' },
      { status: Number.isInteger(status) && status >= 400 && status < 600 ? status : 500 }
    );
  }
}

export const POST = withApiObservability(POST_impl);
