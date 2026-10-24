import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('tracking data quality guards', async (t) => {
  await t.test('service page views never masquerade as revenue', () => {
    const tracker = read('src/components/common/MetaPixelTracker.jsx');
    assert.doesNotMatch(tracker, /value:\s*10\.00/);
    assert.doesNotMatch(tracker, /value:\s*8\.00/);
    assert.doesNotMatch(tracker, /value:\s*150\.00/);
    assert.match(tracker, /const isRevenueEvent = \/purchase\/i/);
    assert.match(tracker, /value:\s*'—'/);
  });

  await t.test('tracking API normalizes non-revenue values and flags automation', () => {
    const route = read('app/api/tracking/route.js');
    assert.match(route, /const isRevenueEvent = \/purchase\/i/);
    assert.match(route, /isLikelyBot:/);
    assert.match(route, /server-automation-user-agent/);
    assert.match(route, /!fullTelemetry\.isLikelyBot/);
  });

  await t.test('visitor telemetry records storage and automation signals', () => {
    const visitorTracker = read('src/utils/visitorTracker.js');
    assert.match(visitorTracker, /detectAutomationSignals/);
    assert.match(visitorTracker, /navigator\.webdriver/);
    assert.match(visitorTracker, /persistentStorage/);
    assert.match(visitorTracker, /userAgent/);
  });

  await t.test('admin activity defaults to humans and renders revenue only for real revenue events', () => {
    const panel = read('src/components/admin/tracking/GoogleAdsVisitorActivityPanel.jsx');
    const modal = read('src/components/admin/tracking/VisitorDetailsModal.jsx');
    assert.match(panel, /useState\('humans'\)/);
    assert.match(panel, /\['bots', 'Bots'\]/);
    assert.match(panel, /const displayRevenue/);
    assert.match(panel, /<th>Revenue<\/th>/);
    assert.match(panel, /Approx\. IP/);
    assert.match(panel, /automated events hidden/);
    assert.match(modal, /isRevenueEvent && event\.value/);
    assert.match(modal, /Confirmed Revenue:/);
    assert.match(modal, /Likely Automated Traffic/);
  });

  await t.test('payment success is classified before generic order checkout', () => {
    const tracker = read('src/components/common/MetaPixelTracker.jsx');
    const purchaseIndex = tracker.indexOf("window.location.search.includes('payment=success')");
    const checkoutIndex = tracker.indexOf("pathname === '/order'");
    assert.ok(purchaseIndex >= 0);
    assert.ok(checkoutIndex >= 0);
    assert.ok(purchaseIndex < checkoutIndex, 'Purchase success branch must run before checkout branch');
    assert.match(tracker, /metaPixelDelivered/);
  });
});
