import { withApiObservability, logServerCaughtError } from '../../../src/lib/observability/apiObservability.js';
import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../src/lib/supabaseAdmin';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';
import { checkDistributedRateLimit, getClientIp, getRateLimitHeaders } from '../../../src/lib/rateLimit';
import {
  resolveAuthoritativePayment,
  PaymentAuthorizationError
} from '../../../src/lib/payments/paymentAuthorization';

function walletRpcStatus(error) {
  const message = String(error?.message || '').toLowerCase();
  if (message.includes('insufficient')) return 400;
  if (message.includes('not found')) return 404;
  if (message.includes('does not belong') || message.includes('not authorized')) return 403;
  if (message.includes('authoritative') || message.includes('amount')) return 409;
  return 503;
}

async function ensureClientRecord(user) {
  const email = String(user?.email || '').toLowerCase().trim();
  if (!email) return null;

  const { data: byEmail, error: findError } = await supabaseAdmin
    .from('clients')
    .select('id, email, wallet_balance, name, user_id')
    .ilike('email', email)
    .maybeSingle();

  if (findError) throw findError;
  if (byEmail) return byEmail;

  const clientName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];
  const payload = {
    email,
    user_id: user.id,
    name: clientName,
    full_name: clientName,
    company: user.user_metadata?.company || `${clientName}'s Studio`,
    wallet_balance: 0,
    orders_count: 0
  };

  const { data: created, error: insertError } = await supabaseAdmin
    .from('clients')
    .insert(payload)
    .select('id, email, wallet_balance, name, user_id')
    .single();

  if (insertError) throw insertError;
  return created;
}

// POST /api/wallet
// - deduct: order price and ownership are always resolved from the database.
// - deposit: manual credit is restricted to a verified administrator account.
async function POST_impl(request) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Wallet service is temporarily unavailable.' },
        { status: 503 }
      );
    }

    const { user, isAdmin, error: authError } = await getServerAuthUser(request);
    if (authError || !user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const rateLimit = await checkDistributedRateLimit(
      `wallet-post:${user.id || getClientIp(request)}`,
      isAdmin ? 40 : 20,
      60_000
    );
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many wallet requests. Please wait a moment.' },
        { status: rateLimit.unavailable ? 503 : 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || '').trim();
    if (!['deposit', 'deduct'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid wallet action.' }, { status: 400 });
    }

    await ensureClientRecord(user);

    if (action === 'deduct') {
      const orderId = String(body?.orderId || '').trim();
      if (!orderId) {
        return NextResponse.json({ success: false, error: 'Order ID is required.' }, { status: 400 });
      }

      // Never grant the administrator ownership override for a wallet payment.
      // A wallet deduction must belong to the currently signed-in account.
      const payment = await resolveAuthoritativePayment({
        supabase: supabaseAdmin,
        user,
        isAdmin: false,
        body: { type: 'order_payment', orderId }
      });

      const { data: rpcBalance, error: rpcError } = await supabaseAdmin.rpc('deduct_wallet_balance', {
        p_client_email: payment.targetEmail,
        p_amount: payment.amount,
        p_order_id: payment.orderId
      });

      if (rpcError) {
        return NextResponse.json(
          { success: false, error: rpcError.message?.toLowerCase().includes('insufficient')
            ? 'Insufficient wallet balance for this order.'
            : 'Wallet payment could not be completed.' },
          { status: walletRpcStatus(rpcError) }
        );
      }

      const cleanId = String(payment.orderId || '').replace(/^#+/, '');
      try {
        const nowIso = new Date().toISOString();
        await supabaseAdmin.from('notifications').upsert([{
          id: `ord-paid-${cleanId}`,
          recipient_role: 'client',
          recipient_email: payment.targetEmail,
          title: '💳 Payment Confirmed - Order Active!',
          message: `Wallet payment confirmed for Order #${cleanId}. Production is underway.`,
          type: 'success',
          order_id: cleanId,
          link: `/client-portal?tab=orders&trackOrder=${encodeURIComponent(cleanId)}`,
          read: false,
          created_at: nowIso,
          updated_at: nowIso
        }], { onConflict: 'id' });
      } catch (error) {
        logServerCaughtError(error, { operation: 'wallet.notification_upsert_failed' });
      }

      return NextResponse.json({
        success: true,
        balance: Number(rpcBalance || 0),
        amount: payment.amount,
        orderId: payment.orderId,
        message: `Successfully paid $${payment.amount.toFixed(2)} via Studio Wallet.`
      });
    }

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Direct deposits are disabled. Please use the checkout portal.' },
        { status: 403 }
      );
    }

    const amount = Number.parseFloat(body?.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 5000) {
      return NextResponse.json(
        { success: false, error: 'Manual credit amount must be between $0.01 and $5,000.' },
        { status: 400 }
      );
    }

    const email = user.email.toLowerCase().trim();
    const { data: rpcBalance, error: rpcError } = await supabaseAdmin.rpc('deposit_funds', {
      p_client_email: email,
      p_amount: Number(amount.toFixed(2)),
      p_payment_method: body?.paymentMethod || 'Admin Credit / Manual'
    });

    if (rpcError) {
      return NextResponse.json(
        { success: false, error: 'Manual wallet credit could not be completed.' },
        { status: walletRpcStatus(rpcError) }
      );
    }

    return NextResponse.json({
      success: true,
      balance: Number(rpcBalance || 0),
      amount: Number(amount.toFixed(2)),
      message: `Successfully credited $${amount.toFixed(2)} to the Studio Wallet.`
    });
  } catch (error) {
    if (error instanceof PaymentAuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    console.error('Wallet POST Exception:', error);
    return NextResponse.json(
      { success: false, error: 'Wallet operation failed.' },
      { status: 500 }
    );
  }
}

// GET /api/wallet - authenticated user's balance and ledger only.
async function GET_impl(request) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Wallet service is temporarily unavailable.' },
        { status: 503 }
      );
    }

    const { user, error: authError } = await getServerAuthUser(request);
    if (authError || !user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const rateLimit = await checkDistributedRateLimit(
      `wallet-get:${user.id || getClientIp(request)}`,
      60,
      60_000
    );
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many wallet requests. Please wait a moment.' },
        { status: rateLimit.unavailable ? 503 : 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const email = user.email.toLowerCase().trim();

    const [{ data: clientData, error: clientError }, { data: transactions, error: txError }] = await Promise.all([
      supabaseAdmin
        .from('clients')
        .select('id, wallet_balance')
        .ilike('email', email)
        .maybeSingle(),
      supabaseAdmin
        .from('transactions')
        .select('*')
        .ilike('client_email', email)
        .order('created_at', { ascending: false })
        .limit(30)
    ]);

    if (clientError || txError) {
      throw clientError || txError;
    }

    return NextResponse.json({
      success: true,
      balance: Number.parseFloat(clientData?.wallet_balance || 0),
      transactions: transactions || []
    });
  } catch (error) {
    console.error('Wallet GET Exception:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wallet information.' },
      { status: 500 }
    );
  }
}

export const GET = withApiObservability(GET_impl);
export const POST = withApiObservability(POST_impl);
