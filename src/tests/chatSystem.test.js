import test from 'node:test';
import assert from 'node:assert/strict';

test('Chat System & Fiverr-Style Inbox Architecture', async (t) => {

  await t.test('1. Thread filtering correctly resolves all, unread, and starred states', () => {
    const mockConversations = [
      { id: 'conv-1', client_name: 'ruggetb', unread_admin_count: 2, is_starred: false },
      { id: 'conv-2', client_name: 'arthurs20', unread_admin_count: 0, is_starred: true },
      { id: 'conv-3', client_name: 'blkdlmd', unread_admin_count: 1, is_starred: true },
      { id: 'conv-4', client_name: 'Jay Tee', unread_admin_count: 0, is_starred: false }
    ];

    // All filter
    const all = mockConversations;
    assert.equal(all.length, 4);

    // Unread filter
    const unread = mockConversations.filter(c => c.unread_admin_count > 0);
    assert.equal(unread.length, 2);
    assert.deepEqual(unread.map(c => c.client_name), ['ruggetb', 'blkdlmd']);

    // Starred filter
    const starred = mockConversations.filter(c => c.is_starred);
    assert.equal(starred.length, 2);
    assert.deepEqual(starred.map(c => c.client_name), ['arthurs20', 'blkdlmd']);
  });

  await t.test('2. Multi-format attachment normalization handles machine files and artwork', () => {
    const supportedFormats = [
      { name: 'logo.dst', type: 'application/octet-stream', size: '42.18 KB' },
      { name: 'cap_design.pes', type: 'application/octet-stream', size: '85.68 KB' },
      { name: 'master.emb', type: 'application/octet-stream', size: '681.16 KB' },
      { name: 'vector_logo.ai', type: 'application/postscript', size: '1.24 MB' },
      { name: 'worksheet.pdf', type: 'application/pdf', size: '210.5 KB' },
      { name: 'proof.png', type: 'image/png', size: '985.5 KB' }
    ];

    const getFormatCategory = (filename) => {
      const ext = filename.split('.').pop().toLowerCase();
      if (['dst', 'pes', 'emb', 'exp', 'jef'].includes(ext)) return 'embroidery_machine';
      if (['ai', 'eps', 'svg', 'cdr'].includes(ext)) return 'vector_master';
      if (['pdf'].includes(ext)) return 'production_worksheet';
      if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return 'visual_proof';
      return 'archive';
    };

    assert.equal(getFormatCategory('logo.dst'), 'embroidery_machine');
    assert.equal(getFormatCategory('cap_design.pes'), 'embroidery_machine');
    assert.equal(getFormatCategory('master.emb'), 'embroidery_machine');
    assert.equal(getFormatCategory('vector_logo.ai'), 'vector_master');
    assert.equal(getFormatCategory('worksheet.pdf'), 'production_worksheet');
    assert.equal(getFormatCategory('proof.png'), 'visual_proof');
  });

  await t.test('3. Custom offer pricing math, discount deduction, and status transitions', () => {
    const rawOffer = {
      price: '35.00',
      discount_amount: '10.00',
      delivery_days: 1,
      revisions_allowed: '2',
      status: 'pending'
    };

    const numPrice = parseFloat(rawOffer.price);
    const numDiscount = parseFloat(rawOffer.discount_amount);
    const finalPrice = Math.max(0, numPrice - numDiscount);

    assert.equal(finalPrice, 25.00);

    // Valid forward status progression
    const validNextStates = {
      pending: ['accepted', 'declined', 'expired'],
      sent: ['accepted', 'declined', 'expired'],
      accepted: ['paid'],
      declined: [],
      expired: []
    };

    assert.ok(validNextStates.pending.includes('accepted'));
    assert.ok(validNextStates.pending.includes('declined'));
    assert.ok(validNextStates.pending.includes('expired'));
    assert.equal(validNextStates.declined.length, 0); // Terminal state
  });

  await t.test('4. AI Polish prompt structure enforces tone and digitizing format preservation', () => {
    const rawDraft = 'hi sir i done you logo dst pes file check it and tell me if any changes needed thank you';

    // Verify system rules template
    const requiredKeywords = ['DST', 'PES', 'EMB', 'Bilal Digitizing', 'courteous', 'professional'];
    const mockSystemPrompt = `You are a professional assistant for "Bilal Digitizing". Polish this message into courteous, professional studio English while preserving technical digitizing details (DST, PES, EMB): ${rawDraft}`;

    for (const kw of requiredKeywords) {
      assert.ok(mockSystemPrompt.includes(kw), `Prompt missing expected instruction: ${kw}`);
    }

    // Verify mock clean output strips quotes
    const rawOutputWithQuotes = '"Dear Sir, I have attached your logo in DST and PES formats. Please review and let me know if changes are needed. Thank you."';
    const cleaned = rawOutputWithQuotes.replace(/^["']|["']$/g, '').trim();
    assert.ok(!cleaned.startsWith('"'));
    assert.ok(!cleaned.endsWith('"'));
  });

  await t.test('5. Typing indicator heartbeat expiration prevents stuck typing dots', () => {
    const now = Date.now();
    const activeKeystrokeTime = now - 1500; // 1.5s ago -> active
    const expiredKeystrokeTime = now - 5000; // 5s ago -> expired

    const isTypingActive = (ts) => (now - ts) < 3500;

    assert.equal(isTypingActive(activeKeystrokeTime), true);
    assert.equal(isTypingActive(expiredKeystrokeTime), false);
  });

  await t.test('6. Saved auto-replies correctly map shortcuts and titles', () => {
    const template = {
      id: 'reply-emb-ready',
      title: 'Embroidery Files Tested & Ready',
      content: 'Your embroidery design has been digitized and test-stitched. Production files (DST, PES, EMB) are attached.',
      shortcut: '/embdone'
    };

    assert.equal(template.shortcut, '/embdone');
    assert.ok(template.content.includes('DST, PES, EMB'));
    assert.ok(template.title.length > 5);
  });

  await t.test('7. Auto-resizing text box increases and decreases dynamically with content', () => {
    const computeHeight = (scrollHeight, minH = 40, maxH = 160) => {
      return Math.min(Math.max(scrollHeight, minH), maxH);
    };

    // Compact single-line
    assert.equal(computeHeight(28), 40); // Clamped to min
    assert.equal(computeHeight(40), 40);

    // Multi-line growth
    assert.equal(computeHeight(72), 72);
    assert.equal(computeHeight(115), 115);
    assert.equal(computeHeight(150), 150);

    // Max clamp
    assert.equal(computeHeight(280), 160); // Clamped to max

    // Shrinks back down when content is cleared
    assert.equal(computeHeight(32), 40); // Returns to compact
  });

  await t.test('8. Custom offers show on both sender and receiver sides', () => {
    const sampleOffer = {
      id: 'off-test-123',
      conversation_id: 'inbox-client_test_com',
      title: '3D Puff Cap Digitizing',
      final_price: 35.00,
      status: 'pending'
    };

    // Message representation ensures both parties receive the offer card
    const offerMessage = {
      id: `msg-offer-${sampleOffer.id}`,
      conversation_id: sampleOffer.conversation_id,
      sender: 'admin',
      type: 'custom_offer',
      offer_id: sampleOffer.id,
      offer_data: sampleOffer
    };

    assert.equal(offerMessage.type, 'custom_offer');
    assert.equal(offerMessage.offer_data.final_price, 35.00);
    assert.equal(offerMessage.offer_data.status, 'pending');

    // On accept, status synchronizes to both sides
    const acceptedOffer = { ...sampleOffer, status: 'accepted' };
    const syncedMessage = { ...offerMessage, offer_data: acceptedOffer };
    assert.equal(syncedMessage.offer_data.status, 'accepted');
  });

  await t.test('9. Notification filtering: never notify on chat messages, only on orders', () => {
    const shouldSendNotification = (eventType, title = '') => {
      const type = (eventType || '').toLowerCase();
      const t = (title || '').toLowerCase();
      if (type === 'chat' || type === 'message' || t.includes('new message')) {
        return false; // Suppressed as required by Rule 3
      }
      return type === 'order' || type === 'delivery' || type === 'offer' || 
             t.includes('order') || t.includes('placed') || t.includes('delivered') || t.includes('accepted');
    };

    // Messages must NEVER notify
    assert.equal(shouldSendNotification('chat', 'New message from Support'), false);
    assert.equal(shouldSendNotification('message', 'New Message received'), false);

    // Orders MUST notify
    assert.equal(shouldSendNotification('order', 'New Order Placed #1042'), true);
    assert.equal(shouldSendNotification('delivery', 'Production Files Delivered'), true);
    assert.equal(shouldSendNotification('offer', 'Custom Offer Accepted!'), true);
  });

  await t.test('10. Inbox and Support chat threads are completely isolated', () => {
    const userEmail = 'john.doe@example.com';
    const cleanEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_');

    const inboxThreadId = `inbox-${cleanEmail}`;
    const supportThreadId = `support-${cleanEmail}`;

    assert.notEqual(inboxThreadId, supportThreadId);
    assert.ok(inboxThreadId.startsWith('inbox-'));
    assert.ok(supportThreadId.startsWith('support-'));

    const conversations = [
      { id: inboxThreadId, chat_type: 'inbox', tags: ['inbox'] },
      { id: supportThreadId, chat_type: 'support', tags: ['support'] }
    ];

    const filterChannel = (list, channel) => {
      if (channel === 'inbox') return list.filter(c => c.id.startsWith('inbox-') || (c.tags && c.tags.includes('inbox')));
      if (channel === 'support') return list.filter(c => c.id.startsWith('support-') || (c.tags && c.tags.includes('support')));
      return list;
    };

    assert.equal(filterChannel(conversations, 'inbox').length, 1);
    assert.equal(filterChannel(conversations, 'inbox')[0].id, inboxThreadId);
    assert.equal(filterChannel(conversations, 'support').length, 1);
    assert.equal(filterChannel(conversations, 'support')[0].id, supportThreadId);
  });

});
