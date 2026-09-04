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
