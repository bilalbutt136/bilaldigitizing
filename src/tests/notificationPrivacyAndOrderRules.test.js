import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  filterAndSanitizeNotifications, 
  isOrderPlacedNotification, 
  isOrderPaymentConfirmedNotification,
  isOrderDeliveredNotification,
  resolveNotificationDate,
  formatNotificationExactTime,
  getNotificationFullDateTime
} from '../utils/notificationRouter.js';

describe('Notification Privacy Isolation & Two-Notifications-Per-Order Enforcement', () => {

  const sampleNotifications = [
    // Alice's Order #1001 notifications (multiple touchpoints)
    {
      id: 'ord-created-1001',
      recipient_role: 'client',
      recipient_email: 'alice@studio.com',
      title: '🎉 Order Placed Successfully!',
      message: 'Your order "Company Cap Logo" has been received.',
      order_id: '1001',
      created_at: '2026-09-24T10:00:00.000Z'
    },
    {
      id: 'ord-stat-1001-in_progress',
      recipient_role: 'client',
      recipient_email: 'alice@studio.com',
      title: '🔔 Order #1001: IN_PROGRESS',
      message: 'Order status is now updated to IN_PROGRESS.',
      order_id: '1001',
      created_at: '2026-09-24T10:05:00.000Z'
    },
    {
      id: 'ord-paid-1001',
      recipient_role: 'client',
      recipient_email: 'alice@studio.com',
      title: '💳 Payment Confirmed - Order Active!',
      message: 'Payment confirmed for "Company Cap Logo". Production is underway.',
      order_id: '1001',
      created_at: '2026-09-24T10:10:00.000Z'
    },
    {
      id: 'ord-deliv-1001',
      recipient_role: 'client',
      recipient_email: 'alice@studio.com',
      title: '📦 Order #1001 Files Delivered!',
      message: 'Your digitized production files are ready for inspection and download.',
      order_id: '1001',
      created_at: '2026-09-24T11:00:00.000Z'
    },
    {
      id: 'notif-rev-1001-client-12345',
      recipient_role: 'client',
      recipient_email: 'alice@studio.com',
      title: '🔄 Modification Request Submitted',
      message: 'Your modification request has been sent to our team.',
      order_id: '1001',
      created_at: '2026-09-24T11:30:00.000Z'
    },

    // Alice's Order #1002 (Only placed so far, unpaid)
    {
      id: 'ord-created-1002',
      recipient_role: 'client',
      recipient_email: 'alice@studio.com',
      title: '🎉 Order #1002 Placed!',
      message: 'Order created. Waiting for payment.',
      order_id: '1002',
      created_at: '2026-09-24T12:00:00.000Z'
    },

    // Bob's Order #2001 (Belongs to Bob, MUST NOT leak to Alice)
    {
      id: 'ord-created-2001',
      recipient_role: 'client',
      recipient_email: 'bob@competitor.com',
      title: '🎉 Order Placed Successfully!',
      message: 'Bob order details.',
      order_id: '2001',
      created_at: '2026-09-24T10:15:00.000Z'
    },
    {
      id: 'ord-paid-2001',
      recipient_role: 'client',
      recipient_email: 'bob@competitor.com',
      title: '💳 Payment Confirmed - Order Active!',
      message: 'Bob order payment confirmed.',
      order_id: '2001',
      created_at: '2026-09-24T10:20:00.000Z'
    },

    // Admin Alerts (MUST NEVER leak to clients)
    {
      id: 'notif-ord-1001-admin',
      recipient_role: 'admin',
      recipient_email: null,
      title: '🚨 New Order: Company Cap Logo',
      message: 'Received from Alice (alice@studio.com). Price: $15.00',
      order_id: '1001',
      created_at: '2026-09-24T10:00:01.000Z'
    },
    {
      id: 'notif-paid-1001-admin',
      recipient_role: 'admin',
      recipient_email: null,
      title: '💳 Payment Confirmed: Company Cap Logo',
      message: 'Alice paid $15.00',
      order_id: '1001',
      created_at: '2026-09-24T10:10:01.000Z'
    },

    // Global Announcement (Broad-audience system notice)
    {
      id: 'announcement-holiday',
      recipient_role: 'all',
      recipient_email: null,
      title: 'Holiday Schedule Notice',
      message: 'Our digitizing studio will operate normal hours this weekend.',
      order_id: null,
      created_at: '2026-09-24T09:00:00.000Z'
    }
  ];

  test('1. Unauthenticated guest visitor receives ZERO notifications', () => {
    const guestResult = filterAndSanitizeNotifications(sampleNotifications, {
      currentUserEmail: '',
      isAdmin: false
    });
    assert.deepEqual(guestResult, [], 'Unauthenticated visitor must receive an empty array');
  });

  test('2. Customer Alice ONLY sees her own notifications (zero Bob leakage, zero Admin leakage)', () => {
    const aliceResult = filterAndSanitizeNotifications(sampleNotifications, {
      currentUserEmail: 'alice@studio.com',
      isAdmin: false
    });

    // Check that none of Bob's notifications appear
    const bobNotifs = aliceResult.filter(n => (n.recipient_email || '').includes('bob'));
    assert.equal(bobNotifs.length, 0, 'Must NOT contain any notifications belonging to Bob');

    // Check that none of Admin notifications appear
    const adminNotifs = aliceResult.filter(n => n.recipient_role === 'admin');
    assert.equal(adminNotifs.length, 0, 'Must NOT contain any notifications meant for Admin');

    // Check case-insensitive email matching
    const upperAliceResult = filterAndSanitizeNotifications(sampleNotifications, {
      currentUserEmail: 'ALICE@STUDIO.COM',
      isAdmin: false
    });
    assert.equal(upperAliceResult.length, aliceResult.length, 'Email matching must be case-insensitive');
  });

  test('3. Clean order lifecycle notifications: Order #1001 shows Placed, Paid, and Delivered', () => {
    const aliceResult = filterAndSanitizeNotifications(sampleNotifications, {
      currentUserEmail: 'alice@studio.com',
      isAdmin: false
    });

    // Extract Order #1001 notifications
    const order1001Notifs = aliceResult.filter(n => String(n.order_id) === '1001');
    
    // Exactly 3 clean lifecycle notifications (Placed, Paid, and Delivered)
    assert.equal(order1001Notifs.length, 3, 'Order #1001 must have 3 clean notifications (Placed, Paid, and Delivered)');

    const hasPlaced = order1001Notifs.some(n => isOrderPlacedNotification(n));
    const hasPaid = order1001Notifs.some(n => isOrderPaymentConfirmedNotification(n));
    const hasDeliv = order1001Notifs.some(n => isOrderDeliveredNotification(n));

    assert.equal(hasPlaced, true, 'Order #1001 must include the Order Placed notification');
    assert.equal(hasPaid, true, 'Order #1001 must include the Payment Confirmed notification');
    assert.equal(hasDeliv, true, 'Order #1001 must include the Order Delivered notification');

    // Ensure noisy intermediate internal notifications (raw status updates, revision internal logs) were excluded
    const hasRev = order1001Notifs.some(n => n.id.includes('rev'));
    const hasStat = order1001Notifs.some(n => n.id.includes('stat'));

    assert.equal(hasRev, false, 'Internal revision log must be suppressed from customer order feed');
    assert.equal(hasStat, false, 'Raw status update notification must be suppressed from customer order feed');
  });

  test('4. Order #1002 (unpaid) only shows Placed notification (at most 1 notification so far)', () => {
    const aliceResult = filterAndSanitizeNotifications(sampleNotifications, {
      currentUserEmail: 'alice@studio.com',
      isAdmin: false
    });

    const order1002Notifs = aliceResult.filter(n => String(n.order_id) === '1002');
    assert.equal(order1002Notifs.length, 1, 'Order #1002 must only have 1 notification (Placed)');
    assert.equal(isOrderPlacedNotification(order1002Notifs[0]), true);
  });

  test('5. Duplicate Placed or Paid notifications for the same order are strictly deduplicated', () => {
    const duplicates = [
      {
        id: 'ord-created-9999',
        recipient_role: 'client',
        recipient_email: 'charlie@studio.com',
        title: '🎉 Order Placed Successfully!',
        order_id: '9999',
        created_at: '2026-09-24T14:00:00.000Z'
      },
      {
        id: 'notif-ord-9999-client',
        recipient_role: 'client',
        recipient_email: 'charlie@studio.com',
        title: '🎉 Order #9999 Placed!',
        order_id: '9999',
        created_at: '2026-09-24T14:00:01.000Z'
      },
      {
        id: 'ord-paid-9999',
        recipient_role: 'client',
        recipient_email: 'charlie@studio.com',
        title: '💳 Payment Confirmed - Order Active!',
        order_id: '9999',
        created_at: '2026-09-24T14:05:00.000Z'
      },
      {
        id: 'notif-paid-9999-client',
        recipient_role: 'client',
        recipient_email: 'charlie@studio.com',
        title: '✅ Payment Confirmed — Production Started!',
        order_id: '9999',
        created_at: '2026-09-24T14:05:02.000Z'
      }
    ];

    const result = filterAndSanitizeNotifications(duplicates, {
      currentUserEmail: 'charlie@studio.com',
      isAdmin: false
    });

    assert.equal(result.length, 2, 'Must collapse 4 notifications into exactly 2 (1 Placed, 1 Paid)');
  });

  test('6. Global system announcements (recipient_role: all) are delivered to authenticated users', () => {
    const aliceResult = filterAndSanitizeNotifications(sampleNotifications, {
      currentUserEmail: 'alice@studio.com',
      isAdmin: false
    });

    const announcement = aliceResult.find(n => n.id === 'announcement-holiday');
    assert.ok(announcement, 'Global announcements must reach authenticated client');
  });

  test('7. Admin portal receives admin alerts and global notices, but not private client duplicates', () => {
    const adminResult = filterAndSanitizeNotifications(sampleNotifications, {
      currentUserEmail: 'admin@bdigitizing.com',
      isAdmin: true
    });

    const adminNotifs = adminResult.filter(n => n.recipient_role === 'admin');
    assert.equal(adminNotifs.length >= 2, true, 'Admin must see administrative notifications');

    const bobPersonalNotifs = adminResult.filter(n => n.recipient_email === 'bob@competitor.com');
    assert.equal(bobPersonalNotifs.length, 0, 'Admin notification list should not be flooded with private client notifications');
  });

  test('8. Helper detection functions accurately identify Placed and Payment Confirmed events', () => {
    assert.equal(isOrderPlacedNotification({ title: '🎉 Order Placed Successfully!' }), true);
    assert.equal(isOrderPlacedNotification({ id: 'ord-created-555' }), true);
    assert.equal(isOrderPlacedNotification({ id: 'notif-ord-555-client' }), true);
    assert.equal(isOrderPlacedNotification({ title: 'Order #555: IN_PROGRESS' }), false);

    assert.equal(isOrderPaymentConfirmedNotification({ title: '💳 Payment Confirmed - Order Active!' }), true);
    assert.equal(isOrderPaymentConfirmedNotification({ id: 'ord-paid-555' }), true);
    assert.equal(isOrderPaymentConfirmedNotification({ title: 'Offer Paid via Stripe!' }), true);
    assert.equal(isOrderPaymentConfirmedNotification({ title: 'Order Delivered' }), false);
  });

  test('9. resolveNotificationDate accurately resolves date from created_at, timestamp, or linked orders', () => {
    // Direct created_at from Postgres
    const d1 = resolveNotificationDate({ created_at: '2026-09-24T14:32:00.000Z' });
    assert.equal(d1.toISOString(), '2026-09-24T14:32:00.000Z');

    // Direct timestamp
    const d2 = resolveNotificationDate({ timestamp: '2026-09-25T08:15:00.000Z' });
    assert.equal(d2.toISOString(), '2026-09-25T08:15:00.000Z');

    // Missing direct time, fallback to linked order in orders array
    const orders = [
      { id: 'ORD-7788', created_at: '2026-09-24T09:00:00.000Z' }
    ];
    const d3 = resolveNotificationDate({ order_id: 'ORD-7788' }, orders);
    assert.equal(d3.toISOString(), '2026-09-24T09:00:00.000Z');

    // From notification ID containing timestamp
    const d4 = resolveNotificationDate({ id: 'notif-1727244983000-xyz' });
    assert.ok(d4 instanceof Date);
    assert.equal(isNaN(d4.getTime()), false);
  });

  test('10. formatNotificationExactTime displays exact dates and times instead of defaulting to "Just now"', () => {
    // 1. Order from September 24 (past date) MUST show exact date and time, NEVER "Just now"
    const pastNotif = { created_at: '2026-09-24T15:30:00.000Z' };
    const formattedPast = formatNotificationExactTime(pastNotif);
    assert.notEqual(formattedPast, 'Just now');
    assert.ok(formattedPast.includes('Sep 24') || formattedPast.includes('Yesterday') || formattedPast.includes(':'));

    // 2. Notification from linked order MUST format accurately
    const orders = [{ id: '000251296', created_at: '2026-09-24T10:00:00.000Z' }];
    const orderNotif = { id: 'notif-000251296', order_id: '000251296' };
    const formattedOrder = formatNotificationExactTime(orderNotif, orders);
    assert.notEqual(formattedOrder, 'Just now');
    assert.ok(formattedOrder.includes(':'));

    // 3. Tooltip provides complete full date-time
    const fullTime = getNotificationFullDateTime(pastNotif);
    assert.ok(fullTime.length > 5);
  });
});
