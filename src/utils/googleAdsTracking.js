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

  const cleanCurrency = cleanString(currency).toUpperCase() || 'USD';

  window.gtag('event', 'conversion', {
    send_to: sendTo,
    value: numericValue,
    currency: cleanCurrency,
    transaction_id: cleanTransactionId
  });

  // Mirror successful Google Ads conversions into the internal tracking stream
  // so admins can audit visitor journeys without needing the Google Ads API.
  if (window.location) {
    Promise.all([
      import('./visitorTracker.js'),
      import('../services/supabaseService.js')
    ]).then(([visitorTracker, trackingService]) => {
      const telemetry = visitorTracker.getVisitorTelemetry?.() || {};
      trackingService.logTrackingEventToSupabase?.({
        eventName: 'GoogleAdsPurchase',
        userRole: telemetry.userRole || 'Guest Visitor',
        source: 'Google Ads conversion (gtag)',
        trafficSource: telemetry.trafficSource || 'Google Ads',
        value: `$${numericValue.toFixed(2)}`,
        pagePath: window.location.pathname || '/',
        eventId: `google_ads_purchase_${cleanTransactionId}`,
        details: {
          ...telemetry,
          trackingPlatform: 'google_ads',
          googleAdsSent: true,
          googleAdsTagId: normalizeGoogleAdsTagId(tagId),
          googleAdsConversionLabel: normalizeGoogleAdsConversionLabel(conversionLabel),
          googleAdsSendTo: sendTo,
          transactionId: cleanTransactionId,
          eventData: {
            value: numericValue,
            currency: cleanCurrency,
            transaction_id: cleanTransactionId
          }
        }
      });
    }).catch(() => {});
  }

  try {
    window.sessionStorage?.setItem(dedupeKey, '1');
  } catch {}

  return true;
};
