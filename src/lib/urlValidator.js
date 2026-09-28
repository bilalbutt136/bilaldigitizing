import dns from 'node:dns/promises';
import net from 'node:net';

/**
 * SSRF Protection & URL Sanitization Utility
 * Validates URLs before server-side fetching to protect against SSRF and private network probing.
 */

// Blocked private / link-local / loopback hostnames and IP patterns
const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/, // Link-local & cloud metadata (AWS/GCP/Azure)
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /metadata\.google\.internal/i,
  /instance-data/i,
];

// Whitelist of trusted file/storage hosts and CDNs
const TRUSTED_DOMAINS = [
  'bdigitizing.com',
  'www.bdigitizing.com',
  'supabase.co',
  'supabase.in',
  'supabase.net',
  'res.cloudinary.com',
  'cloudinary.com',
  'amazonaws.com',
  'r2.cloudflarestorage.com',
  'r2.dev',
  'storage.googleapis.com',
  'firebasestorage.googleapis.com',
  'images.unsplash.com',
  'api.cloudinary.com',
  'bdigitizing.vercel.app',
  'bilaldigitizing.vercel.app',
];

/**
 * Returns a guaranteed absolute origin with protocol (e.g. https://bdigitizing.com)
 */
function getBaseSiteOrigin() {
  let site = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://bdigitizing.com';
  site = String(site || 'https://bdigitizing.com').trim();
  if (!site.startsWith('http://') && !site.startsWith('https://')) {
    site = `https://${site}`;
  }
  return site.replace(/\/+$/, '');
}

/**
 * Validates if a URL is safe for server-side proxy fetching
 * @param {string} rawUrl - Input URL string
 * @returns {{ valid: boolean, error?: string, sanitizedUrl?: string }}
 */
export function validateSafeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'URL is required and must be a string.' };
  }

  let trimmed = rawUrl.trim();

  // Reject placeholder and invalid values
  const lower = trimmed.toLowerCase();
  if (['undefined', 'null', '[object object]', 'none', 'false', 'true', ''].includes(lower)) {
    return { valid: false, error: 'Invalid URL parameter provided.' };
  }

  // Handle URL-encoded strings
  if (trimmed.includes('%3A') || trimmed.includes('%2F')) {
    try {
      const decoded = decodeURIComponent(trimmed);
      if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
        trimmed = decoded;
      }
    } catch {}
  }

  const baseOrigin = getBaseSiteOrigin();

  // Allow same-origin relative URLs or local storage paths by resolving against default site origin
  // Only treat as relative if it doesn't already have an explicit URI scheme (e.g. ftp:, file:, javascript:)
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed);
  if (!hasScheme && !trimmed.startsWith('//')) {
    const cleanRelative = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    try {
      trimmed = new URL(cleanRelative, baseOrigin).toString();
    } catch {
      return { valid: false, error: 'Invalid URL format.' };
    }
  }

  if (trimmed.startsWith('//')) {
    trimmed = `https:${trimmed}`;
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Invalid URL format.' };
  }

  // Only allow HTTP/HTTPS
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { valid: false, error: `Protocol "${parsed.protocol}" is not permitted.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check blocked patterns (loopback, private, metadata)
  for (const pattern of BLOCKED_HOST_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: 'Target host is restricted.' };
    }
  }

  // Dynamic environment hosts
  const dynamicHosts = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try { dynamicHosts.push(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.toLowerCase()); } catch {}
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try { dynamicHosts.push(new URL(process.env.NEXT_PUBLIC_SITE_URL.startsWith('http') ? process.env.NEXT_PUBLIC_SITE_URL : `https://${process.env.NEXT_PUBLIC_SITE_URL}`).hostname.toLowerCase()); } catch {}
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try { dynamicHosts.push(new URL(process.env.NEXT_PUBLIC_APP_URL.startsWith('http') ? process.env.NEXT_PUBLIC_APP_URL : `https://${process.env.NEXT_PUBLIC_APP_URL}`).hostname.toLowerCase()); } catch {}
  }

  const isAllowedHost = TRUSTED_DOMAINS.some(domain =>
    hostname === domain || hostname.endsWith(`.${domain}`)
  ) || dynamicHosts.some(host =>
    hostname === host || hostname.endsWith(`.${host}`)
  );

  if (!isAllowedHost) {
    return { valid: false, error: `Domain "${hostname}" is not an authorized asset source.` };
  }

  return { valid: true, sanitizedUrl: parsed.toString() };
}


function isPrivateIpAddress(address) {
  if (!address || !net.isIP(address)) return false;

  if (net.isIPv4(address)) {
    const parts = address.split('.').map(Number);
    const [a, b] = parts;
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a >= 224)
    );
  }

  const normalized = address.toLowerCase();
  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  );
}

/**
 * Re-validates a remote URL against DNS resolution to prevent rebinding/private-network targets.
 */
export async function validateSafeRemoteUrl(rawUrl) {
  const basic = validateSafeUrl(rawUrl);
  if (!basic.valid) return basic;

  let parsed;
  try {
    parsed = new URL(basic.sanitizedUrl);
  } catch {
    return { valid: false, error: 'Invalid URL format.' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'Remote asset fetching requires HTTPS.' };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (net.isIP(hostname)) {
    if (isPrivateIpAddress(hostname)) {
      return { valid: false, error: 'Target host resolves to a restricted network address.' };
    }
    return basic;
  }

  try {
    const records = await dns.lookup(hostname, { all: true, verbatim: true });
    if (!records.length || records.some(record => isPrivateIpAddress(record.address))) {
      return { valid: false, error: 'Target host resolves to a restricted network address.' };
    }
  } catch {
    return { valid: false, error: 'Target host could not be safely resolved.' };
  }

  return basic;
}

/**
 * Fetches a trusted remote asset while validating every redirect target.
 */
export async function safeFetchRemote(rawUrl, options = {}, maxRedirects = 3) {
  let currentUrl = rawUrl;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const validation = await validateSafeRemoteUrl(currentUrl);
    if (!validation.valid) {
      const error = new Error(validation.error || 'Unsafe remote URL.');
      error.code = 'UNSAFE_REMOTE_URL';
      throw error;
    }

    const response = await fetch(validation.sanitizedUrl, {
      ...options,
      redirect: 'manual'
    });

    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return response;
    }

    const location = response.headers.get('location');
    if (!location) {
      throw new Error('Remote server returned an invalid redirect.');
    }

    if (redirectCount === maxRedirects) {
      throw new Error('Remote asset exceeded the redirect limit.');
    }

    currentUrl = new URL(location, validation.sanitizedUrl).toString();
  }

  throw new Error('Remote asset fetch failed.');
}
