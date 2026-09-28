function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

/**
 * Converts CMS-authored HTML into safe display text.
 * React renders this value as text (never with dangerouslySetInnerHTML),
 * so any remaining angle brackets are escaped by React.
 */
export function sanitizeCmsHtml(value) {
  if (typeof value !== 'string' || !value.trim()) return '';

  const withoutActiveContent = value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '');

  const withBreaks = withoutActiveContent
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '• ');

  return decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, ''))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
