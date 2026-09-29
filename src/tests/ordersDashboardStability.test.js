import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  getStableOrderKey,
  normalizeOrderImageUrl,
  resolveOrderPreviewImage
} from '../utils/orderImageUtils.js';

describe('Customer Orders Dashboard Stability Regression', () => {
  test('order refresh effects do not depend on unstable StateContext action identities', () => {
    const source = fs.readFileSync('src/components/customer/CustomerDashboard.jsx', 'utf8');

    assert.equal(source.includes("}, [refreshOrders, userEmail]);"), false);
    assert.equal(source.includes("}, [mounted, refreshNotifications, userEmail, refreshOrders]);"), false);
    assert.equal(source.includes("[activeTab, markAllNotificationsAsRead, markOrdersAsRead]"), false);

    assert.match(source, /const refreshOrdersRef = React\.useRef\(refreshOrders\)/);
    assert.match(source, /window\.addEventListener\('bdigi_order_change', runRefresh\)/);
    assert.match(source, /\}, \[userEmail\]\);/);
    assert.match(source, /\}, \[mounted, userEmail\]\);/);
  });

  test('derived order lists are memoized instead of being filtered repeatedly during JSX rendering', () => {
    const source = fs.readFileSync('src/components/customer/CustomerDashboard.jsx', 'utf8');

    assert.match(source, /const myOrders = React\.useMemo/);
    assert.match(source, /const orderBuckets = React\.useMemo/);
    assert.match(source, /const filteredOrderSummary = React\.useMemo/);
    assert.match(source, /const ordersManagement = React\.useMemo/);
    assert.equal(source.includes('const filtered = myOrders.filter'), false);
    assert.equal(source.includes('const activeOrdersCount = myOrders.filter'), false);
  });

  test('order rows use deterministic keys and never Math.random keys', () => {
    const source = fs.readFileSync('src/components/customer/CustomerDashboard.jsx', 'utf8');

    assert.equal(source.includes('Math.random()'), false);
    assert.match(source, /getStableOrderKey\(ord, rowIndex, 'table-order'\)/);
    assert.match(source, /getStableOrderKey\(ord, rowIndex, 'mobile-order'\)/);
    assert.match(source, /getStableOrderKey\(ord, orderIndex, 'orders-mobile'\)/);
  });

  test('dashboard thumbnails use a failure-cached local placeholder instead of remote fallback URLs', () => {
    const dashboard = fs.readFileSync('src/components/customer/CustomerDashboard.jsx', 'utf8');
    const thumbnail = fs.readFileSync('src/components/customer/OrderThumbnail.jsx', 'utf8');

    assert.equal(dashboard.includes('images.unsplash.com'), false);
    assert.equal(dashboard.includes('<img'), false);
    assert.match(dashboard, /<OrderThumbnail/);

    assert.match(thumbnail, /const failedImageUrls = new Set\(\)/);
    assert.match(thumbnail, /failedImageUrls\.has\(normalizedSrc\)/);
    assert.match(thumbnail, /failedImageUrls\.add\(normalizedSrc\)/);
    assert.match(thumbnail, /data-order-image-fallback="true"/);
  });

  test('image URL and key utilities are deterministic', () => {
    assert.equal(
      resolveOrderPreviewImage({
        artworkUrl: 'https://cdn.example.com/a.png',
        image_url: 'https://cdn.example.com/b.png'
      }),
      'https://cdn.example.com/a.png'
    );

    assert.equal(resolveOrderPreviewImage({ artworkUrl: 'not a url' }), '');
    assert.equal(normalizeOrderImageUrl('/uploads/order.png'), '/uploads/order.png');

    const order = { id: '#12345', title: 'Logo' };
    assert.equal(getStableOrderKey(order, 0, 'card'), 'card-#12345');
    assert.equal(getStableOrderKey(order, 9, 'card'), 'card-#12345');
    assert.equal(getStableOrderKey({ title: 'Logo' }, 2, 'card'), 'card-Logo');
  });
});
