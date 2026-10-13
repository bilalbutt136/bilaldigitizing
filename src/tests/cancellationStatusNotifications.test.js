import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  filterAndSanitizeNotifications,
  isOrderCancellationNotification
} from '../utils/notificationRouter.js';
import { getCompactNotificationText } from '../utils/notificationPreview.js';
import { getMobileOrderTrackingState } from '../utils/orderTracking.js';

test('approved and rejected cancellation notices remain visible to the correct customer', () => {
  const own = [
    { id: 'notif-approved-cancel-16502-1', title: 'Cancellation approved',
      message: 'Order #16502 cancelled.', order_id: '16502',
      recipient_role: 'client', recipient_email: 'owner@example.com', created_at: '2026-10-12T10:00:00Z' },
    { id: 'notif-rejected-cancel-16503-2', title: 'Cancellation declined',
      message: 'Order #16503 · Production continues', order_id: '16503',
      recipient_role: 'client', recipient_email: 'owner@example.com', created_at: '2026-10-12T10:01:00Z' },
    { id: 'notif-cust-cancel-16504-3', title: 'Cancellation submitted',
      message: 'Order #16504 · Awaiting review', order_id: '16504',
      recipient_role: 'client', recipient_email: 'owner@example.com', created_at: '2026-10-12T10:02:00Z' },
  ];
  const someoneElses = { ...own[0], id: 'notif-approved-cancel-999-4',
    order_id: '999', recipient_email: 'other@example.com' };
  assert.equal(own.every(isOrderCancellationNotification), true);
  assert.deepEqual(
    filterAndSanitizeNotifications([...own, someoneElses], {
      currentUserEmail: 'owner@example.com'
    }).map(item => item.id).sort(),
    own.map(item => item.id).sort()
  );
  assert.equal(filterAndSanitizeNotifications(own, { currentUserEmail: '' }).length, 0);
  assert.equal(isOrderCancellationNotification({
    id: 'ord-stat-16502', title: 'Order status updated', order_id: '16502'
  }), false);
});

test('short notification previews do not reveal client email, order title, or private reason', () => {
  const original = {
    id: 'notif-cancel-16502-1',
    order_id: '16502',
    title: '⚠️ Cancellation Requested: WhatsApp Image 2026-09-25 at 9.50.59 AM',
    message: 'owner@example.com requested cancellation for Order #16502. Reason: Never need this one'
  };
  const preview = getCompactNotificationText(original);
  assert.deepEqual(preview, { title: 'Cancellation requested', message: 'Order #16502 · Review request' });
  assert.equal(JSON.stringify(preview).includes('owner@example.com'), false);
  assert.equal(getCompactNotificationText({ title: 'Important Notice', message: 'x'.repeat(250) }).message.length <= 90, true);
  assert.equal(getCompactNotificationText({ id: 'notif-approved-cancel-16502-2', title: 'Cancellation approved', order_id: '16502' }).title, 'Cancellation approved');
  assert.equal(getCompactNotificationText({ id: 'notif-rejected-cancel-16502-3', title: 'Cancellation declined', order_id: '16502' }).title, 'Cancellation declined');
});


test('notification lists use compact previews on web, admin, client, and mobile app', () => {
  const relativeSources = [
    '../components/HeaderNav.jsx',
    '../components/admin/MobileAdminConsole.jsx',
    '../components/customer/ClientNotificationsView.jsx',
    '../components/mobile/BDigitizingMobileApp.jsx'
  ];
  for (const relativeSource of relativeSources) {
    const source = readFileSync(new URL(relativeSource, import.meta.url), 'utf8');
    assert.match(source, /getCompactNotificationText/, relativeSource);
    assert.match(source, /getCompactNotificationText\((?:item|notification|notif|n)\)\.title/, relativeSource);
    assert.match(source, /getCompactNotificationText\((?:item|notification|notif|n)\)\.message/, relativeSource);
  }

  const mobileSource = readFileSync(new URL('../components/mobile/BDigitizingMobileApp.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(mobileSource, /\{n\.title\s*\|\|\s*'Studio Notification'\}/);
  assert.doesNotMatch(mobileSource, /\{n\.message\s*\|\|\s*n\.body\}/);
});

test('generic and new-order previews stay brief without changing the original notice', () => {
  const original = {
    id: 'notif-ord-16502-admin',
    order_id: '#16502',
    title: '🚨 New Order: WhatsApp Image 2026-09-25 at 9.50.59 AM - Left Chest & Cap Small Logo',
    message: 'Owner (owner@example.com) submitted an order with many details'
  };
  assert.deepEqual(getCompactNotificationText(original), {
    title: 'New order',
    message: 'Order #16502 · View order'
  });
  assert.match(original.title, /WhatsApp Image/); // only the visible preview changes
  const generic = getCompactNotificationText({ title: 'A'.repeat(180), message: 'B'.repeat(200) });
  assert.ok(generic.title.length <= 45);
  assert.ok(generic.message.length <= 72);
});

test('customer tracking reflects cancellation pending, cancelled, and continuing after declined request', () => {
  const pending = getMobileOrderTrackingState({ status: 'cancellation_requested', payment_status: 'paid' });
  assert.equal(pending.label, 'Cancellation review');
  assert.equal(pending.unpaid, false);
  const cancelled = getMobileOrderTrackingState({ status: 'cancelled', payment_status: 'refunded' });
  assert.equal(cancelled.label, 'Cancelled');
  assert.equal(cancelled.unpaid, false);
  const continuing = getMobileOrderTrackingState({ status: 'in_progress', payment_status: 'paid' });
  assert.equal(continuing.label, 'In production');
});
