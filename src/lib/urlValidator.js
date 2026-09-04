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

// Whitelist of trusted file/storage hosts
const TRUSTED_DOMAINS = [
  'supabase.co',
  'res.cloudinary.com',
  'images.unsplash.com',
  'bilaldigitizing.vercel.app',
];

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

  // Ensure target host matches allowed trusted domains or ends with trusted domain
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const siteHost = siteUrl ? new URL(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`).hostname.toLowerCase() : null;

  const isAllowedHost = TRUSTED_DOMAINS.some(domain =>
    hostname === domain || hostname.endsWith(`.${domain}`)
  ) || (siteHost && (hostname === siteHost || hostname.endsWith(`.${siteHost}`)));

  if (!isAllowedHost) {
    return { valid: false, error: `Domain "${hostname}" is not an authorized asset source.` };
  }

  return { valid: true, sanitizedUrl: parsed.toString() };
}
