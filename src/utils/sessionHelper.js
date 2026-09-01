/**
 * Session and Thread Identification Helpers
 * Ensures persistent identity for guest visitors and unified conversation thread IDs.
 */

export function getGuestSessionId() {
  if (typeof window === 'undefined') return 'guest_default';
  try {
    let id = localStorage.getItem('bdigi_guest_session_id');
    if (!id || id === 'guest' || id === 'undefined' || id === 'null' || id.length < 5) {
      id = 'guest_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('bdigi_guest_session_id', id);
    }
    return id;
  } catch {
    return 'guest_fallback';
  }
}

export function getCanonicalThreadId(channel = 'support', email = null, customGuestId = null) {
  const cleanEmail = email ? String(email).toLowerCase().trim() : '';
  const isGuest = !cleanEmail || cleanEmail === 'client@studio.com' || cleanEmail.includes('guest@bdigitizing.pro');

  if (isGuest) {
    const guestId = customGuestId || getGuestSessionId();
    return channel === 'inbox' ? `inbox-${guestId}` : `support-${guestId}`;
  }

  return channel === 'inbox' ? `inbox-${cleanEmail}` : `support-${cleanEmail}`;
}

export function isSupportConversationId(convId) {
  if (!convId) return false;
  const idStr = String(convId).toLowerCase().trim();
  return idStr === 'general-support' || idStr === 'support-guest' || idStr === 'help-support' || idStr.startsWith('support-');
}
