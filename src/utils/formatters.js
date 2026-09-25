/**
 * Production UI and Data Formatting Utilities
 */

export const formatOrderId = (rawId) => {
  if (!rawId) return '#0000';
  const cleanId = String(rawId).replace(/^(EMB-|VEC-)/i, '').replace(/^#/, '');
  return `#${cleanId}`;
};

export const formatDimensions = (dim) => {
  if (!dim) return '3.5" (Standard Width)';
  if (typeof dim === 'string') return dim;
  if (typeof dim === 'number') return `${dim}"`;
  if (typeof dim === 'object') {
    const w = dim.width || dim.w || '';
    const h = dim.height || dim.h || '';
    const u = dim.unit || 'in';
    if (w && h) return `${w}" x ${h}" ${u}`;
    if (w) return `${w}" ${u}`;
    if (h) return `${h}" ${u}`;
    return '3.5" (Standard Width)';
  }
  return String(dim);
};

export const formatFabric = (fab) => {
  if (!fab) return 'Cotton / Poly Twill';
  if (typeof fab === 'string') return fab;
  if (typeof fab === 'object') {
    return fab.name || fab.type || fab.label || 'Cotton / Poly Twill';
  }
  return String(fab);
};

export const formatDesignTitle = (rawTitle) => {
  if (!rawTitle || typeof rawTitle !== 'string') return 'Artwork Design';
  let clean = rawTitle.trim();

  // Strip redundant trailing " - Service Name (Qty: X)" or " - Service Name"
  clean = clean
    .replace(/\s*[-–—]\s*(Embroidery Digitizing|Vector Tracing|Vector Art|Custom Patches|Digitizing|Vector|Patch)(\s*\(Qty:\s*\d+\))?/i, '')
    .replace(/\s*\(Qty:\s*\d+\)/i, '')
    .trim();

  // If the result became empty, fall back safely
  if (!clean) {
    clean = rawTitle.replace(/\s*\(Qty:\s*\d+\)/i, '').trim() || 'Artwork Design';
  }

  // Remove common file extension if present at the end
  clean = clean.replace(/\.(png|jpg|jpeg|webp|svg|pdf|ai|eps|dst|pes|emb)$/i, '');

  return clean;
};

