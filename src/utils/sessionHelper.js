/**
 * Session and Thread Identification Helpers
 * Ensures persistent identity for guest visitors and unified conversation thread IDs.
 */

export function getOrCreateGuestSession() {
  if (typeof window === 'undefined') return 'guest_default';
  try {
    let sessionId = localStorage.getItem('guest_chat_session_id') || localStorage.getItem('bdigi_guest_session_id');
    if (!sessionId || sessionId === 'guest' || sessionId === 'undefined' || sessionId === 'null' || sessionId.length < 5) {
      const uniquePart = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
      sessionId = `guest_${uniquePart}`;
      localStorage.setItem('guest_chat_session_id', sessionId);
      localStorage.setItem('bdigi_guest_session_id', sessionId);
    }
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
