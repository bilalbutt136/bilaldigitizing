const fs = require('fs');
let code = fs.readFileSync('src/services/supabaseService.js', 'utf8');

// Replace saveCmsConfigToSupabase
code = code.replace(
  /export async function saveCmsConfigToSupabase[\s\S]*?return false;\n  \}\n\}/,
  `export async function saveCmsConfigToSupabase(key, value) {
  try {
    const res = await fetch('/api/admin/cms/globals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ key, value }])
    });
    return res.ok;
  } catch (err) {
    console.warn('API error in saveCmsConfigToSupabase:', err);
    return false;
  }
}`
);

// Replace upsertHeroContent
code = code.replace(
  /export const upsertHeroContent = \([\s\S]*?\};/,
  `export const upsertHeroContent = async (data) => {
  try {
    const dbPayload = data.map(h => ({
      id: h.id,
      title: h.title || 'Default Title',
      subtitle: h.subtitle || h.description || h.highlight || 'Default Subtitle',
      badge: h.badge,
      rating: h.rating || h.rate_label || '5.0',
      reviews: h.reviews || '0',
      primary_btn_text: h.primary_btn_text || h.primary_cta || 'Order Now',
      primary_btn_action: h.primary_btn_action || '/order',
      secondary_btn_text: h.secondary_btn_text || h.secondary_cta || 'Learn More',
      secondary_btn_action: h.secondary_btn_action || '/services',
      image: h.image || h.bannerImage || h.banner_image || '',
      sort_order: h.sort_order || 0,
      is_active: h.is_active !== undefined ? h.is_active : true
    }));
    const res = await fetch('/api/admin/cms/hero', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbPayload)
    });
    return res.ok;
  } catch { return false; }
};`
);

// Replace upsertPortfolioItems
code = code.replace(
  /export const upsertPortfolioItems = \([\s\S]*?\};/,
  `export const upsertPortfolioItems = async (data) => {
  try {
    const dbPayload = data.map(item => ({
      id: item.id,
      title: item.title || 'Untitled',
      category: item.category || 'general',
      image: item.image || item.digitizedImage || item.digitized_image || item.afterImg || item.after_img || '',
      stitch_count: item.stitchCount !== undefined ? item.stitchCount : item.stitch_count,
      dimensions: item.dimensions || '',
      colors: item.colors || '',
      turnaround: item.turnaround || '',
      tags: item.tags || [],
      featured: item.featured || false,
      sort_order: item.sort_order || 0,
      is_active: item.is_active !== undefined ? item.is_active : true
    }));
    const res = await fetch('/api/admin/cms/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbPayload)
    });
    return res.ok;
  } catch { return false; }
};`
);

// Replace upsertSewOuts
code = code.replace(
  /export const upsertSewOuts = \([\s\S]*?\};/,
  `export const upsertSewOuts = async (data) => {
  try {
    const dbPayload = data.map(item => ({
      id: item.id,
      title: item.title,
      category: item.category,
      before_img: item.beforeImg || item.before_img,
      after_img: item.afterImg || item.after_img,
      stitch_count: item.stitchCount !== undefined ? item.stitchCount : item.stitch_count,
      formats: item.formats,
      features: item.features
    }));
    const res = await fetch('/api/admin/cms/sewouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbPayload)
    });
    return res.ok;
  } catch { return false; }
};`
);

// Replace upsertDigitizers
code = code.replace(
  /export const upsertDigitizers = \([\s\S]*?\};/,
  `export const upsertDigitizers = async (data) => {
  try {
    const res = await fetch('/api/admin/cms/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch { return false; }
};`
);

// Replace upsertFaqs
code = code.replace(
  /export const upsertFaqs = \([\s\S]*?\};/,
  `export const upsertFaqs = async (data) => {
  try {
    const res = await fetch('/api/admin/cms/faqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch { return false; }
};`
);

// Replace upsertTestimonials
code = code.replace(
  /export const upsertTestimonials = \([\s\S]*?\};/,
  `export const upsertTestimonials = async (data) => {
  try {
    const res = await fetch('/api/admin/cms/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch { return false; }
};`
);

fs.writeFileSync('src/services/supabaseService.js', code);
console.log('Refactored CMS routes successfully');
