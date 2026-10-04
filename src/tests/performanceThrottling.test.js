import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  throttle,
  debounce,
  dedupeRouteTransition,
  resetRouteTransitionDedupe,
  createBatchedRouteTracker,
  createPresenceCoordinator
} from '../utils/throttleDebounce.js';

describe('Performance Throttling & Navigation Guard Suite', () => {

  describe('Throttle utility', () => {
    test('enforces interval between calls', () => {
      let callCount = 0;
      const fn = throttle(() => { callCount += 1; }, 5000);

      fn();
      fn();
      fn();
      assert.equal(callCount, 1, 'Only leading call executes within 5000ms');
    });

    test('isolates throttle limits by keyFn', () => {
      const calls = [];
      const fn = throttle((key) => { calls.push(key); }, 5000, { keyFn: (k) => k });

      fn('route:/');
      fn('route:/');
      fn('route:/services');
      fn('route:/services');

      assert.deepEqual(calls, ['route:/', 'route:/services'], 'Separate keys have separate throttle buckets');
    });
  });

  describe('Debounce utility', () => {
    test('debounces execution until quiet period', async () => {
      let callCount = 0;
      const fn = debounce(() => { callCount += 1; }, 50);

      fn();
      fn();
      fn();
      assert.equal(callCount, 0, 'Does not fire synchronously');

      await new Promise(r => setTimeout(r, 80));
      assert.equal(callCount, 1, 'Fires once after delay');
    });

    test('cancel aborts execution', async () => {
      let callCount = 0;
      const fn = debounce(() => { callCount += 1; }, 50);

      fn();
      fn.cancel();

      await new Promise(r => setTimeout(r, 80));
      assert.equal(callCount, 0, 'Cancelled call does not execute');
    });
  });

  describe('dedupeRouteTransition', () => {
    test('deduplicates identical route transitions within minimum 5000ms window', () => {
      resetRouteTransitionDedupe('test_nav:/pricing');

      const first = dedupeRouteTransition('test_nav:/pricing', 5000);
      const second = dedupeRouteTransition('test_nav:/pricing', 5000);
      const third = dedupeRouteTransition('test_nav:/pricing', 5000);

      assert.equal(first, true, 'First route transition is allowed');
      assert.equal(second, false, 'Second route transition within 5s is blocked');
      assert.equal(third, false, 'Third route transition within 5s is blocked');

      resetRouteTransitionDedupe('test_nav:/pricing');
      const afterReset = dedupeRouteTransition('test_nav:/pricing', 5000);
      assert.equal(afterReset, true, 'Allowed after reset');
    });

    test('enforces minimum 5000ms even if lower interval passed', () => {
      resetRouteTransitionDedupe('test_floor:/');
      const first = dedupeRouteTransition('test_floor:/', 100);
      const second = dedupeRouteTransition('test_floor:/', 100);

      assert.equal(first, true);
      assert.equal(second, false, 'Minimum 5000ms floor prevents rapid firing');
    });
  });

  describe('createBatchedRouteTracker', () => {
    test('batches rapid events on the same route and deduplicates dispatch', async () => {
      const dispatched = [];
      const tracker = createBatchedRouteTracker((ev) => {
        dispatched.push(ev);
      }, { minIntervalMs: 5000, debounceMs: 40 });

      resetRouteTransitionDedupe('tracking_route:/services/vector-tracing');

      tracker({ eventName: 'PageView', pagePath: '/services/vector-tracing' });
      tracker({ eventName: 'ViewContent', pagePath: '/services/vector-tracing', value: '$8.00' });

      await new Promise(r => setTimeout(r, 80));

      assert.equal(dispatched.length, 1, 'Only one combined event dispatched per route transition');
      assert.equal(dispatched[0].eventName, 'ViewContent', 'Prioritizes high-intent conversion event over generic PageView');
    });
  });

  describe('createPresenceCoordinator', () => {
    test('cancels pending offline un-track when route navigation immediately re-asserts online presence', async () => {
      let offlineFired = false;
      let onlineCalls = [];

      const coordinator = createPresenceCoordinator({
        onOnline: (payload) => { onlineCalls.push(payload); },
        onOffline: () => { offlineFired = true; },
        minIntervalMs: 5000,
        offlineDebounceMs: 50
      });

      resetRouteTransitionDedupe('presence_online:user@example.com');
      resetRouteTransitionDedupe('presence_offline:user@example.com');

      // Initial page: user online
      coordinator.trackOnline({ email: 'user@example.com', name: 'User' });
      assert.equal(onlineCalls.length, 1);

      // Route transition begins: previous component cleanup calls untrackOffline
      coordinator.untrackOffline('user@example.com');

      // New route component immediately mounts and calls trackOnline
      coordinator.trackOnline({ email: 'user@example.com', name: 'User' });

      // Wait longer than offlineDebounceMs
      await new Promise(r => setTimeout(r, 80));

      assert.equal(offlineFired, false, 'Offline call was cancelled during route transition; no spurious HTTP traffic');
    });
  });

  describe('Database and Route Code Inspection', () => {
    test('presenceService imports and uses dedupeRouteTransition with offline debounce', () => {
      const source = fs.readFileSync('src/services/presenceService.js', 'utf8');
      assert.match(source, /dedupeRouteTransition/);
      assert.match(source, /PRESENCE_ROUTE_THROTTLE_MS = 5000/);
      assert.match(source, /pendingOfflineTimeout/);
      assert.match(source, /REST_PRESENCE_MIN_INTERVAL_MS = 60_000/);
    });

    test('supabaseService tracking uses dedupeRouteTransition with minimum 5s interval', () => {
      const source = fs.readFileSync('src/services/supabaseService.js', 'utf8');
      assert.match(source, /dedupeRouteTransition/);
      assert.match(source, /TRACKING_MIN_INTERVAL_MS = 5000/);
      assert.match(source, /inFlightTrackingRequests/);
    });

    test('chat unread-counts API route implements SWR caching and required column selection', () => {
      const source = fs.readFileSync('app/api/chat/unread-counts/route.js', 'utf8');
      assert.match(source, /UNREAD_FRESH_TTL_MS = 20_000/);
      assert.match(source, /UNREAD_STALE_TTL_MS = 60_000/);
      assert.match(source, /staleUntil/);
      assert.match(source, /inFlightUnreadQueries/);
      assert.match(source, /select\(isAdmin \? 'id, tags, order_title, unread_admin_count' : 'id, tags, order_title, unread_client_count'\)/);
      assert.equal(source.includes("select('*')"), false);
    });

    test('orders API handlers do not select * on database queries', () => {
      const fetchOne = fs.readFileSync('src/server/orders/handlers/get/fetchOne.js', 'utf8');
      const cancelOrder = fs.readFileSync('src/server/orders/handlers/post/cancelOrder.js', 'utf8');

      assert.equal(fetchOne.includes(".select('*')"), false);
      assert.equal(cancelOrder.includes(".select('*')"), false);
      assert.match(cancelOrder, /\.select\('id, client_email, status'\)/);
    });

    test('composite indexes migration exists with required conversations and orders indexes', () => {
      const migrationPath = path.join(process.cwd(), 'supabase/migrations/20261004000001_performance_indexes_unread_and_orders.sql');
      assert.equal(fs.existsSync(migrationPath), true);

      const sql = fs.readFileSync(migrationPath, 'utf8');
      assert.match(sql, /idx_conversations_client_unread_counts/);
      assert.match(sql, /idx_conversations_unread_admin_count/);
      assert.match(sql, /idx_orders_user_id_status/);
      assert.match(sql, /idx_orders_user_id_created_at_desc/);
      assert.match(sql, /idx_orders_client_email_created_at_desc/);
      assert.match(sql, /idx_revisions_order_id_created_at/);
    });
  });

});
