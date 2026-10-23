const cleanString = (value) => String(value || '').trim();

export const normalizeGoogleAdsTagId = (value) => {
  const match = cleanString(value).toUpperCase().match(/\bAW-\d+\b/);
  return match?.[0] || '';
};

export const normalizeGoogleAdsConversionLabel = (value) => {
  const text = cleanString(value);
  if (!text) return '';
  const slashIndex = text.lastIndexOf('/');
  const label = slashIndex >= 0 ? text.slice(slashIndex + 1) : text;
  return /^[A-Za-z0-9_-]{6,100}$/.test(label) ? label : '';
};

export const buildGoogleAdsSendTo = (tagId, conversionLabel) => {
  const cleanTagId = normalizeGoogleAdsTagId(tagId);
  const cleanLabel = normalizeGoogleAdsConversionLabel(conversionLabel);
  return cleanTagId && cleanLabel ? `${cleanTagId}/${cleanLabel}` : '';
};

export const trackGoogleAdsPurchase = ({
  tagId,
  conversionLabel,
  value,
  currency = 'USD',
  transactionId
} = {}) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return false;

  const sendTo = buildGoogleAdsSendTo(tagId, conversionLabel);
  const cleanTransactionId = cleanString(transactionId);
  const numericValue = Number(value);

  if (!sendTo || !cleanTransactionId || !Number.isFinite(numericValue) || numericValue < 0) {
    return false;
  }

  const dedupeKey = `bdigi_google_ads_purchase:${cleanTransactionId}`;
  try {
    if (window.sessionStorage?.getItem(dedupeKey) === '1') return false;
  } catch {}

  window.gtag('event', 'conversion', {
    send_to: sendTo,
    value: numericValue,
    currency: cleanString(currency).toUpperCase() || 'USD',
    transaction_id: cleanTransactionId
  });

  try {
    window.sessionStorage?.setItem(dedupeKey, '1');
  } catch {}

  return true;
};
