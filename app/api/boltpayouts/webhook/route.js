import { withApiObservability } from '../../../../src/lib/observability/apiObservability.js';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { enforceApiBurstLimit } from '../../../../src/lib/apiBurstGuard.js';
import {
  getBoltPayoutsConfig,
  settleBoltInvoice
} from '../../../../src/lib/payments/boltPayouts';

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''), 'utf8');
  const b = Buffer.from(String(right || ''), 'utf8');
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

function validHmac(rawBody, suppliedSignature, secret) {
  if (!suppliedSignature || !secret) return false;

  const cleanSignature = String(suppliedSignature)
    .trim()
    .replace(/^sha256=/i, '');

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return safeEqual(cleanSignature, expected);
}

function isPaidPayload(payload) {
  const event = String(payload?.event || payload?.type || '').toLowerCase();
  const status = String(payload?.status || '').toLowerCase();
  return (
    event === 'payment.success' ||
    event === 'payment_success' ||
    status === 'completed' ||
    status === 'paid' ||
    status === 'success' ||
    payload?.paid === true
  );
}

async function POST_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'boltpayouts-webhook', 120, 60_000);
  if (burstResponse) return burstResponse;

  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Payment webhook service is unavailable.' },
        { status: 503 }
      );
    }

    const rawBody = await request.text();
    if (!rawBody || rawBody.length > 256_000) {
      return NextResponse.json({ success: false, error: 'Invalid webhook payload.' }, { status: 400 });
    }

    const config = await getBoltPayoutsConfig();
    if (!config.apiKey && !config.webhookSecret) {
      console.error('[BoltPayouts Webhook] Provider credentials are not configured.');
      return NextResponse.json(
        { success: false, error: 'Payment webhook configuration is unavailable.' },
        { status: 503 }
      );
    }

    const signature =
      request.headers.get('x-boltpayouts-signature') ||
      request.headers.get('x-bolt-signature') ||
      request.headers.get('x-signature') ||
      request.headers.get('signature') ||
      '';
    const apiKeyHeader = request.headers.get('x-api-key') || '';

    const authorizedByKey = config.apiKey && safeEqual(apiKeyHeader.trim(), config.apiKey);
    const authorizedBySignature = validHmac(rawBody, signature, config.webhookSecret);

    if (!authorizedByKey && !authorizedBySignature) {
      return NextResponse.json({ success: false, error: 'Unauthorized webhook request.' }, { status: 401 });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload.' }, { status: 400 });
    }

    if (!isPaidPayload(payload)) {
      return NextResponse.json({ success: true, status: 'ignored' });
    }

    const providerOrderId = String(
      payload?.orderId || payload?.order_id || payload?.id || payload?.paymentId || ''
    ).trim();

    if (!providerOrderId) {
      return NextResponse.json({ success: false, error: 'Missing payment identifier.' }, { status: 400 });
    }

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('bolt_order_id', providerOrderId)
      .maybeSingle();

    if (invoiceError) throw invoiceError;

    if (!invoice) {
      // A stale or already-pruned provider event should not create business data.
      return NextResponse.json({ success: true, status: 'invoice_not_found' });
    }

    const settlement = await settleBoltInvoice(supabaseAdmin, invoice, providerOrderId);

    return NextResponse.json({
      success: true,
      status: 'paid',
      kind: settlement.kind,
      orderId: settlement.orderId || null
    });
  } catch (error) {
    console.error('[BoltPayouts Webhook] Processing failed:', error?.message);
    return NextResponse.json(
      { success: false, error: 'Payment webhook processing failed.' },
      { status: 500 }
    );
  }
}

export const POST = withApiObservability(POST_impl);
