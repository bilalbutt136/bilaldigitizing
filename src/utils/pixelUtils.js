/**
 * Utilities for Meta (Facebook) Pixel, Google Analytics, and tracking snippet parsing.
 * Allows users to either enter raw numeric IDs OR paste full base code snippets.
 */

/**
 * Extracts a numeric Meta Pixel / Dataset ID from raw text, whether it is:
 * - A pure numeric ID (e.g. "986664733689901")
 * - The full Meta base code script (!function... fbq('init', '...'))
 * - A noscript tracking pixel tag (<img src="...tr?id=..."/>)
 * - An Events Manager copy-paste text (e.g. "Dataset ID: 986664733689901")
 *
 * @param {string|number} rawInput
 * @returns {string} Clean numeric Pixel ID, or empty string if not found
 */
export function extractMetaPixelId(rawInput) {
  if (rawInput === null || rawInput === undefined) return '';
  const text = String(rawInput).trim();
  if (!text) return '';

  // 1. Direct clean numeric string (9 to 20 digits)
  if (/^\d{9,20}$/.test(text)) {
    return text;
  }

  // 2. Official fbq('init', '...') pattern
  const fbqInitMatch = text.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d{9,20})['"]/i);
  if (fbqInitMatch && fbqInitMatch[1]) {
    return fbqInitMatch[1];
  }

  // 3. Image tracking URL pattern (tr?id=...)
  const trUrlMatch = text.match(/[?&]id=(\d{9,20})/i);
  if (trUrlMatch && trUrlMatch[1]) {
    return trUrlMatch[1];
  }

  // 4. Labeled ID pattern (Dataset ID: 1234... or Pixel ID: 1234...)
  const labeledMatch = text.match(/(?:dataset|pixel)[\s_-]*id[\s:=]+['"]?(\d{9,20})/i);
  if (labeledMatch && labeledMatch[1]) {
    return labeledMatch[1];
  }

  // 5. Standard Meta Pixel length digit sequence (12 to 18 digits)
  const metaLengthMatch = text.match(/\b\d{12,18}\b/);
  if (metaLengthMatch && metaLengthMatch[0]) {
    return metaLengthMatch[0];
  }

  // 6. Broad digit sequence (9 to 20 digits)
  const broadMatch = text.match(/\b\d{9,20}\b/);
  if (broadMatch && broadMatch[0]) {
    return broadMatch[0];
  }

  return '';
}

/**
 * Validates whether a given string is a valid numeric Meta Pixel ID
 * @param {string|number} id
 * @returns {boolean}
 */
export function isValidMetaPixelId(id) {
  if (!id) return false;
  return /^\d{9,20}$/.test(String(id).trim());
}

/**
 * Detects the format of user input for smart UI feedback
 * @param {string} rawInput
 * @returns {'empty'|'pixel_id'|'full_meta_code'|'custom_script'|'invalid'}
 */
export function detectSnippetType(rawInput) {
  if (!rawInput || !String(rawInput).trim()) return 'empty';
  const text = String(rawInput).trim();

  if (/^\d{9,20}$/.test(text)) {
    return 'pixel_id';
  }

  if (
    text.includes('connect.facebook.net') ||
    text.includes('fbevents.js') ||
    text.includes('fbq(') ||
    text.includes('<!-- Meta Pixel Code -->') ||
    text.includes('facebook.com/tr?id=')
  ) {
    return 'full_meta_code';
  }

  if (/<script[\s>]/i.test(text) || /<noscript[\s>]/i.test(text)) {
    return 'custom_script';
  }

  const extracted = extractMetaPixelId(text);
  if (extracted) {
    return 'pixel_id';
  }

  return 'invalid';
}

/**
 * Extracts a Google Analytics (GA4) or Google Tag Manager (GTM) measurement ID
 * @param {string} rawInput
 * @returns {string}
 */
export function extractGoogleAnalyticsId(rawInput) {
  if (!rawInput) return '';
  const text = String(rawInput).trim();

  // Pure ID: G-XXXXXXX or GTM-XXXXXXX or UA-XXXXX-X
  const directMatch = text.match(/\b(G-[A-Z0-9]{4,15}|GTM-[A-Z0-9]{4,15}|UA-\d+-\d+)\b/i);
  if (directMatch && directMatch[1]) {
    return directMatch[1].toUpperCase();
  }

  return text;
}

/**
 * Extracts a TikTok Pixel ID
 * @param {string} rawInput
 * @returns {string}
 */
export function extractTikTokPixelId(rawInput) {
  if (!rawInput) return '';
  const text = String(rawInput).trim();

  // ttq.load('CXXXXXXXXX')
  const ttqMatch = text.match(/ttq\.load\s*\(\s*['"]([A-Z0-9]{10,25})['"]/i);
  if (ttqMatch && ttqMatch[1]) {
    return ttqMatch[1];
  }

  const directMatch = text.match(/\b(C[A-Z0-9]{12,24})\b/i);
  if (directMatch && directMatch[1]) {
    return directMatch[1];
  }

  return text;
}
