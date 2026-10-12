/**
 * Compact notification copy for the header bell and notification lists.
 * Only presentation is changed: original records, IDs, and links stay intact
 * so clicking a notification can still open the related order.
 */
function shorten(value, maxLength) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + '…';
}

export function getCompactNotificationText(notification) {
  const title = String(notification?.title || 'Notification').trim();
  const message = String(notification?.message || notification?.body || '').trim();
  const identifier = String(notification?.id || '').toLowerCase();
  const titleLower = title.toLowerCase();
  const cancellation = /cancellation|cancelled|canceled/.test(titleLower)
    || /(?:^|-)cancel(?:-|$)/.test(identifier);

  if (cancellation) {
    const rawOrderId = notification?.order_id || notification?.orderId
      || notification?.metadata?.order_id
      || message.match(/\border\s*#?\s*([a-z0-9_-]+)/i)?.[1]
      || '';
    const orderId = String(rawOrderId).trim().replace(/^#+/, '');
    const orderLabel = orderId ? `Order #${orderId}` : 'Order';

    if (/approv/.test(titleLower) || /approved-cancel/.test(identifier)) {
      return { title: 'Cancellation approved', message: `${orderLabel} · View details` };
    }
    if (/declin|reject/.test(titleLower) || /rejected-cancel/.test(identifier)) {
      return { title: 'Cancellation declined', message: `${orderLabel} · View details` };
    }
    if (/submit|sent/.test(titleLower) || /cust-cancel/.test(identifier)) {
      return { title: 'Cancellation submitted', message: `${orderLabel} · Awaiting review` };
    }
    if (/cancelled|canceled/.test(titleLower)) {
      return { title: 'Order cancelled', message: `${orderLabel} · View details` };
    }
    return { title: 'Cancellation requested', message: `${orderLabel} · Review request` };
  }

  const rawOrderId = String(notification?.order_id || notification?.orderId || '').trim().replace(/^#+/, '');
  const orderLabel = rawOrderId ? `Order #${rawOrderId}` : 'Order';
  if (/new order|order placed|order received|order submitted/.test(titleLower)) {
    return { title: 'New order', message: `${orderLabel} · View order` };
  }
  if (/payment confirmed|payment received/.test(titleLower)) {
    return { title: 'Payment confirmed', message: `${orderLabel} · View order` };
  }
  if (/files ready|files delivered|order delivered/.test(titleLower)) {
    return { title: 'Files ready', message: `${orderLabel} · View order` };
  }
  return {
    title: shorten(title, 45),
    message: shorten(message, 72)
  };
}
