export const MONTHLY_BUNDLE_CONFIG_KEY = 'monthly_design_bundles_v1';
export const MONTHLY_DESIGN_LIMITS = Object.freeze([10, 25, 50, 100]);
export const MONTHLY_SERVICES = Object.freeze(['embroidery', 'vector']);

export function normalizeMonthlyBundle(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const service = String(raw.service || '').trim().toLowerCase();
  const designs = Number(raw.designs);
  if (!MONTHLY_SERVICES.includes(service) || !MONTHLY_DESIGN_LIMITS.includes(designs)) return null;
  const title = String(raw.title || `${designs} Designs / Month`).trim().slice(0, 80);
  const description = String(raw.description || '').trim().slice(0, 180);
  const price = raw.price === '' || raw.price == null ? null : Number(raw.price);
  const validPrice = Number.isFinite(price) && price > 0 && price <= 100000 && Math.round(price * 100) / 100 === price;
  const active = raw.active === true && validPrice;
  return {
    id: `${service}-${designs}`,
    service,
    designs,
    title: title || `${designs} Designs / Month`,
    description,
    price: validPrice ? price : null,
    active
  };
}

export function normalizeMonthlyBundleConfig(raw) {
  let value = raw;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { value = null; }
  }
  const configured = new Map();
  for (const item of Array.isArray(value?.plans) ? value.plans : []) {
    const plan = normalizeMonthlyBundle(item);
    if (plan && !configured.has(plan.id)) configured.set(plan.id, plan);
  }
  return MONTHLY_SERVICES.flatMap(service => MONTHLY_DESIGN_LIMITS.map(designs => {
    const id = `${service}-${designs}`;
    return configured.get(id) || {
      id, service, designs, title: `${designs} Designs / Month`,
      description: '', price: null, active: false
    };
  }));
}

export function findPublishedMonthlyBundle(raw, service, designs) {
  return normalizeMonthlyBundleConfig(raw).find(plan =>
    plan.service === service && plan.designs === Number(designs) && plan.active && plan.price !== null
  ) || null;
}
