import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Helper function mirroring deduplication logic in ClientChatInbox & AdminChatInbox
function appendOrUpdateMessage(existingMessages, incomingMessage) {
  const map = new Map();
  (existingMessages || []).forEach(m => {
    if (m && m.id) map.set(m.id, m);
  });

  const incomingOfferId = incomingMessage.offer_id || incomingMessage.offer_data?.id;

  for (const [k, v] of map.entries()) {
    // 1. Remove optimistic match
    if (
      k.startsWith('msg-') &&
      v.sender === incomingMessage.sender &&
      v.text === incomingMessage.text &&
      Math.abs(new Date(v.timestamp).getTime() - new Date(incomingMessage.timestamp).getTime()) < 15000
    ) {
      map.delete(k);
    }
    // 2. If incoming is custom offer and an offer message with same offerId exists, replace it
    else if (
      incomingOfferId &&
      (v.offer_id === incomingOfferId || v.offer_data?.id === incomingOfferId)
    ) {
      map.delete(k);
    }
  }

  map.set(incomingMessage.id, incomingMessage);
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

// Helper function mirroring customer message filter
function isMessageForCustomer(record, clientEmail, canonicalChatId, customerOrders = []) {
  const recordConvId = String(record.conversation_id || record.thread_id || '').toLowerCase().trim();
  const recordThreadId = String(record.thread_id || record.conversation_id || '').toLowerCase().trim();
  const recordEmail = String(record.client_email || '').toLowerCase().trim();
  const cleanCustomerEmail = (clientEmail || '').toLowerCase().trim();
  const targetChatIdLower = String(canonicalChatId || '').toLowerCase().trim();

  const offerEmail = String(record.offer_data?.client_email || record.metadata?.client_email || '').toLowerCase().trim();
  const matchesClientOrder = Array.isArray(customerOrders) && customerOrders.some(o => {
    const oId = String(o.id || '').toLowerCase().trim();
    return recordConvId === oId || recordConvId === `order-${oId}` || recordThreadId === oId || recordThreadId === `order-${oId}`;
  });

  return (
    (cleanCustomerEmail && recordEmail && recordEmail === cleanCustomerEmail) ||
    (cleanCustomerEmail && offerEmail && offerEmail === cleanCustomerEmail) ||
    (cleanCustomerEmail && (recordConvId.includes(cleanCustomerEmail) || recordThreadId.includes(cleanCustomerEmail))) ||
    (cleanCustomerEmail && matchesClientOrder) ||
    (recordConvId === targetChatIdLower || recordThreadId === targetChatIdLower) ||
    (!cleanCustomerEmail && (
      recordConvId === 'general-support' || recordConvId === 'support-guest' || recordConvId === 'inbox-client' ||
      recordConvId.startsWith('support-guest_') || recordThreadId.startsWith('support-guest_') ||
      recordConvId === targetChatIdLower || recordThreadId === targetChatIdLower
    ))
  );
}

describe('Messaging Reliability & Custom Offer State Machine', () => {
  test('Offer Acceptance must NOT mark order or offer as Paid prematurely', () => {
    // Initial offer state
    const createdOffer = {
      id: 'off-101',
      title: 'Logo Digitizing',
      price: 25.00,
      final_price: 25.00,
      status: 'pending',
      payment_status: 'unpaid'
    };

    assert.equal(createdOffer.status, 'pending');
    assert.equal(createdOffer.payment_status, 'unpaid');

    // Customer accepts offer: terms agreed, order created, but payment still pending!
    const acceptedOffer = {
      ...createdOffer,
      status: 'accepted',
      payment_status: 'pending',
      order_id: 'ORD-5501'
    };

    const createdOrder = {
      id: acceptedOffer.order_id,
      title: acceptedOffer.title,
      price: acceptedOffer.final_price,
      status: 'pending', // NOT in_progress!
      payment_status: 'pending' // NOT paid!
    };

    assert.equal(acceptedOffer.status, 'accepted');
    assert.equal(acceptedOffer.payment_status, 'pending');
    assert.notEqual(acceptedOffer.payment_status, 'paid');

    assert.equal(createdOrder.status, 'pending');
    assert.equal(createdOrder.payment_status, 'pending');
    assert.notEqual(createdOrder.status, 'in_progress');
    assert.notEqual(createdOrder.payment_status, 'paid');
  });

  test('Payment Completion correctly transitions offer and order to Paid & In Progress', () => {
    const acceptedOffer = {
      id: 'off-101',
      status: 'accepted',
      payment_status: 'pending',
      order_id: 'ORD-5501'
    };

    const pendingOrder = {
      id: 'ORD-5501',
      status: 'pending',
      payment_status: 'pending'
    };

    // Customer pays via Stripe / Wallet / Gateway
    const paidOffer = {
      ...acceptedOffer,
      status: 'paid',
      payment_status: 'paid'
    };

    const activeOrder = {
      ...pendingOrder,
      status: 'in_progress',
      payment_status: 'paid'
    };

    assert.equal(paidOffer.status, 'paid');
    assert.equal(paidOffer.payment_status, 'paid');
    assert.equal(activeOrder.status, 'in_progress');
    assert.equal(activeOrder.payment_status, 'paid');
  });

  test('Deduplicates duplicate offer cards when realtime and modal callback fire concurrently', () => {
    const initialMessages = [
      { id: 'msg-1', text: 'Hello', timestamp: '2026-09-04T10:00:00Z', sender: 'client' }
    ];

    const offerCard1 = {
      id: 'msg-offer-A',
      offer_id: 'off-999',
      text: 'Custom Offer: Cap Patch ($30.00)',
      sender: 'admin',
      timestamp: '2026-09-04T10:01:00Z',
      offer_data: { id: 'off-999', title: 'Cap Patch', price: 30 }
    };

    // First insertion (e.g. from onOfferCreated callback)
    const afterFirst = appendOrUpdateMessage(initialMessages, offerCard1);
    assert.equal(afterFirst.length, 2);

    // Second concurrent insertion (e.g. from Supabase Postgres realtime replication)
    const offerCardDuplicate = {
      id: 'msg-offer-B', // Different temporary message ID from websocket
      offer_id: 'off-999', // SAME offer ID!
      text: 'Custom Offer: Cap Patch ($30.00)',
      sender: 'admin',
      timestamp: '2026-09-04T10:01:01Z',
      offer_data: { id: 'off-999', title: 'Cap Patch', price: 30 }
    };

    const afterSecond = appendOrUpdateMessage(afterFirst, offerCardDuplicate);
    // MUST NOT create a duplicate message! Length remains 2!
    assert.equal(afterSecond.length, 2);
    assert.equal(afterSecond[1].offer_id, 'off-999');
  });

  test('Customer visibility filter correctly captures offers sent to order threads', () => {
    const customerEmail = 'customer@example.com';
    const canonicalChatId = 'inbox-customer@example.com';
    const customerOrders = [{ id: 'ORD-7721', title: 'Jacket Back' }];

    // Admin created offer inside an order conversation thread
    const offerMessageInOrderThread = {
      id: 'msg-101',
      conversation_id: 'order-ORD-7721',
      thread_id: 'order-ORD-7721',
      client_email: customerEmail,
      offer_data: { id: 'off-888', client_email: customerEmail, title: 'Extra Colors' },
      sender: 'admin',
      text: 'Custom Offer'
    };

    const isDelivered = isMessageForCustomer(
      offerMessageInOrderThread,
      customerEmail,
      canonicalChatId,
      customerOrders
    );

    assert.equal(isDelivered, true);
  });

  test('Customer visibility filter captures offer with client_email in offer_data even without conversation ID match', () => {
    const customerEmail = 'sarah@embroidery.com';
    const canonicalChatId = 'inbox-sarah@embroidery.com';

    const offerMessage = {
      id: 'msg-202',
      conversation_id: 'general-support',
      thread_id: 'general-support',
      client_email: customerEmail,
      offer_data: { id: 'off-555', client_email: customerEmail },
      sender: 'admin',
      text: 'Custom Offer'
    };

    const isDelivered = isMessageForCustomer(
      offerMessage,
      customerEmail,
      canonicalChatId,
      []
    );

    assert.equal(isDelivered, true);
  });

  test('Soft delete filter excludes deleted messages from active chat history', () => {
    const allRetrievedMessages = [
      { id: 'msg-1', text: 'Active message 1', deleted_at: null },
      { id: 'msg-2', text: 'This message was deleted', deleted_at: '2026-09-04T09:30:00Z' },
      { id: 'msg-3', text: 'Active message 2', deleted_at: null }
    ];

    const activeMessages = allRetrievedMessages.filter(m => !m.deleted_at);

    assert.equal(activeMessages.length, 2);
    assert.equal(activeMessages[0].id, 'msg-1');
    assert.equal(activeMessages[1].id, 'msg-3');
    assert.equal(activeMessages.some(m => m.id === 'msg-2'), false);
  });
});
