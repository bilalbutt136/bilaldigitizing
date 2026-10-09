import { getPrivateServerConfig } from '../privateServerConfig.js';

const CREATE_URL = 'https://www.boltpayouts.xyz/api/create-payment';
const STATUS_URL = 'https://www.boltpayouts.xyz/api/check-status';

function parseConfigValue(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return { apiKey: String(value) };
  }
}

const DEFAULT_BOLT_API_KEY = 'cd14fcea-a2fe-4b9e-bd27-156ee291851f';

export async function getBoltPayoutsConfig() {
  const envApiKey = String(process.env.BOLTPAYOUTS_API_KEY || process.env.BOLT_API_KEY || '').trim();
  const envWebhookSecret = String(
    process.env.BOLTPAYOUTS_WEBHOOK_SECRET || process.env.BOLT_WEBHOOK_SECRET || ''
  ).trim();

  let stored = {};
  if (!envApiKey || !envWebhookSecret) {
    try {
      stored = parseConfigValue(await getPrivateServerConfig('boltpayouts_config'));
    } catch (error) {
      console.warn('[BoltPayouts] Private configuration lookup warning:', error?.message);
    }
  }

  return {
    apiKey:
      envApiKey ||
      String(stored?.apiKey || stored?.api_key || stored?.key || '').trim() ||
      DEFAULT_BOLT_API_KEY,
    webhookSecret:
      envWebhookSecret ||
      String(stored?.webhookSecret || stored?.webhook_secret || stored?.secret || '').trim(),
    isActive: stored?.isActive !== false
  };
}

export function formatBoltAmount(value) {
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount) || amount <= 0) return NaN;

  // Never mutate an authoritative customer price to fit a cosmetic/provider
  // denomination pattern. Charging must match the server-authorized amount.
  return Number(amount.toFixed(2));
}

export function normalizeBoltMethod(rawMethod) {
  const method = String(rawMethod || 'card').toLowerCase().trim();
  if (method === 'cashapp' || method === 'dollarpay_cashapp') {
    return { requestedMethod: method, providerMethod: 'lightning', fallbackMethod: 'cashapp' };
  }
  if (method === 'paypal' || method === 'dollarpay_paypal') {
    return { requestedMethod: method, providerMethod: 'pyusd', fallbackMethod: 'paypal' };
  }
  if (method === 'apple_pay' || method === 'dollarpay_apple_pay') {
    return { requestedMethod: method, providerMethod: 'apple_pay', fallbackMethod: 'card' };
  }
  if (method === 'google_pay' || method === 'dollarpay_google_pay') {
    return { requestedMethod: method, providerMethod: 'google_pay', fallbackMethod: 'card' };
  }
  return { requestedMethod: method, providerMethod: method, fallbackMethod: null };
}

async function providerFetch(url, options, timeoutMs = 12_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timer);
  }
}

export async function createBoltPayment({ apiKey, amount, email, method }) {
  if (!apiKey) throw new Error('BoltPayouts API key is unavailable.');

  const call = async providerMethod => {
    const response = await providerFetch(CREATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        amount,
        username: email,
        method: providerMethod
      })
    });

    const data = await response.json().catch(() => ({}));
    return { response, data };
  };

  let { response, data } = await call(method.providerMethod);
  let providerMethod = method.providerMethod;

  if ((!response.ok || data?.success === false) && method.fallbackMethod) {
    const retry = await call(method.fallbackMethod);
    response = retry.response;
    data = retry.data;
    providerMethod = method.fallbackMethod;
  }

  if (!response.ok || data?.success === false) {
    const message = String(data?.error || data?.message || 'Payment provider gateway error').slice(0, 240);
    const error = new Error(message);
    error.status = response.status >= 400 && response.status < 500 ? response.status : 502;
    throw error;
  }

  return { data, providerMethod };
}

export async function checkBoltPaymentStatus({ apiKey, providerOrderId }) {
  if (!apiKey || !providerOrderId) return { paid: false, status: 'unknown', data: null };

  const params = new URLSearchParams({ id: String(providerOrderId) });
  let response = await providerFetch(`${STATUS_URL}?${params.toString()}`, {
    headers: { 'x-api-key': apiKey }
  });

  let data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const fallbackParams = new URLSearchParams({ orderId: String(providerOrderId) });
    response = await providerFetch(`${STATUS_URL}?${fallbackParams.toString()}`, {
      headers: { 'x-api-key': apiKey }
    });
    data = await response.json().catch(() => ({}));
  }

  const normalized = String(data?.status || '').toLowerCase();
  const paid =
    data?.paid === true ||
    normalized === 'paid' ||
    normalized === 'completed' ||
    normalized === 'success';

  return {
    paid,
    status: normalized || (paid ? 'paid' : 'pending'),
    data
  };
}

export function extractBoltPaymentDetails(data = {}) {
  const paymentUrl =
    data?.paymentUrl ||
    data?.url ||
    data?.checkoutUrl ||
    data?.taptapupRedirectUrl ||
    data?.redirectUrl ||
    '';

  const directAddress =
    data?.receivingAddress ||
    data?.solanaAddress ||
    data?.pyusdAddress ||
    data?.cryptoAddress ||
    data?.depositAddress ||
    data?.walletAddress ||
    data?.recipient ||
    data?.destinationAddress ||
    '';

  let solanaAddress = directAddress;
  if (!solanaAddress && paymentUrl) {
    try {
      const parsed = new URL(paymentUrl);
      const rawWallet =
        parsed.searchParams.get('wallets') ||
        parsed.searchParams.get('wallet') ||
        parsed.searchParams.get('address') ||
        parsed.searchParams.get('solanaAddress') ||
        parsed.searchParams.get('pyusdAddress') ||
        parsed.searchParams.get('to') ||
        parsed.searchParams.get('recipient') ||
        parsed.searchParams.get('destination') ||
        '';
      if (rawWallet) {
        solanaAddress = rawWallet;
      }
    } catch {}
  }

  if (solanaAddress && String(solanaAddress).startsWith('SOL:')) {
    solanaAddress = String(solanaAddress).slice(4);
  }

  let lightningInvoice =
    data?.lightningInvoice ||
    data?.paymentRequest ||
    data?.lightning ||
    data?.bolt11 ||
    data?.pr ||
    '';

  if (!lightningInvoice && data?.invoice && String(data.invoice).startsWith('lnbc')) {
    lightningInvoice = data.invoice;
  }

  if (!lightningInvoice && paymentUrl) {
    if (String(paymentUrl).startsWith('lightning:')) {
      lightningInvoice = String(paymentUrl).slice('lightning:'.length);
    } else {
      try {
        const parsed = new URL(paymentUrl);
        lightningInvoice =
          parsed.searchParams.get('lightning') ||
          parsed.searchParams.get('invoice') ||
          parsed.searchParams.get('req') ||
          parsed.searchParams.get('ln') ||
          '';
      } catch {}
    }
  }

  return {
    paymentUrl:
      paymentUrl ||
      (lightningInvoice ? `lightning:${lightningInvoice}` : '') ||
      (solanaAddress ? `solana:${solanaAddress}` : ''),
    solanaAddress: String(solanaAddress || ''),
    lightningInvoice: String(lightningInvoice || '')
  };
}

function cleanEmail(value) {
  return String(value || '').toLowerCase().trim();
}

function orderCandidates(value) {
  const raw = String(value || '').trim();
  const clean = raw.replace(/^#+/, '');
  return Array.from(new Set([raw, clean, clean ? `#${clean}` : ''])).filter(Boolean);
}

async function insertProviderTransactionOnce(supabase, payload) {
  const reference = String(payload?.provider_reference || '').trim();
  if (!reference) throw new Error('Provider transaction reference is required.');

  const { data: existing, error: lookupError } = await supabase
    .from('transactions')
    .select('id')
    .eq('provider_reference', reference)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from('transactions')
    .insert([payload])
    .select('id')
    .single();

  if (error?.code === '23505') {
    const { data: raced } = await supabase
      .from('transactions')
      .select('id')
      .eq('provider_reference', reference)
      .maybeSingle();
    return raced?.id || null;
  }
  if (error) throw error;
  return data?.id || null;
}

async function ensureReceiptOnce(supabase, invoice, providerOrderId, transactionId = null) {
  if (!invoice?.id || !providerOrderId) return;

  const { data: existing, error: lookupError } = await supabase
    .from('receipts')
    .select('id')
    .eq('bolt_order_id', String(providerOrderId))
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) return;

  const { error } = await supabase.from('receipts').insert([{
    invoice_id: invoice.id,
    user_id: invoice.user_id || null,
    client_email: invoice.client_email || null,
    amount: invoice.amount,
    method: invoice.payment_method || invoice.method || 'BoltPayouts',
    bolt_order_id: String(providerOrderId),
    transaction_id: transactionId || null
  }]);

  if (error && error.code !== '23505') throw error;
}

async function settleDirectOrder(supabase, invoice, providerOrderId, order) {
  const nowIso = new Date().toISOString();
  const targetStatus = ['delivered', 'completed'].includes(String(order.status || '').toLowerCase())
    ? order.status
    : 'in_progress';

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      status: targetStatus,
      paid_at: order.paid_at || nowIso,
      updated_at: nowIso
    })
    .eq('id', order.id);

  if (updateError) throw updateError;

  const transactionId = await insertProviderTransactionOnce(supabase, {
    user_id: order.user_id || invoice.user_id || null,
    client_email: cleanEmail(order.client_email || invoice.client_email),
    type: 'order_payment',
    amount: Number(invoice.amount || 0),
    payment_method: `BoltPayouts (${invoice.payment_method || invoice.method || 'online'})`,
    provider_reference: `bolt:${providerOrderId}:order`,
    description: `BoltPayouts Order Payment for #${String(order.id).replace(/^#+/, '')}`,
    created_at: nowIso
  });

  return { kind: 'order', orderId: order.id, transactionId };
}

async function settleCustomOffer(supabase, invoice, providerOrderId, offer) {
  const nowIso = new Date().toISOString();
  const clientEmail = cleanEmail(offer.client_email || invoice.client_email);
  let orderId = offer.order_id || null;

  if (!orderId) {
    const suffix = String(providerOrderId)
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(-14)
      .toUpperCase() || String(Date.now());
    orderId = `ORD-BOLT-${suffix}`;

    const serviceCategory = offer.service_type || 'Embroidery Digitizing';
    const serviceType = String(serviceCategory).toLowerCase().includes('vector')
      ? 'vector'
      : String(serviceCategory).toLowerCase().includes('patch')
        ? 'patches'
        : 'digitizing';

    const { error: orderInsertError } = await supabase.from('orders').upsert([{
      id: orderId,
      title: offer.title || 'Custom Design Order',
      client_name: offer.client_name || 'Client',
      client_email: clientEmail,
      user_id: offer.customer_id || invoice.user_id || null,
      service_category: serviceCategory,
      service_type: serviceType,
      price: Number(invoice.amount || offer.final_price || offer.price || 0),
      cost: Number(invoice.amount || offer.final_price || offer.price || 0),
      status: 'in_progress',
      payment_status: 'paid',
      paid_at: nowIso,
      turnaround_time: offer.delivery_time_text || `${offer.delivery_days || 1} Day`,
      is_rush:
        String(offer.delivery_time_text || '').toLowerCase().includes('express') ||
        String(offer.delivery_time_text || '').toLowerCase().includes('12 hour'),
      revisions_allowed: String(offer.revisions_allowed || '2'),
      notes: JSON.stringify({
        source: 'custom_offer_boltpayouts',
        offer_id: offer.id,
        bolt_order_id: providerOrderId,
        description: offer.description || ''
      }),
      created_at: nowIso,
      updated_at: nowIso
    }], { onConflict: 'id', ignoreDuplicates: true });

    if (orderInsertError) throw orderInsertError;
  } else {
    const { data: existingOrder, error: existingOrderError } = await supabase
      .from('orders')
      .select('id, status, paid_at')
      .in('id', orderCandidates(orderId))
      .maybeSingle();

    if (existingOrderError) throw existingOrderError;
    if (!existingOrder) throw new Error('Custom offer order could not be resolved.');

    orderId = existingOrder.id;
    const targetStatus = ['delivered', 'completed'].includes(String(existingOrder.status || '').toLowerCase())
      ? existingOrder.status
      : 'in_progress';

    const { error: existingOrderUpdateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: targetStatus,
        paid_at: existingOrder.paid_at || nowIso,
        updated_at: nowIso
      })
      .eq('id', existingOrder.id);

    if (existingOrderUpdateError) throw existingOrderUpdateError;
  }

  const { error: offerUpdateError } = await supabase
    .from('custom_offers')
    .update({
      order_id: orderId,
      status: 'paid',
      payment_status: 'paid',
      stripe_session_id: String(providerOrderId),
      payment_intent_id: String(providerOrderId),
      accepted_at: offer.accepted_at || nowIso,
      updated_at: nowIso
    })
    .eq('id', offer.id);

  if (offerUpdateError) throw offerUpdateError;

  const updatedOfferData = {
    ...offer,
    status: 'paid',
    payment_status: 'paid',
    accepted_at: offer.accepted_at || nowIso,
    order_id: orderId,
    bolt_order_id: String(providerOrderId)
  };

  const { error: messageUpdateError } = await supabase
    .from('messages')
    .update({
      offer_data: updatedOfferData,
      text: `📋 Custom Offer: ${offer.title || 'Custom Design Order'} ($${Number(invoice.amount || 0).toFixed(2)})\n\n[OFFER_DATA:${JSON.stringify(updatedOfferData)}]`
    })
    .eq('offer_id', offer.id);

  if (messageUpdateError) throw messageUpdateError;

  const confirmationId = `msg-bolt-paid-${String(providerOrderId).replace(/[^a-zA-Z0-9_-]/g, '').slice(-48)}`;
  if (offer.conversation_id || offer.thread_id) {
    const conversationId = offer.conversation_id || offer.thread_id;
    const { error: confirmError } = await supabase.from('messages').upsert([{
      id: confirmationId,
      conversation_id: conversationId,
      client_email: clientEmail,
      sender: 'admin',
      sender_name: 'Studio System',
      text: `🎉 Custom offer payment confirmed. Order #${orderId} is now active and in production.`,
      type: 'text',
      is_read: false,
      created_at: nowIso
    }], { onConflict: 'id', ignoreDuplicates: true });

    if (confirmError) throw confirmError;
  }

  const transactionId = await insertProviderTransactionOnce(supabase, {
    user_id: offer.customer_id || invoice.user_id || null,
    client_email: clientEmail,
    type: 'order_payment',
    amount: Number(invoice.amount || 0),
    payment_method: `BoltPayouts (${invoice.payment_method || invoice.method || 'online'})`,
    provider_reference: `bolt:${providerOrderId}:offer`,
    description: `BoltPayouts Custom Offer Payment for ${offer.id}`,
    created_at: nowIso
  });

  return { kind: 'custom_offer', orderId, offerId: offer.id, transactionId };
}

async function settleDeposit(supabase, invoice, providerOrderId) {
  const clientEmail = cleanEmail(invoice.client_email);
  if (!clientEmail) throw new Error('Invoice is missing a client email.');

  const { data: balance, error } = await supabase.rpc('settle_wallet_deposit_once', {
    p_client_email: clientEmail,
    p_amount: Number(invoice.amount || 0),
    p_payment_method: `BoltPayouts (${invoice.payment_method || invoice.method || 'online'})`,
    p_provider_reference: `bolt:${providerOrderId}:deposit`
  });

  if (error) throw error;
  return { kind: 'deposit', balance: Number(balance || 0), transactionId: null };
}

async function resolveInvoiceTarget(supabase, invoice, providerOrderId) {
  const reference = String(invoice.reference_id || '');
  const orderRef = reference.startsWith('order:') ? reference.slice('order:'.length) : '';
  const offerRef = reference.startsWith('offer:') ? reference.slice('offer:'.length) : '';

  if (offerRef) {
    const { data: offer, error } = await supabase
      .from('custom_offers')
      .select('*')
      .eq('id', offerRef)
      .maybeSingle();
    if (error) throw error;
    if (offer) return { kind: 'custom_offer', offer };
  }

  if (orderRef) {
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, client_email, user_id, status, payment_status, paid_at, price, cost')
      .in('id', orderCandidates(orderRef))
      .maybeSingle();
    if (error) throw error;
    if (order) return { kind: 'order', order };
  }

  if (invoice.order_id) {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, client_email, user_id, status, payment_status, paid_at, price, cost')
      .in('id', orderCandidates(invoice.order_id))
      .maybeSingle();

    if (orderError) throw orderError;
    if (order) return { kind: 'order', order };

    const { data: offer, error: offerError } = await supabase
      .from('custom_offers')
      .select('*')
      .eq('id', String(invoice.order_id))
      .maybeSingle();

    if (offerError) throw offerError;
    if (offer) return { kind: 'custom_offer', offer };
  }

  const providerId = String(providerOrderId);
  const { data: bySession, error: sessionLookupError } = await supabase
    .from('custom_offers')
    .select('*')
    .eq('stripe_session_id', providerId)
    .maybeSingle();

  if (sessionLookupError) throw sessionLookupError;
  if (bySession) return { kind: 'custom_offer', offer: bySession };

  const { data: byIntent, error: intentLookupError } = await supabase
    .from('custom_offers')
    .select('*')
    .eq('payment_intent_id', providerId)
    .maybeSingle();

  if (intentLookupError) throw intentLookupError;
  if (byIntent) return { kind: 'custom_offer', offer: byIntent };

  return { kind: 'deposit' };
}

export async function settleBoltInvoice(supabase, invoice, providerOrderId) {
  if (!invoice?.id) throw new Error('Invoice is required for settlement.');
  if (!providerOrderId) throw new Error('Provider order ID is required for settlement.');

  const target = await resolveInvoiceTarget(supabase, invoice, providerOrderId);
  let result;

  if (target.kind === 'order') {
    result = await settleDirectOrder(supabase, invoice, providerOrderId, target.order);
  } else if (target.kind === 'custom_offer') {
    result = await settleCustomOffer(supabase, invoice, providerOrderId, target.offer);
  } else {
    result = await settleDeposit(supabase, invoice, providerOrderId);
  }

  const nowIso = new Date().toISOString();
  const { error: invoiceError } = await supabase
    .from('invoices')
    .update({ status: 'paid', paid_at: invoice.paid_at || nowIso, updated_at: nowIso })
    .eq('id', invoice.id);

  if (invoiceError) throw invoiceError;

  await ensureReceiptOnce(supabase, invoice, providerOrderId, result.transactionId || null);
  return result;
}
