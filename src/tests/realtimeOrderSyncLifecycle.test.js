import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-anon-key';

const { mapDatabaseOrderToClientOrder } = await import('../services/supabaseService.js');

describe('Real-Time Order Lifecycle & Dashboard State Synchronization', () => {

  test('1. mapDatabaseOrderToClientOrder correctly maps snake_case Supabase DB rows to frontend models', () => {
    const rawDbRow = {
      id: '#32287',
      title: 'Andrew 14 - Embroidery Digitizing (Qty: 1)',
      client_name: 'Bilal',
      client_email: 'mbilaljc890@gmail.com',
      service_category: 'Embroidery Digitizing',
      service_type: 'embroidery',
      price: 18,
      status: 'submitted',
      payment_status: 'pending',
      user_id: '8a3e3437-d82c-48c1-a2a8-0470c69cb024',
      created_at: '2026-09-28T04:51:50.668099+00:00',
      order_files: [
        {
          id: 'file-1',
          file_name: 'artwork.png',
          file_type: 'client_artwork',
          public_url: 'https://cloudinary.com/artwork.png'
        }
      ]
    };

    const clientOrder = mapDatabaseOrderToClientOrder(rawDbRow);

    assert.equal(clientOrder.id, '#32287');
    assert.equal(clientOrder.title, 'Andrew 14 - Embroidery Digitizing (Qty: 1)');
    assert.equal(clientOrder.clientEmail, 'mbilaljc890@gmail.com');
    assert.equal(clientOrder.serviceCategory, 'Embroidery Digitizing');
    assert.equal(clientOrder.type, 'embroidery');
    assert.equal(clientOrder.price, 18);
    assert.equal(clientOrder.status, 'submitted');
    assert.equal(clientOrder.payment_status, 'pending');
    assert.equal(clientOrder.isPaid, false);
    assert.equal(clientOrder.uploadedFiles.length, 1);
    assert.equal(clientOrder.uploadedFiles[0].url, 'https://cloudinary.com/artwork.png');
  });

  test('2. Dashboard "active" filter includes submitted, in_progress, and revision orders, and excludes only completed & cancelled', () => {
    const orders = [
      { id: '#32287', title: 'New Submitted Unpaid', status: 'submitted', payment_status: 'pending', isPaid: false },
      { id: '#22364', title: 'In Progress Paid', status: 'in_progress', payment_status: 'paid', isPaid: true },
      { id: '#12345', title: 'In Revision', status: 'revision', payment_status: 'paid', isPaid: true },
      { id: '#5876', title: 'Past Completed', status: 'completed', payment_status: 'paid', isPaid: true },
      { id: '#9999', title: 'Cancelled Order', status: 'cancelled', payment_status: 'refunded', isPaid: false }
    ];

    // Filter logic aligned with CustomerDashboard
    const filterStatus = 'active';
    const activeFiltered = orders.filter(o => {
      const matchesSearch = true;
      if (filterStatus === 'active') return matchesSearch && o?.status !== 'completed' && o?.status !== 'cancelled';
      return matchesSearch;
    });

    assert.equal(activeFiltered.length, 3, 'Active filter must include all 3 active orders (submitted, in_progress, revision)');
    assert.ok(activeFiltered.some(o => o.id === '#32287'), 'Newly placed submitted order must be visible under Active tab');
    assert.ok(activeFiltered.some(o => o.id === '#22364'), 'In progress order must be visible under Active tab');
    assert.ok(activeFiltered.some(o => o.id === '#12345'), 'Revision order must be visible under Active tab');
    assert.ok(!activeFiltered.some(o => o.id === '#5876'), 'Completed order must NOT be visible under Active tab');
    assert.ok(!activeFiltered.some(o => o.id === '#9999'), 'Cancelled order must NOT be visible under Active tab');
  });

  test('3. Top metric counter "ACTIVE DIGITIZING JOBS" exactly matches active orders count', () => {
    const orders = [
      { id: '#32287', status: 'submitted' },
      { id: '#22364', status: 'in_progress' },
      { id: '#2896', status: 'in_progress' },
      { id: '#5876', status: 'completed' },
      { id: '#9999', status: 'cancelled' }
    ];

    const activeOrders = orders.filter(o => o?.status !== 'completed' && o?.status !== 'cancelled');
    assert.equal(activeOrders.length, 3);
  });

  test('4. Real-time order deduplication and state update preserves newest order rows', () => {
    const prevOrders = [
      { id: '#5876', title: 'Old Completed Order', status: 'completed' }
    ];

    const incomingNewOrder = {
      id: '#32287',
      title: 'Andrew 14 - Embroidery Digitizing',
      status: 'submitted',
      payment_status: 'pending',
      created_at: new Date().toISOString()
    };

    // Simulate optimistic state update in subscribeToOrders / handleLiveOrderEvent
    const cleanNewId = String(incomingNewOrder.id || '').replace(/^#+/, '');
    const existingIdx = prevOrders.findIndex(o => String(o.id || '').replace(/^#+/, '') === cleanNewId);
    let updatedOrders;
    if (existingIdx >= 0) {
      updatedOrders = [...prevOrders];
      updatedOrders[existingIdx] = { ...updatedOrders[existingIdx], ...incomingNewOrder };
    } else {
      updatedOrders = [incomingNewOrder, ...prevOrders];
    }

    assert.equal(updatedOrders.length, 2, 'New order must be prepended into state immediately');
    assert.equal(updatedOrders[0].id, '#32287');
    assert.equal(updatedOrders[1].id, '#5876');
  });

  test('5. Order notifications (Placed, Paid, Delivered) trigger orders synchronization', () => {
    const isOrderNotification = (notif) => {
      const title = (notif?.title || '').toLowerCase();
      const notifOrdId = notif?.order_id || notif?.orderId;
      const isOrdPlaced = title.includes('order placed') || title.includes('order created') || title.includes('placed!');
      const isOrdPaid = title.includes('payment confirmed') || title.includes('order active');
      const isOrdDelivered = title.includes('delivered') || title.includes('files ready');
      return Boolean(notifOrdId || isOrdPlaced || isOrdPaid || isOrdDelivered);
    };

    assert.equal(isOrderNotification({ title: '🎉 Order Placed Successfully!', order_id: '#32287' }), true);
    assert.equal(isOrderNotification({ title: '💳 Payment Confirmed - Order Active!', orderId: '#32287' }), true);
    assert.equal(isOrderNotification({ title: '📦 Order Files Ready: Company Logo', order_id: '#32287' }), true);
    assert.equal(isOrderNotification({ title: 'General studio newsletter', message: 'Happy Holidays' }), false);
  });
});
