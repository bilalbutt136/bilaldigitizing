import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '../../../src/lib/rateLimit';

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`checkout:${ip}`, 25, 60000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many checkout attempts. Please wait a moment.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Stripe payments are not configured. Please use BoltPayouts or contact studio support.' 
      }, { status: 503 });
    }

    const { user } = await getServerAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const { amount, clientEmail, type, orderId, offerId, conversationId, title } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid payment amount.' }, { status: 400 });
    }

    const targetEmail = (user?.email || clientEmail || '').toLowerCase().trim();
    if (!targetEmail) {
      return NextResponse.json({ success: false, error: 'Client email is required for checkout.' }, { status: 400 });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bilaldigitizing.vercel.app';

    let productName = `Bilal Digitizing - Order Payment ${orderId ? `(#${orderId})` : ''}`;
    if (type === 'deposit') {
      productName = 'Bilal Digitizing - Studio Wallet Top-up';
    } else if (type === 'custom_offer') {
      productName = `Bilal Digitizing - Custom Offer: ${title || 'Custom Design Order'}`;
    }

    const successUrl = type === 'custom_offer'
      ? `${siteUrl}/client-portal?tab=inbox&chatId=${conversationId || ''}&payment=success&offerId=${offerId || ''}&session_id={CHECKOUT_SESSION_ID}`
      : `${siteUrl}/client-portal?success=true&session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl = type === 'custom_offer'
      ? `${siteUrl}/client-portal?tab=inbox&chatId=${conversationId || ''}&payment=canceled`
      : `${siteUrl}/client-portal?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: targetEmail,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { 
            name: productName
          },
          unit_amount: Math.round(parsedAmount * 100), // Stripe expects integer cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { 
        clientEmail: targetEmail, 
        type: type || 'order_payment', 
        orderId: orderId || '',
        offerId: offerId || '',
        conversationId: conversationId || '',
        title: title || ''
      }
    });

    if (type === 'custom_offer' && offerId) {
      try {
        const supabase = createAdminClient();
        await supabase
          .from('custom_offers')
          .update({
            stripe_session_id: session.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', offerId);
      } catch (dbErr) {
        console.warn('Stripe session id update notice for custom offer:', dbErr.message);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Checkout session created successfully.',
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Checkout API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create checkout session: ' + error.message }, { status: 500 });
  }
}
