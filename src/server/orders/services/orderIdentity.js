export function buildOrderIdCandidates(orderId) {
  const rawId = String(orderId || '').trim();
  const cleanId = rawId.replace(/^#+/, '');
  const withHash = cleanId ? '#' + cleanId : '';
  return { rawId, cleanId, withHash, candidateIds: Array.from(new Set([rawId, cleanId, withHash])).filter(Boolean) };
}

export function isOrderOwner(order, user) {
  if (!order || !user) return false;
  const emailMatch = String(order.client_email || '').toLowerCase().trim() === String(user.email || '').toLowerCase().trim();
  const userIdMatch = Boolean(order.user_id && user.id && order.user_id === user.id);
  return emailMatch || userIdMatch;
}
