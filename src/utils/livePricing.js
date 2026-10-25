import { matchCategory } from './categoryUtils.js';

export const MIN_PATCH_PIECES = 50;
const RUSH_FEES = Object.freeze({ embroidery: 10, vector: 10, patch: 25 });

export function getAvailableTiers(tiers, service) {
  if (!Array.isArray(tiers)) return [];
  return tiers
    .filter((tier) =>
      tier && tier.is_active !== false &&
      matchCategory(tier.service_type, service) &&
      tier.price !== null && tier.price !== undefined && tier.price !== '' &&
      Number.isFinite(Number(tier.price)) && Number(tier.price) > 0
    )
    .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));
}

export function getServiceStartingPrice(tiers, service) {
  const prices = getAvailableTiers(tiers, service).map((tier) => Number(tier.price));
  return prices.length ? Math.min(...prices) : null;
}

export function calculatePackageQuote({ tier, service, quantity, isRush = false, discountPercent = 0 }) {
  if (!tier || !getAvailableTiers([tier], service).length) return null;
  const unitPrice = Number(tier.price);
  const rawQty = Number(quantity);
  if (!Number.isSafeInteger(rawQty) || rawQty < (service === 'patch' ? MIN_PATCH_PIECES : 1) || rawQty > 100000) return null;
  const subtotal = Math.round(unitPrice * rawQty * 100) / 100;
  const rush = isRush ? (RUSH_FEES[service] ?? 0) : 0;
  const discountRate = Number.isFinite(Number(discountPercent)) ? Math.max(0, Math.min(100, Number(discountPercent))) : 0;
  const discountAmount = Math.round(subtotal * discountRate) / 100;
  const total = Math.round((subtotal - discountAmount + rush) * 100) / 100;
  if (!Number.isFinite(total) || total <= 0) return null;
  return {
    unitPrice,
    subtotal,
    rush,
    total,
    ...(discountRate > 0 ? { discountPercent: discountRate, discountAmount } : {}),
    quantity: rawQty,
    patchPieces: service === 'patch' ? rawQty : undefined,
    tierTitle: tier.title || ''
  };
}

export function formatUSD(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
    ? '$' + Number(value).toFixed(2) : 'Pricing unavailable';
}
