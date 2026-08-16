import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';

export async function POST(req) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Stripe payments are not configured. Please use BoltPayouts or contact studio support.' 
      }, { status: 503 });
    }

    const { user } = await getServerAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const { amount, clientEmail, type, orderId } = body;

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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: targetEmail,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { 
            name: type === 'deposit' ? 'Bilal Digitizing - Studio Wallet Top-up' : `Bilal Digitizing - Order Payment ${orderId ? `(#${orderId})` : ''}` 
          },
          unit_amount: Math.round(parsedAmount * 100), // Stripe expects integer cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${siteUrl}/client-portal?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/client-portal?canceled=true`,
      metadata: { 
        clientEmail: targetEmail, 
        type: type || 'order_payment', 
        orderId: orderId || '' 
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Checkout session created successfully.',
      url: session.url
    });
  } catch (error) {
    console.error('Checkout API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create checkout session: ' + error.message }, { status: 500 });
  }
}
