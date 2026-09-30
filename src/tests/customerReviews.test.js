import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = relativePath => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('Customer Order Reviews & Publication Workflow', () => {
  test('review migration is private by default and one review is allowed per order', () => {
    const sql = read('supabase/migrations/20260930000001_customer_order_reviews.sql');

    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.customer_reviews/);
    assert.match(sql, /order_id TEXT NOT NULL UNIQUE/);
    assert.match(sql, /moderation_status TEXT NOT NULL DEFAULT 'pending'/);
    assert.match(sql, /is_published BOOLEAN NOT NULL DEFAULT FALSE/);
    assert.match(sql, /ALTER TABLE public\.customer_reviews ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /REVOKE ALL ON TABLE public\.customer_reviews FROM anon, authenticated/);
  });

  test('review API verifies order ownership, completion and admin-only moderation', () => {
    const api = read('app/api/reviews/route.js');

    assert.match(api, /getServerAuthUser/);
    assert.match(api, /isOwnedOrder\(order, user\)/);
    assert.match(api, /String\(order\.status \|\| ''\)\.toLowerCase\(\) !== 'completed'/);
    assert.match(api, /scope === 'admin'/);
    assert.match(api, /!user \|\| !isAdmin/);
    assert.match(api, /moderation_status: 'published'/);
    assert.match(api, /moderation_status: 'hidden'/);
    assert.match(api, /revalidateTag\('catalog'\)/);
  });

  test('customer is invited after approval and can leave feedback later', () => {
    const drawer = read('src/components/customer/OrderTrackerDrawer.jsx');
    const modal = read('src/components/customer/CustomerReviewModal.jsx');

    assert.match(drawer, /setShowCustomerReviewModal\(true\)/);
    assert.match(drawer, /> Leave feedback/);
    assert.match(drawer, /\/api\/reviews\?orderId=/);
    assert.match(drawer, /Feedback submitted/);
    assert.match(drawer, /<CustomerReviewModal/);

    assert.match(modal, /Optional — you can leave this later/);
    assert.match(modal, /Maybe later/);
    assert.match(modal, /Nothing is published automatically/);
    assert.match(modal, /Submit feedback/);
  });

  test('admin portal provides a dedicated moderation desk', () => {
    const dashboard = read('src/components/admin/AdminDashboard.jsx');
    const manager = read('src/components/admin/CustomerReviewsManager.jsx');

    assert.match(dashboard, /id: 'reviews', label: 'Customer Reviews'/);
    assert.match(dashboard, /<CustomerReviewsManager showToast=\{showToast\}/);
    assert.match(manager, /Publish to website/);
    assert.match(manager, /Keep private/);
    assert.match(manager, /Unpublish/);
    assert.match(manager, /\/api\/reviews\?scope=admin/);
  });

  test('only published customer reviews are merged into public testimonials', () => {
    const serverCatalog = read('src/lib/catalog/serverCatalog.js');
    const catalogApi = read('app/api/catalog/route.js');

    for (const source of [serverCatalog, catalogApi]) {
      assert.match(source, /from\('customer_reviews'\)/);
      assert.match(source, /eq\('is_published', true\)/);
      assert.match(source, /eq\('moderation_status', 'published'\)/);
      assert.match(source, /verified_order_review: true/);
    }
  });
});
