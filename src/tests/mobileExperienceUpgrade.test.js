import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = relativePath => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('Mobile Portal & App Experience Upgrade', () => {
  test('customer mobile layout has a valid closed main-content rule before chat-mode rules', () => {
    const source = read('src/components/customer/CustomerDashboard.jsx');
    assert.match(
      source,
      /\.client-main-content:not\(\.client-main-chat-tab\)\s*\{[\s\S]*?overflow:\s*visible\s*!important;[\s\S]*?\}\s*\.client-portal-body\s*\{/
    );
  });

  test('customer portal uses a dedicated mobile command center and hides desktop dashboard clutter', () => {
    const source = read('src/components/customer/CustomerDashboard.jsx');
    assert.match(source, /CustomerMobileCommandCenter/);
    assert.match(source, /onOpenWallet=\{\(\) => setActiveTab\('wallet'\)\}/);
    assert.match(source, /#orders-table-wrapper\s*\{[\s\S]*?display:\s*none\s*!important/);
    assert.match(source, /Welcome Header Container[\s\S]*?className="desktop-only"/);
  });

  test('customer Wallet bottom navigation is a real destination, not a modal-disguised tab', () => {
    const source = read('src/components/customer/CustomerDashboard.jsx');
    const walletNav = source.match(/\{\/\* Tab 4: Studio Wallet \*\/[\s\S]*?\{\/\* Tab 5: Profile \/ Account \*\//)?.[0] || '';
    assert.match(walletNav, /setActiveTab\('wallet'\)/);
    assert.equal(walletNav.includes('setIsDepositModalOpen(true)'), false);
    assert.match(source, /TAB: STUDIO WALLET/);
    assert.match(source, /> Add funds/);
  });

  test('mobile flex layouts use mobile-only-flex instead of forced block display', () => {
    const customer = read('src/components/customer/CustomerDashboard.jsx');
    const admin = read('src/components/admin/AdminDashboard.jsx');
    assert.match(customer, /className="mobile-only-flex customer-mobile-context-header"/);
    assert.match(admin, /className="mobile-only-flex"/);
    assert.equal(admin.includes('className="mobile-only"'), false);
  });

  test('admin portal exposes predictable high-frequency mobile bottom navigation', () => {
    const source = read('src/components/admin/AdminDashboard.jsx');
    assert.match(source, /admin-mobile-bottom-nav/);
    assert.match(source, /\{ id: 'dashboard', label: 'Home'/);
    assert.match(source, /\{ id: 'orders', label: 'Orders'/);
    assert.match(source, /\{ id: 'inbox', label: 'Inbox'/);
    assert.match(source, /\{ id: 'support', label: 'Support'/);
    assert.match(source, /\{ id: 'more', label: 'More'/);
    assert.match(source, /adminMobileTitle/);
  });

  test('installed mobile app shows an authenticated Studio Hub before catalog discovery', () => {
    const app = read('src/components/mobile/BDigitizingMobileApp.jsx');
    const hub = read('src/components/mobile/MobileStudioHub.jsx');
    assert.match(app, /import MobileStudioHub from '\.\/MobileStudioHub'/);
    assert.match(app, /\{isAuthenticated && \([\s\S]*?<MobileStudioHub/);
    assert.match(hub, /Your Studio Hub/);
    assert.match(hub, /Start a new order/);
    assert.match(hub, /My Orders/);
    assert.match(hub, /Messages/);
    assert.match(hub, /Wallet/);
    assert.match(hub, /Live Support/);
  });

  test('customer mobile command center gives first-time users a clear three-step onboarding path', () => {
    const source = read('src/components/customer/CustomerMobileCommandCenter.jsx');
    assert.match(source, /How your first order works/);
    assert.match(source, /Upload artwork/);
    assert.match(source, /Studio production/);
    assert.match(source, /Download files/);
  });
});
