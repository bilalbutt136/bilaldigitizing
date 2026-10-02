import { withApiObservability } from '../../../../src/lib/observability/apiObservability.js';
import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';
import { checkDistributedRateLimit, getClientIp, getRateLimitHeaders } from '../../../../src/lib/rateLimit';
import {
  checkBoltPaymentStatus,
  getBoltPayoutsConfig,
  settleBoltInvoice
} from '../../../../src/lib/payments/boltPayouts';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function orderCandidates(value) {
  const raw = String(value || '').trim();
  const clean = raw.replace(/^#+/, '');
  return Array.from(new Set([raw, clean, clean ? `#${clean}` : ''])).filter(Boolean);
}

function scopedInvoiceQuery(query, isAdmin, email) {
  return isAdmin ? query : query.ilike('client_email', email);
}

async function findInvoice({ invoiceId, orderId, genericId, isAdmin, email }) {
  if (orderId) {
    const result = await scopedInvoiceQuery(
      supabaseAdmin
        .from('invoices')
        .select('*')
        .in('order_id', orderCandidates(orderId))
        .order('created_at', { ascending: false })
        .limit(1),
      isAdmin,
      email
    );
    if (result.error) throw result.error;
    return result.data?.[0] || null;
  }

  const lookup = String(invoiceId || genericId || '').trim();
  if (!lookup) return null;

  if (UUID_RE.test(lookup)) {
    const byId = await scopedInvoiceQuery(
      supabaseAdmin.from('invoices').select('*').eq('id', lookup).limit(1),
      isAdmin,
      email
    );
    if (byId.error) throw byId.error;
    if (byId.data?.[0]) return byId.data[0];
  }

  const byProvider = await scopedInvoiceQuery(
    supabaseAdmin.from('invoices').select('*').eq('bolt_order_id', lookup).limit(1),
    isAdmin,
    email
  );
  if (byProvider.error) throw byProvider.error;
  return byProvider.data?.[0] || null;
}

async function findOwnedOrder(orderId, isAdmin, email) {
  if (!orderId) return null;
  let query = supabaseAdmin
    .from('orders')
    .select('id, client_email, status, payment_status, price, cost')
    .in('id', orderCandidates(orderId))
    .limit(1);

  if (!isAdmin) query = query.ilike('client_email', email);

  const { data, error } = await query;
  if (error) throw error;
  return data?.[0] || null;
}

async function GET_impl(request) {
  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Payment status service is temporarily unavailable.' },
        { status: 503 }
      );
    }

    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user?.email) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const rateLimit = await checkDistributedRateLimit(
      `boltpayouts-status:${user.id || getClientIp(request)}`,
      45,
      60_000
    );
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many payment status requests.' },
        { status: rateLimit.unavailable ? 503 : 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');
    const orderId = searchParams.get('orderId');
    const genericId = searchParams.get('id');

    if (!invoiceId && !orderId && !genericId) {
      return NextResponse.json(
        { success: false, error: 'Missing invoice or order identifier.' },
        { status: 400 }
      );
    }

    const email = user.email.toLowerCase().trim();
    const invoice = await findInvoice({ invoiceId, orderId, genericId, isAdmin, email });

    if (!invoice) {
      if (orderId) {
        const order = await findOwnedOrder(orderId, isAdmin, email);
        if (order) {
          const paid = String(order.payment_status || '').toLowerCase() === 'paid';
          return NextResponse.json({
            success: true,
            status: paid ? 'paid' : 'pending',
            orderId: order.id,
            amount: order.price ?? order.cost ?? null
          });
        }
      }

      return NextResponse.json(
        { success: false, status: 'not_found', error: 'Payment record not found.' },
        { status: 200 }
      );
    }

    const providerOrderId = String(invoice.bolt_order_id || '').trim();
    const currentStatus = String(invoice.status || '').toLowerCase();

    if (currentStatus === 'paid' || currentStatus === 'completed') {
      if (providerOrderId) {
        await settleBoltInvoice(supabaseAdmin, invoice, providerOrderId);
      }
      return NextResponse.json({
        success: true,
        status: 'paid',
        amount: invoice.amount,
        payment_method: invoice.payment_method || invoice.method,
        invoice
      });
    }

    const config = await getBoltPayoutsConfig();
    if (!config.apiKey || config.isActive === false || !providerOrderId) {
      return NextResponse.json({
        success: true,
        status: currentStatus || 'pending',
        amount: invoice.amount,
        payment_method: invoice.payment_method || invoice.method,
        invoice
      });
    }

    try {
      const providerStatus = await checkBoltPaymentStatus({
        apiKey: config.apiKey,
        providerOrderId
      });

      if (providerStatus.paid) {
        const settlement = await settleBoltInvoice(supabaseAdmin, invoice, providerOrderId);
        return NextResponse.json({
          success: true,
          status: 'paid',
          amount: invoice.amount,
          payment_method: invoice.payment_method || invoice.method,
          settlement,
          invoice: { ...invoice, status: 'paid' }
        });
      }
    } catch (providerError) {
      console.warn('[BoltPayouts Status] Provider reconciliation warning:', providerError?.message);
    }

    return NextResponse.json({
      success: true,
      status: currentStatus || 'pending',
      amount: invoice.amount,
      payment_method: invoice.payment_method || invoice.method,
      invoice
    });
  } catch (error) {
    console.error('[BoltPayouts Status] Status lookup failed:', error?.message);
    return NextResponse.json(
      { success: false, error: 'Payment status could not be verified.' },
      { status: 500 }
    );
  }
}

export const GET = withApiObservability(GET_impl);
