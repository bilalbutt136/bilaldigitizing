import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Helper mirroring extractAndHydrateOffer from app/api/messages/route.js
function extractAndHydrateOffer(m, offersMap = new Map()) {
  let offer = m.offer_data || m.offer || m.metadata?.offer || m.metadata?.offer_data;
  if (typeof offer === 'string') {
    try { offer = JSON.parse(offer); } catch {}
  }

  if (!offer && m.text && typeof m.text === 'string' && m.text.includes('[OFFER_DATA:')) {
    try {
      const match = m.text.match(/\[OFFER_DATA:(.*?)\]/s);
      if (match && match[1]) {
        offer = JSON.parse(match[1]);
      }
    } catch {}
  }

  if (!offer && m.attachment && typeof m.attachment === 'string' && m.attachment.trim().startsWith('{') && (m.attachment.includes('"title"') || m.attachment.includes('"price"'))) {
    try {
      offer = JSON.parse(m.attachment);
    } catch {}
  }

  if (!offer && (m.type === 'custom_offer' || m.type === 'offer' || m.offer_id || (m.text && m.text.includes('Custom Offer:')))) {
    const rawText = m.text || '';
    const titleMatch = rawText.match(/Custom Offer:\s*([^(]+)/i);
    const priceMatch = rawText.match(/\(\$([0-9.]+)\)/);
    const parsedTitle = titleMatch ? titleMatch[1].trim() : (m.metadata?.title || 'Custom Design Offer');
    const parsedPrice = priceMatch ? parseFloat(priceMatch[1]) : (parseFloat(m.metadata?.price) || 25.00);

    offer = {
      id: m.offer_id || m.metadata?.id || m.metadata?.offer_id || `off-${m.id || Date.now()}`,
      title: parsedTitle,
      description: m.metadata?.description || 'Production-ready embroidery or vector artwork files.',
      service_type: m.metadata?.service_type || 'Embroidery Digitizing',
      price: parsedPrice,
      final_price: parsedPrice,
      discount_amount: 0,
      delivery_time_text: m.metadata?.delivery_time_text || '1 Day',
      delivery_days: parseInt(m.metadata?.delivery_days, 10) || 1,
      revisions_allowed: String(m.metadata?.revisions || m.metadata?.revisions_allowed || '2'),
      status: m.metadata?.status || 'pending',
      expires_at: m.metadata?.expires_at || new Date(Date.now() + 86400000).toISOString()
    };
  }

  if (offer) {
    const offerId = offer.id || m.offer_id;
    if (offerId && offersMap.has(offerId)) {
      const dbOffer = offersMap.get(offerId);
      offer = { ...offer, ...dbOffer };
    }
    if (offer.status === 'pending' && offer.expires_at && new Date(offer.expires_at).getTime() < Date.now()) {
      offer.status = 'expired';
    }
    return {
      ...m,
      offer_id: offer.id || m.offer_id,
      offer_data: offer,
      offer: offer
    };
  }

  return m;
}

// Helper mirroring client email resolution from conversation ID
function resolveClientEmail(conversationId, explicitEmail) {
  let email = (explicitEmail || '').trim().toLowerCase();
  if (email && email.includes('@')) return email;
  if (!conversationId) return '';

  const conv = String(conversationId).trim();
  if (conv.startsWith('inbox-')) {
    const candidate = conv.replace(/^inbox-/, '').trim().toLowerCase();
    if (candidate.includes('@')) return candidate;
  }
  if (conv.startsWith('support-')) {
    const candidate = conv.replace(/^support-/, '').trim().toLowerCase();
    if (candidate.includes('@')) return candidate;
  }
  if (conv.startsWith('direct-')) {
    const candidate = conv.replace(/^direct-/, '').trim().toLowerCase();
    if (candidate.includes('@')) return candidate;
  }
  if (conv.startsWith('thread-') || conv.startsWith('thread_')) {
    const candidate = conv.replace(/^thread[-_]/, '').trim().toLowerCase();
    if (candidate.includes('@')) return candidate;
  }
  if (conv.includes('@')) {
    const match = conv.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (match) return match[0].toLowerCase();
  }
  return '';
}

// Helper validating safe UUID for Supabase orders user_id column
function getSafeUserId(userId) {
  const isUuid = userId && typeof userId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
  return isUuid ? userId : null;
}

// Helper formatting order insertion payload to protect against missing schema columns
function buildSafeOrderPayload(offer, userId) {
  const safeUserId = getSafeUserId(userId);
  const turnaroundText = offer.delivery_time_text || `${offer.delivery_days || 1} Days`;
  const revisionsCount = offer.revisions_allowed || '2';

  const notesPayload = JSON.stringify({
    custom_offer_id: offer.id,
    turnaround_time: turnaroundText,
    delivery_days: offer.delivery_days || 1,
    revisions_allowed: revisionsCount,
    service_type: offer.service_type || 'Embroidery Digitizing',
    offer_title: offer.title,
    accepted_at: new Date().toISOString()
  });

  return {
    user_id: safeUserId,
    client_name: offer.client_name || 'Customer',
    client_email: offer.client_email,
    title: offer.title,
    description: offer.description,
    category: offer.service_type || 'Embroidery Digitizing',
    price: offer.final_price ?? offer.price,
    total_amount: offer.final_price ?? offer.price,
    status: 'pending',
    payment_status: 'unpaid',
    notes: notesPayload
  };
}

describe('Custom Offer Flow & Data Integrity', () => {

  test('extractAndHydrateOffer extracts offer from embedded [OFFER_DATA:...] in message text', () => {
    const offerPayload = {
      id: 'off-12345',
      title: 'Digitizing DST PES',
      price: 35.00,
      status: 'pending'
    };
    const rawMessage = {
      id: 'msg-999',
      sender: 'admin',
      text: `📋 Custom Offer: Digitizing DST PES ($35.00)\nDelivery: 1 Day\n[OFFER_DATA:${JSON.stringify(offerPayload)}]`,
      offer_data: null,
      offer_id: null
    };

    const hydrated = extractAndHydrateOffer(rawMessage);
    assert.ok(hydrated.offer_data);
    assert.strictEqual(hydrated.offer_id, 'off-12345');
    assert.strictEqual(hydrated.offer_data.title, 'Digitizing DST PES');
    assert.strictEqual(hydrated.offer_data.price, 35.00);
    assert.strictEqual(hydrated.offer_data.status, 'pending');
  });

  test('extractAndHydrateOffer overrides message status with authoritative database status', () => {
    const offersMap = new Map([
      ['off-555', { id: 'off-555', status: 'accepted', order_id: 'ord-888' }]
    ]);

    const staleMessage = {
      id: 'msg-1',
      sender: 'admin',
      text: 'Custom Offer: Cap Logo ($25.00)',
      offer_id: 'off-555',
      offer_data: { id: 'off-555', status: 'pending', price: 25.00 }
    };

    const hydrated = extractAndHydrateOffer(staleMessage, offersMap);
    assert.strictEqual(hydrated.offer_data.status, 'accepted');
    assert.strictEqual(hydrated.offer_data.order_id, 'ord-888');
  });

  test('extractAndHydrateOffer marks pending offer as expired if past expires_at', () => {
    const expiredMessage = {
      id: 'msg-2',
      sender: 'admin',
      offer_id: 'off-exp-1',
      offer_data: {
        id: 'off-exp-1',
        status: 'pending',
        expires_at: new Date(Date.now() - 10000).toISOString()
      }
    };

    const hydrated = extractAndHydrateOffer(expiredMessage);
    assert.strictEqual(hydrated.offer_data.status, 'expired');
  });

  test('resolveClientEmail extracts email accurately from various conversation ID formats', () => {
    assert.strictEqual(resolveClientEmail('inbox-john.doe@test.com'), 'john.doe@test.com');
    assert.strictEqual(resolveClientEmail('support-SARAH_J@company.org'), 'sarah_j@company.org');
    assert.strictEqual(resolveClientEmail('direct-client123@gmail.com'), 'client123@gmail.com');
    assert.strictEqual(resolveClientEmail('thread_mike@domain.co.uk'), 'mike@domain.co.uk');
    assert.strictEqual(resolveClientEmail('order-101', 'custom@test.com'), 'custom@test.com');
    assert.strictEqual(resolveClientEmail('general-support', ''), '');
  });

  test('buildSafeOrderPayload sets valid UUID or nulls invalid user_id to prevent Postgres errors', () => {
    const offer = {
      id: 'off-777',
      title: 'Vector conversion',
      description: 'Convert SVG',
      service_type: 'Vector Artwork',
      price: 20.00,
      final_price: 20.00,
      client_email: 'buyer@test.com',
      delivery_time_text: '24 Hours',
      revisions_allowed: '3'
    };

    // Case 1: Non-UUID user_id (e.g. numeric ID, Google sub, or guest string)
    const payloadInvalidUuid = buildSafeOrderPayload(offer, 'google-oauth2|123456');
    assert.strictEqual(payloadInvalidUuid.user_id, null);
    assert.strictEqual(payloadInvalidUuid.status, 'pending');
    assert.strictEqual(payloadInvalidUuid.payment_status, 'unpaid');
    const notes1 = JSON.parse(payloadInvalidUuid.notes);
    assert.strictEqual(notes1.turnaround_time, '24 Hours');
    assert.strictEqual(notes1.revisions_allowed, '3');

    // Case 2: Valid UUID user_id
    const validUuid = 'c3a14e9f-89bc-4d89-9e87-6e3e15df3892';
    const payloadValidUuid = buildSafeOrderPayload(offer, validUuid);
    assert.strictEqual(payloadValidUuid.user_id, validUuid);
  });

  test('updating serialized text keeps [OFFER_DATA:...] synchronized when status changes', () => {
    const originalOffer = { id: 'off-1', status: 'pending', price: 25.00 };
    const originalText = `📋 Custom Offer: Logo ($25.00)\n[OFFER_DATA:${JSON.stringify(originalOffer)}]`;

    const updatedOffer = { ...originalOffer, status: 'accepted', order_id: 'ord-1001' };
    const updatedText = originalText.replace(/\[OFFER_DATA:(.*?)\]/, `[OFFER_DATA:${JSON.stringify(updatedOffer)}]`);

    assert.ok(updatedText.includes('"status":"accepted"'));
    assert.ok(updatedText.includes('"order_id":"ord-1001"'));

    const parsed = JSON.parse(updatedText.match(/\[OFFER_DATA:(.*?)\]/)[1]);
    assert.strictEqual(parsed.status, 'accepted');
    assert.strictEqual(parsed.order_id, 'ord-1001');
  });

});
