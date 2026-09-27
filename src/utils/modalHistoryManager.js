/**
 * Universal Mobile & Desktop Modal History Manager
 * Intercepts browser & Android hardware / gesture back navigation,
 * ensuring modals, drawers, and lightbox viewers close hierarchically 
 * without exiting the mobile application.
 */

// Stack of active modals: Array<{ id: string, onClose: () => void }>
const modalStack = [];
let isProgrammaticBack = false;
let lastBackConsumedTimestamp = 0;
let isListenerAttached = false;

function ensurePopStateListener() {
  if (isListenerAttached || typeof window === 'undefined') return;

  window.addEventListener('popstate', (e) => {
    // If popstate was triggered by programmatic dismissModal() calling history.back(),
    // swallow it so we don't double-close or inadvertently navigate tabs.
    if (isProgrammaticBack) {
      isProgrammaticBack = false;
      lastBackConsumedTimestamp = Date.now();
      return;
    }

    // If any modal is active in the stack, the hardware back button popped its history entry.
    // Close ONLY the top-most modal, preserving lower modals and keeping the app open.
    if (modalStack.length > 0) {
      const topModal = modalStack.pop();
      lastBackConsumedTimestamp = Date.now();
      if (topModal && typeof topModal.onClose === 'function') {
        try {
          topModal.onClose();
        } catch (err) {
          console.error('[modalHistoryManager] Error closing modal:', err);
        }
      }
    }
  });

  isListenerAttached = true;
}

/**
 * Registers an open modal into history and the active stack.
 * @param {string} id - Unique identifier for the modal
 * @param {() => void} onClose - Function to call when back navigation pops this modal
 */
export function pushModal(id, onClose) {
  if (typeof window === 'undefined') return;
  ensurePopStateListener();

  // If already in the stack, update callback and move to top if needed
  const existingIdx = modalStack.findIndex(m => m.id === id);
  if (existingIdx !== -1) {
    modalStack[existingIdx].onClose = onClose;
    return;
  }

  modalStack.push({ id, onClose });

  try {
    window.history.pushState({ bdigi_modal: id, depth: modalStack.length }, '');
  } catch (err) {
    console.warn('[modalHistoryManager] pushState failed:', err);
  }
}

/**
 * Programmatically dismisses an open modal (e.g. user clicked on-screen "X", Back button, or backdrop).
 * Removes it from the stack and calls history.back() if it was at the top.
 * @param {string} id - Identifier of the modal to dismiss
 */
export function dismissModal(id) {
  if (typeof window === 'undefined') return;

  const idx = modalStack.findIndex(m => m.id === id);
  if (idx === -1) return;

  const isTop = idx === modalStack.length - 1;
  modalStack.splice(idx, 1);

  if (isTop && window.history && typeof window.history.back === 'function') {
    isProgrammaticBack = true;
    lastBackConsumedTimestamp = Date.now();
    try {
      window.history.back();
    } catch {}
  }
}

/**
 * Checks if a popstate event was consumed by a modal within the last 150ms.
 */
export function isModalBackConsumed() {
  return (Date.now() - lastBackConsumedTimestamp) < 150;
}

/**
 * Returns whether any modal is currently active in the modal stack.
 */
export function hasActiveModals() {
  return modalStack.length > 0;
}

/**
 * Returns current depth of the modal stack.
 */
export function getModalStackDepth() {
  return modalStack.length;
}

/**
 * Resets the modal stack (useful for test suites or hard navigation resets).
 */
export function resetModalStack() {
  modalStack.length = 0;
  isProgrammaticBack = false;
  lastBackConsumedTimestamp = 0;
  isListenerAttached = false;
}
