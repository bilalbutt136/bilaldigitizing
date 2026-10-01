import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getMobileOrderTrackingState } from '../utils/orderTracking.js';

const read = relativePath => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('Login Stability & Mobile Order Tracking Regression', () => {
  test('standalone auth redirect waits for verified auth initialization and avoids hard reloads', () => {
    const source = read('src/components/auth/AuthModal.jsx');
    assert.match(source, /if \(!isAuthInitialized\) return;/);
    assert.match(source, /redirectStandaloneAfterAuth/);
    assert.match(source, /navigate\(targetRoute, \{ replace: true \}\)/);
    assert.equal(source.includes('window.location.replace('), false);
  });

  test('admin hard refresh restores INITIAL_SESSION before redirecting to login', () => {
    const state = read('src/context/StateContext.jsx');
    const portal = read('app/admin-portal/AdminPortalClient.jsx');
    const adminLogin = read('src/components/auth/SecureAdminLogin.jsx');
    const proxy = read('proxy.js');

    assert.match(state, /authInitialSessionSeenRef/);
    assert.match(state, /if \(event === 'INITIAL_SESSION'\)/);
    assert.match(state, /authInitialSessionSeenRef\.current = true/);
    assert.equal(
      state.includes("if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;"),
      false
    );
    assert.match(
      state,
      /Hard refresh can briefly report no session before Supabase emits its[\s\S]*authoritative INITIAL_SESSION event/
    );
    assert.equal(portal.includes("if (!isMounted || !isAuthInitialized || !viewportReady) return;"), true);

    assert.match(adminLogin, /isAuthInitialized/);
    assert.match(adminLogin, /isAuthenticated && authUser\?\.role === 'admin'/);
    assert.match(adminLogin, /navigate\('\/admin-portal', \{ replace: true \}\)/);

    assert.match(proxy, /loginUrl\.pathname = '\/secure-admin-login'/);
  });

  test('cached auth cannot suppress the standalone login form before session verification', () => {
    const source = read('src/components/auth/AuthModal.jsx');
    assert.match(source, /isStandalonePage && !isAuthInitialized && isUserLoggedIn/);
    assert.match(source, /isStandalonePage && isAuthInitialized && isUserLoggedIn/);
  });

  test('mobile tracking state clearly separates unpaid, production, QC, ready, revision and cancellation', () => {
    assert.deepEqual(
      getMobileOrderTrackingState({ status: 'submitted', payment_status: 'unpaid' }),
      {
        status: 'submitted',
        paid: false,
        unpaid: true,
        stage: 0,
        progress: 8,
        label: 'Awaiting payment',
        helper: 'Pay to release this order into production.',
        tone: 'payment',
        ready: false
      }
    );

    assert.equal(getMobileOrderTrackingState({ status: 'in_progress', payment_status: 'paid' }).progress, 55);
    assert.equal(getMobileOrderTrackingState({ status: 'qc', payment_status: 'paid' }).stage, 3);
    assert.equal(getMobileOrderTrackingState({ status: 'delivered', payment_status: 'paid' }).ready, true);
    assert.equal(getMobileOrderTrackingState({ status: 'revision_requested', payment_status: 'paid' }).label, 'Revision in progress');
    assert.equal(getMobileOrderTrackingState({ status: 'cancelled' }).progress, 0);
  });

  test('responsive customer portal uses a phone-native tracking list instead of the desktop grid', () => {
    const source = read('src/components/customer/CustomerDashboard.jsx');
    assert.match(source, /MobileOrderTrackingCard/);
    assert.match(source, /mobile-only-flex customer-mobile-orders-list/);
    assert.match(source, /className="desktop-only" style=\{\{ display: 'grid'/);
    assert.match(source, /onPay=\{handlePayOrder\}/);
  });

  test('installed mobile app exposes live progress and helper text on every order card', () => {
    const source = read('src/components/mobile/BDigitizingMobileApp.jsx');
    assert.match(source, /getMobileOrderTrackingState\(ord\)/);
    assert.match(source, /trackingState\.progress/);
    assert.match(source, /trackingState\.helper/);
  });

  test('full order tracker uses the same mobile-safe progress model with a simplified status card', () => {
    const source = read('src/components/customer/OrderTrackerDrawer.jsx');
    assert.match(source, /getMobileOrderTrackingState\(ord\)/);
    assert.match(source, /mobileTrackingState\.progress/);
    assert.match(source, /SIMPLE ORDER STATUS/);
    assert.match(source, /mobileTrackingState\.helper/);
    assert.match(source, /const \[isRequirementsOpen, setIsRequirementsOpen\] = useState\(false\)/);
    assert.match(source, /setIsRequirementsOpen\(false\)/);
    assert.equal(source.includes("repeat(4, minmax(0, 1fr))"), false);
  });
});
