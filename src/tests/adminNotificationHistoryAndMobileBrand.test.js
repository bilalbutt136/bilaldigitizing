import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

describe('Admin notification history and compact mobile brand', () => {
  test('admin notification history is fetched server-side and includes read history', () => {
    const route = read('app/api/admin/notifications/route.js');
    const state = read('src/context/StateContext.jsx');
    const mobileAdmin = read('src/components/admin/MobileAdminConsole.jsx');
    const header = read('src/components/HeaderNav.jsx');

    assert.match(route, /getServerAuthUser/);
    assert.match(route, /Administrator privileges required/);
    assert.match(route, /\.in\('recipient_role', \['admin', 'all'\]\)/);
    assert.match(route, /\.order\('created_at', \{ ascending: false \}\)/);
    assert.equal(route.includes(".eq('read', false)"), true, 'PATCH mark-all may scope unread rows');
    assert.match(route, /'Cache-Control': 'private, no-cache'/);

    assert.match(state, /fetch\('\/api\/admin\/notifications\?limit=200'/);
    assert.match(state, /action: 'mark_read'/);
    assert.match(state, /action: 'mark_all_read'/);

    assert.match(mobileAdmin, /slice\(0, 100\)/);
    assert.match(mobileAdmin, /Full admin notification history · newest first/);
    assert.match(mobileAdmin, /activeTab !== 'alerts'/);
    assert.match(header, /refreshNotifications\?\.\(safeAuthUser\?\.email \|\| null, isAdmin\)/);
  });

  test('mobile home brand keeps the logo and brand name without cramped domain or studio badge', () => {
    const mobileApp = read('src/components/mobile/BDigitizingMobileApp.jsx');
    const marker = '/* Top Brand Header */';
    const start = mobileApp.indexOf(marker);
    assert.ok(start >= 0);

    const end = mobileApp.indexOf('{isAuthenticated && (', start);
    const homeBrandSection = mobileApp.slice(start, end > start ? end : start + 2500);

    assert.match(homeBrandSection, /bdigitizing/);
    assert.match(homeBrandSection, /fontSize: 'clamp\(1\.05rem, 5vw, 1\.28rem\)'/);
    assert.match(homeBrandSection, /flexShrink: 0/);
    assert.equal(homeBrandSection.includes('.com'), false);
    assert.equal(homeBrandSection.includes('STUDIO'), false);
  });
});
