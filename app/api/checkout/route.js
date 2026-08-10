import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Stripe payments are not configured. Please use BoltPayouts or contact studio support.' 
      }, { status: 503 });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const body = await req.json();
    const { amount, clientEmail, type, orderId } = body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: type === 'deposit' ? 'Wallet Top-up' : `Order Payment ${orderId ? `(#${orderId})` : ''}` },
          unit_amount: Math.round(amount * 100), // Stripe expects cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/client-portal?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/client-portal?canceled=true`,
      metadata: { clientEmail, type, orderId }
    });

    console.log(`[Checkout Service] Created Stripe Checkout Session for ${clientEmail}, Amount: $${amount}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Checkout session created successfully.',
      url: session.url
    });
  } catch (error) {
    console.error('Checkout API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create checkout session', details: error.message }, { status: 500 });
  }
}
