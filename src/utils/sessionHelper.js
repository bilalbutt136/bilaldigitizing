/**
 * Session and Thread Identification Helpers
 * Ensures persistent identity for guest visitors and unified conversation thread IDs.
 */

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name, value, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getOrCreateGuestSession() {
  if (typeof window === 'undefined') return 'guest_default';
  try {
    // 1. Try localStorage
    let sessionId = localStorage.getItem('guest_chat_session_id') || 
      localStorage.getItem('bdigi_guest_session_id');

    // 2. Try Cookie if localStorage is empty
    if (!sessionId || sessionId === 'guest' || sessionId === 'undefined' || sessionId === 'null' || sessionId.length < 5) {
      sessionId = getCookie('bdigi_guest_session_id');
    }

    // 3. Generate fresh persistent UUID if not found
    if (!sessionId || sessionId === 'guest' || sessionId === 'undefined' || sessionId === 'null' || sessionId.length < 5) {
      const uniquePart = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
      sessionId = `guest_${uniquePart}`;
    }

    // Always persist to both storage layers
    localStorage.setItem('guest_chat_session_id', sessionId);
    localStorage.setItem('bdigi_guest_session_id', sessionId);
    setCookie('bdigi_guest_session_id', sessionId);

    return sessionId;
  } catch {
    return 'guest_fallback';
  }
}

export function getGuestSessionId() {
  return getOrCreateGuestSession();
}

export function getCanonicalThreadId(channel = 'support', email = null, customGuestId = null) {
  const cleanEmail = email ? String(email).toLowerCase().trim() : '';
  const isGuest = !cleanEmail || cleanEmail === 'client@studio.com' || cleanEmail.includes('guest@bdigitizing.pro');

  if (isGuest) {
    const guestId = customGuestId || getOrCreateGuestSession();
    return channel === 'inbox' ? `inbox-${guestId}` : `support-${guestId}`;
  }

  return channel === 'inbox' ? `inbox-${cleanEmail}` : `support-${cleanEmail}`;
}

export function isSupportConversationId(convId) {
  if (!convId) return false;
  const idStr = String(convId).toLowerCase().trim();
  return idStr === 'general-support' || idStr === 'support-guest' || idStr === 'help-support' || idStr.startsWith('support-');
}

export function extractGuestId(str) {
  if (!str) return null;
  const clean = String(str).trim();
  if (clean.startsWith('support-guest_') || clean.startsWith('inbox-guest_')) {
    return clean.replace(/^support-/, '').replace(/^inbox-/, '');
  }
  if (clean.startsWith('guest_')) {
    return clean;
  }
  return null;
}
