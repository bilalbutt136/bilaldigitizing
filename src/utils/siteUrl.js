/**
 * Helper to dynamically resolve the active site domain URL for Auth redirects, API calls, and Webhooks.
 */
export const getSiteUrl = () => {
  let url = 
    (typeof process !== 'undefined' && process.env && (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL)) ||
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SITE_URL || import.meta.env.NEXT_PUBLIC_SITE_URL)) ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return url || (typeof window !== 'undefined' ? window.location.origin : 'https://bilaldigitizing.vercel.app');
};
