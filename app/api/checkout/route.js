import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { checkDistributedRateLimit, getClientIp, getRateLimitHeaders } from '../../../src/lib/rateLimit';
import { resolveAuthoritativePayment, PaymentAuthorizationError } from '../../../src/lib/payments/paymentAuthorization';

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkDistributedRateLimit(`checkout:${ip}`, 25, 60000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many checkout attempts. Please wait a moment.' },
        { status: rateLimit.unavailable ? 503 : 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({
        success: false,
        error: 'Stripe payments are not configured. Please use another payment method or contact studio support.'
      }, { status: 503 });
    }

    const { user, isAdmin } = await getServerAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const supabase = createAdminClient();
    const payment = await resolveAuthoritativePayment({
      supabase,
      user,
      isAdmin,
      body,
      allowDeposit: true
    });

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bdigitizing.com').replace(/\/+$/, '');
    const isApp = Boolean(body.isApp);

    let productName = `BDigitizing - Order Payment ${payment.orderId ? `(#${payment.orderId})` : ''}`;
    if (payment.type === 'deposit') {
      productName = 'BDigitizing - Studio Wallet Top-up';
    } else if (payment.type === 'custom_offer') {
      productName = `BDigitizing - Custom Offer: ${payment.title}`;
    }

    const basePath = isApp ? `${siteUrl}/?app=true` : `${siteUrl}/client-portal`;
    const paramPrefix = isApp ? '&' : '?';
    const successUrl = payment.type === 'custom_offer'
      ? `${basePath}${paramPrefix}tab=inbox&chatId=${encodeURIComponent(payment.conversationId || '')}&payment=success&offerId=${encodeURIComponent(payment.offerId || '')}&session_id={CHECKOUT_SESSION_ID}`
      : `${basePath}${paramPrefix}tab=orders&payment=success&orderId=${encodeURIComponent(payment.orderId || '')}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = payment.type === 'custom_offer'
      ? `${basePath}${paramPrefix}tab=inbox&chatId=${encodeURIComponent(payment.conversationId || '')}&payment=canceled`
      : `${basePath}${paramPrefix}tab=orders&payment=canceled`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: payment.targetEmail,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: productName },
          unit_amount: payment.amountCents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        clientEmail: payment.targetEmail,
        customerUserId: String(payment.targetUserId || user.id || ''),
        type: payment.type,
        orderId: payment.orderId || '',
        offerId: payment.offerId || '',
        conversationId: payment.conversationId || '',
        title: payment.title || '',
        expectedAmountCents: String(payment.amountCents)
      }
    });

    if (payment.type === 'custom_offer' && payment.offerId) {
      const { error: updateError } = await supabase
        .from('custom_offers')
        .update({
          stripe_session_id: session.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.offerId);

      if (updateError) {
        console.warn('Stripe session id update notice for custom offer:', updateError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Checkout session created successfully.',
      url: session.url,
      sessionId: session.id,
      amount: payment.amount
    });
  } catch (error) {
    if (error instanceof PaymentAuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Checkout API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create checkout session.' }, { status: 500 });
  }
}
