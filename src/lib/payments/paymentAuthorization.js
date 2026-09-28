export class PaymentAuthorizationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'PaymentAuthorizationError';
    this.status = status;
  }
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function moneyToNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const normalized = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function positiveMoney(value, label) {
  const amount = moneyToNumber(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new PaymentAuthorizationError(`Invalid authoritative ${label} amount.`, 409);
  }
  return Number(amount.toFixed(2));
}

function orderIdCandidates(rawOrderId) {
  const raw = String(rawOrderId || '').trim();
  const clean = raw.replace(/^#+/, '');
  return Array.from(new Set([raw, clean, clean ? `#${clean}` : ''])).filter(Boolean);
}

function assertOwner({ ownerEmail, ownerUserId, user, isAdmin, resource }) {
  if (isAdmin) return;
  const userEmail = normalizeEmail(user?.email);
  const emailMatches = ownerEmail && normalizeEmail(ownerEmail) === userEmail;
  const idMatches = ownerUserId && user?.id && String(ownerUserId) === String(user.id);
  if (!emailMatches && !idMatches) {
    throw new PaymentAuthorizationError(`You are not authorized to pay this ${resource}.`, 403);
  }
}

export async function resolveAuthoritativePayment({
  supabase,
  user,
  isAdmin = false,
  body = {},
  allowDeposit = false
}) {
  if (!user?.email) {
    throw new PaymentAuthorizationError('Authentication is required to create a payment.', 401);
  }

  const requestedType = String(body.type || '').trim();
  const offerId = body.offerId ? String(body.offerId).trim() : '';
  const rawOrderId = body.orderId ? String(body.orderId).trim() : '';
  const type = offerId || requestedType === 'custom_offer'
    ? 'custom_offer'
    : rawOrderId || requestedType === 'order_payment'
      ? 'order_payment'
      : requestedType === 'deposit'
        ? 'deposit'
        : '';

  if (type === 'custom_offer') {
    if (!offerId) {
      throw new PaymentAuthorizationError('A custom offer ID is required.', 400);
    }

    const { data: offer, error } = await supabase
      .from('custom_offers')
      .select('id, client_email, customer_id, title, service_type, price, final_price, status, payment_status, conversation_id, thread_id, order_id')
      .eq('id', offerId)
      .maybeSingle();

    if (error) throw new PaymentAuthorizationError('Unable to verify this custom offer.', 503);
    if (!offer) throw new PaymentAuthorizationError('Custom offer not found.', 404);

    assertOwner({
      ownerEmail: offer.client_email,
      ownerUserId: offer.customer_id,
      user,
      isAdmin,
      resource: 'custom offer'
    });

    if (String(offer.payment_status || offer.status || '').toLowerCase() === 'paid') {
      throw new PaymentAuthorizationError('This custom offer is already paid.', 409);
    }

    const amount = positiveMoney(offer.final_price ?? offer.price, 'custom offer');
    return {
      type,
      amount,
      amountCents: Math.round(amount * 100),
      targetEmail: normalizeEmail(offer.client_email || user.email),
      targetUserId: offer.customer_id || user.id,
      orderId: offer.order_id || null,
      offerId: offer.id,
      conversationId: offer.conversation_id || offer.thread_id || null,
      title: offer.title || 'Custom Design Order'
    };
  }

  if (type === 'order_payment') {
    if (!rawOrderId) {
      throw new PaymentAuthorizationError('An order ID is required.', 400);
    }

    const candidates = orderIdCandidates(rawOrderId);
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, client_email, user_id, title, price, cost, payment_status, status')
      .in('id', candidates)
      .maybeSingle();

    if (error) throw new PaymentAuthorizationError('Unable to verify this order.', 503);
    if (!order) throw new PaymentAuthorizationError('Order not found.', 404);

    assertOwner({
      ownerEmail: order.client_email,
      ownerUserId: order.user_id,
      user,
      isAdmin,
      resource: 'order'
    });

    if (String(order.payment_status || '').toLowerCase() === 'paid') {
      throw new PaymentAuthorizationError('This order is already paid.', 409);
    }

    const amount = positiveMoney(order.price ?? order.cost, 'order');
    return {
      type,
      amount,
      amountCents: Math.round(amount * 100),
      targetEmail: normalizeEmail(order.client_email || user.email),
      targetUserId: order.user_id || user.id,
      orderId: order.id,
      offerId: null,
      conversationId: null,
      title: order.title || `Order ${order.id}`
    };
  }

  if (type === 'deposit' && allowDeposit) {
    const amount = positiveMoney(body.amount, 'deposit');
    if (amount < 5 || amount > 5000) {
      throw new PaymentAuthorizationError('Deposit amount must be between $5 and $5,000.', 400);
    }
    return {
      type,
      amount,
      amountCents: Math.round(amount * 100),
      targetEmail: normalizeEmail(user.email),
      targetUserId: user.id,
      orderId: null,
      offerId: null,
      conversationId: null,
      title: 'Studio Wallet Top-up'
    };
  }

  throw new PaymentAuthorizationError('Unsupported payment request.', 400);
}
