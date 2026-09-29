export function canAccessOfferRecord(offer, { user, isAdmin }) {
  if (!offer || !user?.email) return false;
  if (isAdmin) return true;

  const userEmail = String(user.email).toLowerCase().trim();
  const offerEmail = String(offer.client_email || '').toLowerCase().trim();
  const sameEmail = Boolean(userEmail && offerEmail && userEmail === offerEmail);

  const userId = String(user.id || '').trim();
  const customerId = String(offer.customer_id || '').trim();
  const sameUserId = Boolean(userId && customerId && userId === customerId);

  return sameEmail || sameUserId;
}
