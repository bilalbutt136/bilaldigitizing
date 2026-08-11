// Category utility functions for dynamic service & package filtering

export const CATEGORY_KEYS = {
  ALL: 'all',
  EMBROIDERY: 'embroidery',
  VECTOR: 'vector-art',
  PATCHES: 'patches'
};

export function normalizeCategory(cat) {
  if (!cat) return 'embroidery';
  const lower = String(cat).toLowerCase().trim();
  if (lower === 'all' || lower === 'tab_all') return 'all';
  if (lower === 'embroidery' || lower === 'emb') return 'embroidery';
  if (lower === 'vector' || lower === 'vector-art' || lower === 'vector_art' || lower.includes('vector')) return 'vector-art';
  if (lower === 'patch' || lower === 'patches' || lower.includes('patch')) return 'patches';
  return lower;
}

export function matchCategory(itemCategory, selectedTab) {
  if (!selectedTab || selectedTab === 'all') return true;
  const normItem = normalizeCategory(itemCategory);
  const normTab = normalizeCategory(selectedTab);
  return normItem === normTab;
}
