import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  pushModal,
  dismissModal,
  isModalBackConsumed,
  hasActiveModals,
  getModalStackDepth,
  popTopModal,
  resetModalStack
} from '../utils/modalHistoryManager.js';

describe('Universal Mobile & Desktop Modal History Manager', () => {
  let popstateListeners = [];
  let historyStack = [];

  beforeEach(() => {
    resetModalStack();
    popstateListeners = [];
    historyStack = [{ app: true, tab: 'home' }];

    // Mock global window and window.history for Node test environment
    global.window = {
      history: {
        state: historyStack[historyStack.length - 1],
        pushState: (state, _title, _url) => {
          historyStack.push(state);
          global.window.history.state = state;
        },
        replaceState: (state, _title, _url) => {
          if (historyStack.length > 0) {
            historyStack[historyStack.length - 1] = state;
          } else {
            historyStack.push(state);
          }
          global.window.history.state = state;
        },
        back: () => {
          if (historyStack.length > 1) {
            historyStack.pop();
            global.window.history.state = historyStack[historyStack.length - 1];
            // Simulate browser firing popstate on back navigation
            const event = { state: global.window.history.state };
            popstateListeners.forEach(fn => fn(event));
          }
        }
      },
      addEventListener: (type, fn) => {
        if (type === 'popstate') popstateListeners.push(fn);
      },
      removeEventListener: (type, fn) => {
        if (type === 'popstate') {
          popstateListeners = popstateListeners.filter(l => l !== fn);
        }
      }
    };
  });

  test('1. pushModal registers modal, increases stack depth and calls window.history.pushState', () => {
    let closed = false;
    pushModal('pdf_preview_modal', () => { closed = true; });

    assert.equal(hasActiveModals(), true);
    assert.equal(getModalStackDepth(), 1);
    assert.equal(global.window.history.state?.bdigi_modal, 'pdf_preview_modal');
    assert.equal(closed, false);
  });

  test('2. Android hardware / gesture back navigation pops top modal without closing underlying page', () => {
    let pdfClosed = false;
    pushModal('pdf_preview_modal', () => { pdfClosed = true; });

    // Simulate user pressing Android hardware back key
    global.window.history.back();

    assert.equal(pdfClosed, true, 'PDF onClose callback must be invoked on hardware back');
    assert.equal(hasActiveModals(), false, 'Modal stack must be empty after popping');
    assert.equal(isModalBackConsumed(), true, 'isModalBackConsumed must be true immediately following back pop');
  });

  test('3. Hierarchical nested modals: back closes top modal first, preserving underlying drawer', () => {
    let drawerClosed = false;
    let pdfClosed = false;

    // Step A: User opens Order Details Drawer
    pushModal('order_tracker_drawer', () => { drawerClosed = true; });
    assert.equal(getModalStackDepth(), 1);

    // Step B: Inside drawer, user clicks on PDF preview
    pushModal('pdf_preview_modal', () => { pdfClosed = true; });
    assert.equal(getModalStackDepth(), 2);
    assert.equal(global.window.history.state?.bdigi_modal, 'pdf_preview_modal');

    // Step C: User presses mobile hardware back button (Back Press 1)
    global.window.history.back();

    assert.equal(pdfClosed, true, 'Top-most modal (PDF) must close on first back press');
    assert.equal(drawerClosed, false, 'Underlying Order Drawer must REMAIN open');
    assert.equal(getModalStackDepth(), 1, 'Modal stack depth must reduce to 1');
    assert.equal(hasActiveModals(), true);

    // Step D: User presses mobile hardware back button again (Back Press 2)
    global.window.history.back();

    assert.equal(drawerClosed, true, 'Order Drawer must close on second back press');
    assert.equal(getModalStackDepth(), 0, 'Modal stack must now be completely clear');
    assert.equal(hasActiveModals(), false);
  });

  test('4. On-screen Close ("X") button dismisses modal and keeps browser history in sync', () => {
    let pdfClosed = false;
    pushModal('pdf_preview_modal', () => { pdfClosed = true; });

    assert.equal(getModalStackDepth(), 1);
    assert.equal(historyStack.length, 2);

    // User clicks on-screen "X" button -> calls dismissModal
    dismissModal('pdf_preview_modal');

    assert.equal(getModalStackDepth(), 0, 'Modal must be removed from stack');
    assert.equal(historyStack.length, 1, 'History stack entry must be popped by dismissModal');
    // Ensure the resulting popstate did NOT double-call onClose
    assert.equal(pdfClosed, false, 'onClose should not be called again when dismissed via UI button');
  });

  test('5. Duplicate push of the same modal id does not create duplicate history entries', () => {
    let callCount = 0;
    pushModal('pdf_preview_modal', () => { callCount++; });
    pushModal('pdf_preview_modal', () => { callCount++; });

    assert.equal(getModalStackDepth(), 1, 'Duplicate modal ID must not be pushed twice');
  });

  test('6. popTopModal programmatically pops top modal and invokes onClose', () => {
    let closed = false;
    assert.equal(popTopModal(), false, 'Returns false when modal stack is empty');

    pushModal('test_overlay', () => { closed = true; });
    assert.equal(hasActiveModals(), true);

    const result = popTopModal();
    assert.equal(result, true, 'Returns true when modal was successfully popped');
    assert.equal(closed, true, 'onClose callback was executed');
    assert.equal(hasActiveModals(), false, 'Modal stack is empty');
  });
});
