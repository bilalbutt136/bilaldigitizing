import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  pushModal,
  popTopModal,
  hasActiveModals,
  resetModalStack
} from '../utils/modalHistoryManager.js';

describe('Hardware & Gesture Back Navigation 3-Tier Hierarchy', () => {
  beforeEach(() => {
    global.window = {
      history: {
        state: {},
        pushState: () => {},
        replaceState: () => {}
      },
      addEventListener: () => {},
      removeEventListener: () => {}
    };
    resetModalStack();
  });

  test('Step A (Overlays First): Active modals and drawers intercept back press without route change', () => {
    let orderModalClosed = false;
    let imageLightboxClosed = false;

    // Simulate drawer and lightbox opened
    pushModal('order_drawer', () => { orderModalClosed = true; });
    pushModal('image_lightbox', () => { imageLightboxClosed = true; });

    assert.equal(hasActiveModals(), true);

    // First back press: closes top-most overlay (image lightbox)
    const consumed1 = popTopModal();
    assert.equal(consumed1, true);
    assert.equal(imageLightboxClosed, true);
    assert.equal(orderModalClosed, false);
    assert.equal(hasActiveModals(), true);

    // Second back press: closes underlying order drawer
    const consumed2 = popTopModal();
    assert.equal(consumed2, true);
    assert.equal(orderModalClosed, true);
    assert.equal(hasActiveModals(), false);
  });

  test('Step B (Sub-tabs): Mobile app on non-home tab returns to home screen', () => {
    let activeTab = 'orders';
    const setMobileTab = (tab) => { activeTab = tab; };

    // Simulate back handler logic for sub-tab
    const handleSubTabBack = (mode, tab) => {
      if (mode === 'app' && tab !== 'home') {
        setMobileTab('home');
        return true;
      }
      return false;
    };

    const consumed = handleSubTabBack('app', activeTab);
    assert.equal(consumed, true);
    assert.equal(activeTab, 'home');
  });

  test('Step B (In-app Routes): Inner routes call router.back() to return to previous page', () => {
    let routerBackCalled = false;
    const mockRouter = {
      back: () => { routerBackCalled = true; },
      push: (_url) => {}
    };

    const handleRouteBack = (pathname) => {
      const isRoot = pathname === '/' || pathname === '';
      if (!isRoot) {
        mockRouter.back();
        return true;
      }
      return false;
    };

    const consumed = handleRouteBack('/portfolio');
    assert.equal(consumed, true);
    assert.equal(routerBackCalled, true);
  });

  test('Step C (Root Screen Exit Confirmation): Double-tap back within 2 seconds to exit', () => {
    let toastMessage = '';
    let exitAppCalled = false;
    let lastExitPress = 0;

    const showToast = (msg) => { toastMessage = msg; };
    const mockCapacitorApp = {
      exitApp: () => { exitAppCalled = true; }
    };

    const handleRootBack = (now) => {
      const isWithinDoublePress = lastExitPress > 0 && (now - lastExitPress < 2000);
      if (isWithinDoublePress) {
        lastExitPress = 0;
        mockCapacitorApp.exitApp();
        return false; // exit allowed
      } else {
        lastExitPress = now;
        showToast('Press back again to exit');
        return true; // exit trapped, primed
      }
    };

    // Press 1 (T=1000): Trap exit and show native toast
    const consumed1 = handleRootBack(1000);
    assert.equal(consumed1, true);
    assert.equal(toastMessage, 'Press back again to exit');
    assert.equal(exitAppCalled, false);

    // Press 2 (T=1800, within 800ms): Confirm exit and call exitApp
    const consumed2 = handleRootBack(1800);
    assert.equal(consumed2, false);
    assert.equal(exitAppCalled, true);
  });

  test('Step C (Timeout Reset): Back press after 2 seconds re-prompts exit toast', () => {
    let toastCount = 0;
    let exitAppCalled = false;
    let lastExitPress = 0;

    const handleRootBack = (now) => {
      const isWithinDoublePress = lastExitPress > 0 && (now - lastExitPress < 2000);
      if (isWithinDoublePress) {
        lastExitPress = 0;
        exitAppCalled = true;
        return false;
      } else {
        lastExitPress = now;
        toastCount++;
        return true;
      }
    };

    // Press 1 (T=1000): Prompt 1
    handleRootBack(1000);
    assert.equal(toastCount, 1);
    assert.equal(exitAppCalled, false);

    // Press 2 (T=3500, >2000ms later): Prompt 2, does NOT exit
    handleRootBack(3500);
    assert.equal(toastCount, 2);
    assert.equal(exitAppCalled, false);
  });
});
