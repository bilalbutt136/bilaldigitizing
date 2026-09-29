export function normalizeOrderImageUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (url.startsWith('data:image/')) return url;
  if (url.startsWith('blob:')) return url;
  if (url.startsWith('/')) return url;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return '';
  }

  return '';
}

export function resolveOrderPreviewImage(order) {
  const candidates = [
    order?.artworkUrl,
    order?.artwork_url,
    order?.image_url,
    order?.imageUrl,
    order?.logo,
    order?.uploadedFiles?.[0]?.url,
    order?.uploadedFiles?.[0]?.public_url,
    order?.placementItems?.[0]?.files?.[0]?.url,
    order?.patchItems?.[0]?.files?.[0]?.url,
    order?.order_files?.[0]?.public_url,
    order?.file_url,
    order?.file_path
  ];

  for (const candidate of candidates) {
    const normalized = normalizeOrderImageUrl(candidate);
    if (normalized) return normalized;
  }

  return '';
}

export function getStableOrderKey(order, index = 0, prefix = 'order') {
  const identity =
    order?.id ||
    order?.orderId ||
    order?.order_id ||
    order?.created_at ||
    order?.createdAt ||
    order?.title ||
    `row-${index}`;

  return `${prefix}-${String(identity)}`;
}
