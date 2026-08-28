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
      const targetEmail = (clientEmail || session.customer_details?.email || '').toLowerCase().trim();
      const amountInDollars = parseFloat(((session.amount_total || 0) / 100).toFixed(2));

      if (orderId && type !== 'deposit') {
        // Update Order Status to Paid
        const { error } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'paid',
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (error) {
          console.error('[Stripe Webhook] Error updating order status:', error);
          throw error;
        }

        // Log transaction
        await supabase.from('transactions').insert([{
          client_email: targetEmail,
          type: 'order_payment',
          amount: amountInDollars,
          payment_method: 'Stripe Card',
          description: `Stripe Direct Order Payment for Order #${String(orderId).slice(0, 8)} ($${amountInDollars.toFixed(2)})`
        }]);
        
        console.log(`[Stripe Webhook] Successfully marked order ${orderId} as Paid.`);
      } else if (type === 'deposit' && targetEmail && amountInDollars > 0) {
        // 1. Locate client record
        const { data: clientRow } = await supabase
          .from('clients')
          .select('id, wallet_balance')
          .ilike('email', targetEmail)
          .maybeSingle();

        if (clientRow) {
          const newBal = parseFloat((parseFloat(clientRow.wallet_balance || 0) + amountInDollars).toFixed(2));
          await supabase
            .from('clients')
            .update({ wallet_balance: newBal, updated_at: new Date().toISOString() })
            .eq('id', clientRow.id);

          // 2. Log transaction
          await supabase.from('transactions').insert([{
            user_id: clientRow.id,
            client_email: targetEmail,
            type: 'deposit',
            amount: amountInDollars,
            payment_method: 'Stripe Card',
            description: `Studio Wallet Deposit Top-up via Stripe (+ $${amountInDollars.toFixed(2)})`
          }]);

          console.log(`[Stripe Webhook] Credited $${amountInDollars} to wallet for ${targetEmail}. New balance: $${newBal}`);
        } else {
          console.warn(`[Stripe Webhook] Client not found for deposit: ${targetEmail}`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[Stripe Webhook Error]`, err.message);
    return NextResponse.json({ error: 'Webhook Error: ' + err.message }, { status: 400 });
  }
}
