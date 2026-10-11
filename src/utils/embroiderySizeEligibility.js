/**
 * Embroidery package eligibility. Rank follows the admin-published package
 * display order (not a hard-coded price, so changing prices does not break it).
 *
 * Up to 4 in => tier 1+, 4–7 in => tier 2+, 7–12 in => tier 3+.
 * Use the LARGER dimension for custom artwork. Invalid/oversized => no quote.
 */
export function requiredEmbroideryRank(sizeOption, width, height) {
  if (sizeOption === 'cap' || sizeOption === 'left-chest') return 1;
  if (sizeOption === 'sleeve') return 2;
  if (sizeOption === 'jacket-back') return 3;
  if (sizeOption !== 'custom') return null;
  if (String(width ?? '').trim() === '' || String(height ?? '').trim() === '') return null;
  const w = Number(width);
  const h = Number(height);
  if (![w,h].every(n => Number.isFinite(n) && n > 0 && n <= 12)) return null;
  const size = Math.max(w,h);
  return size <= 4 ? 1 : size <= 7 ? 2 : 3;
}

export function embroideryTierRank(tier, index = 0) {
  const order = Number(tier?.display_order || tier?.sort_order);
  return Number.isSafeInteger(order) && order > 0 ? order : index + 1;
}

export function eligibleEmbroideryTiers(tiers, requiredRank) {
  if (!Number.isInteger(requiredRank) || requiredRank < 1) return [];
  return (tiers || []).filter((tier, index) => embroideryTierRank(tier, index) >= requiredRank);
}

export function chooseEmbroideryTier(tiers, requiredRank, preferred) {
  const eligible = eligibleEmbroideryTiers(tiers, requiredRank);
  return eligible.find(t => String(t.id || t.title) === String(preferred?.id || preferred?.title))
    || eligible[0] || null;
}

/** Server reads the SAME eligibility policy from the order's placement field. */
export function embroideryRankFromPlacement(placement) {
  const p = String(placement || '');
  if (/^Cap \/ Hat \(Up to 2\.5"\)$/.test(p)) return 1;
  if (/^Left Chest \(Up to 4"\)$/.test(p)) return 1;
  if (/^Jacket Front \/ Sleeve \(Up to 7"\)$/.test(p)) return 2;
  if (/^Full Jacket Back \(Up to 12"\)$/.test(p)) return 3;
  const dims = p.match(/^(\d+(?:\.\d+)?)" × (\d+(?:\.\d+)?)" \(Custom\)$/);
  return dims ? requiredEmbroideryRank('custom',dims[1],dims[2]) : null;
}

/** Authoritative server guard for package capacity; independent of client pricing. */
export function isEmbroideryOrderTierEligible(placement, tier) {
  const requiredRank = embroideryRankFromPlacement(placement);
  return Boolean(requiredRank && tier && embroideryTierRank(tier) >= requiredRank);
}
