import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '../../../../src/lib/supabase/admin';

export async function POST(req) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe configuration missing' }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
  const signature = req.headers.get('stripe-signature');

  try {
    const rawBody = await req.text();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    const supabase = createAdminClient();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      const { orderId, type, clientEmail } = session.metadata || {};

      if (orderId && type !== 'deposit') {
        // Update Order Status to Paid
        const { error } = await supabase
          .from('orders')
          .update({ payment_status: 'Paid' })
          .eq('id', orderId);

        if (error) {
          console.error('[Stripe Webhook] Error updating order status:', error);
          throw error;
        }
        
        console.log(`[Stripe Webhook] Successfully marked order ${orderId} as Paid.`);
      } else if (type === 'deposit') {
        console.log(`[Stripe Webhook] Received deposit for ${clientEmail}. (Wallet handling can be added here)`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[Stripe Webhook Error]`, err.message);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }
}
