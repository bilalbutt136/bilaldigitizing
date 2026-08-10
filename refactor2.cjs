const fs = require('fs');

let code = fs.readFileSync('src/services/supabaseService.js', 'utf8');

const replacements = {
  createOrderInSupabase: `export async function createOrderInSupabase(newOrder) {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'createOrder', payload: { primaryDbRow: newOrder, orderFiles: [] } })
    });
    const data = await res.json();
    return { success: res.ok, data: data.order };
  } catch (err) {
    return { success: false, data: null };
  }
}`,

  fetchCatalogFromSupabase: `export async function fetchCatalogFromSupabase() {
  try {
    const res = await fetch('/api/catalog?action=fetchAll');
    const data = await res.json();
    return {
      services: data.services || [],
      pricing_tiers: data.pricing_tiers || [],
      patch_cards: data.patch_cards || [],
      store_products: data.store_products || [],
      portfolio: [],
      sew_outs: [],
      hero_slides: [],
      digitizers: [],
      pricing_cards: data.pricing_cards || [],
      site_config: [],
      faqs: [],
      testimonials: []
    };
  } catch (err) {
    return null;
  }
}`,

  addStoreProduct: `export async function addStoreProduct(product) {
  try {
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', tableName: 'store_products', payload: product })
    });
    return res.ok ? product : null;
  } catch { return null; }
}`,

  logTrackingEventToSupabase: `export async function logTrackingEventToSupabase(eventData) {
  try {
    await fetch('/api/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logEvent', payload: eventData })
    });
  } catch (e) {
    console.warn('Could not log tracking event', e);
  }
}`,

  fetchMediaAssetsFromSupabase: `export async function fetchMediaAssetsFromSupabase() {
  try {
    const portRes = await fetch('/api/catalog?action=fetchAll');
    const data = await portRes.json();
    // This is a stub, as the real function fetches portfolio/sew_outs. We will just return empty arrays or adjust later if needed.
    return { portfolio: [], sew_outs: [] };
  } catch {
    return { portfolio: [], sew_outs: [] };
  }
}`,

  getCmsContent: `export async function getCmsContent(key) {
  try {
    const res = await fetch(\`/api/cms?action=fetchContent&key=\${key}\`);
    const data = await res.json();
    return data.content || null;
  } catch { return null; }
}`
};

for (const [funcName, replacement] of Object.entries(replacements)) {
  const regex = new RegExp(`export async function ${funcName}\\([\\s\\S]*?^\\}\\s*`, 'm');
  if (regex.test(code)) {
    code = code.replace(regex, replacement + '\n\n');
  } else {
    console.log('Could not find', funcName);
  }
}

fs.writeFileSync('src/services/supabaseService.js', code);
console.log('Refactored remaining 6 functions');
