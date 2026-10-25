import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const header = readFileSync(new URL('../components/HeaderNav.jsx', import.meta.url), 'utf8');
const homepage = readFileSync(new URL('../components/public/HomePageClient.jsx', import.meta.url), 'utf8');

test('mobile website header shows login and signup in guest state', () => {
  const headerArea = header.split('site-header-mobile-actions')[1]?.split('{/* Dynamic Header Controls (Desktop) */}')[0];
  assert.ok(headerArea, 'Mobile header actions must be present');
  assert.match(headerArea, /!safeIsAuthenticated &&/);
  assert.match(headerArea, /site-header-login-cta/);
  assert.match(headerArea, /site-header-signup-cta/);
  assert.match(headerArea, /href="\/login"/);
  assert.match(headerArea, /href="\/signup"/);
});

test('inbox and notification icons are only available after sign in', () => {
  const headerArea = header.split('site-header-mobile-actions')[1]?.split('{/* Dynamic Header Controls (Desktop) */}')[0];
  const memberArea = headerArea.split('{safeIsAuthenticated && (')[1]?.split('{/* Mobile Three-Lines Menu Toggle Button */}')[0];
  assert.ok(memberArea, 'Members-only area must wrap existing inbox and notifications controls');
  assert.match(memberArea, /Mobile Inbox Icon/);
  assert.match(memberArea, /Mobile Notifications Bell/);
  assert.match(memberArea, /handleInboxClick/);
  assert.match(memberArea, /setIsNotificationDropdownOpen/);
  assert.match(headerArea, /Toggle Navigation Menu/, 'Menu remains available for all visitors');
});

test('normal mobile website renders the admin-controlled offer without app mode', () => {
  const webPage = homepage.split('className="website-page-wrapper"')[1];
  assert.ok(webPage, 'Website home page must exist');
  assert.match(webPage, /getActiveMobileOffer\(siteSettings\)/);
  assert.match(webPage, /className="mobile-only"/);
  assert.match(webPage, /<MobileWelcomeOffer/);
  assert.match(webPage, /setAuthModalMode\('signup'\)/);
});
