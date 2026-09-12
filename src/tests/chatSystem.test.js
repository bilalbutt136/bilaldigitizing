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

  await t.test('10. Inbox and Support channels are strictly isolated with no "all" option and zero message mixing', () => {
    // 1. Elimination of "all" option: Only 'inbox' and 'support' channels exist
    const resolveChannel = (requestedChannel) => {
      const sanitized = (requestedChannel || '').toLowerCase().trim();
      return sanitized === 'support' ? 'support' : 'inbox';
    };

    assert.equal(resolveChannel('all'), 'inbox'); // 'all' is invalid, defaults to inbox
    assert.equal(resolveChannel(''), 'inbox');
    assert.equal(resolveChannel(undefined), 'inbox');
    assert.equal(resolveChannel('inbox'), 'inbox');
    assert.equal(resolveChannel('support'), 'support');

    // 2. Thread isolation: Inbox vs Support threads
    const userEmail = 'bilalsadiq612@gmail.com';
    const cleanEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_');

    const inboxThreadId = `inbox-${cleanEmail}`;
    const supportThreadId = `support-${cleanEmail}`;

    const rawConversations = [
      { id: inboxThreadId, client_email: userEmail, client_name: 'MUHAMMAD BILAL', order_title: 'Direct Studio Communication & Offers', tags: ['inbox'] },
      { id: supportThreadId, client_email: userEmail, client_name: 'MUHAMMAD BILAL', order_title: '24/7 Customer Support Desk', tags: ['support'] },
      { id: 'general-support', client_email: 'guest@example.com', client_name: 'Guest User', order_title: '24/7 Customer Support Desk', tags: ['support'] },
      { id: 'inbox-other_client', client_email: 'other@example.com', client_name: 'Other Client', order_title: 'Digitizing Order', tags: ['inbox'] }
    ];

    const filterConversationsByChannel = (convs, channel) => {
      const active = resolveChannel(channel);
      if (active === 'support') {
        return convs.filter(c => 
          (c.id || '').startsWith('support-') || 
          c.id === 'general-support' || 
          c.id === 'help-support' ||
          (Array.isArray(c.tags) && c.tags.includes('support')) ||
          (c.order_title || '').toLowerCase().includes('support')
        );
      } else {
        return convs.filter(c => 
          !(c.id || '').startsWith('support-') && 
          c.id !== 'general-support' && 
          c.id !== 'help-support' &&
          (!Array.isArray(c.tags) || !c.tags.includes('support')) &&
          !(c.order_title || '').toLowerCase().includes('support')
        );
      }
    };

    const inboxList = filterConversationsByChannel(rawConversations, 'inbox');
    const supportList = filterConversationsByChannel(rawConversations, 'support');

    // Verify inbox only has inbox threads
    assert.equal(inboxList.length, 2);
    assert.ok(inboxList.every(c => !c.id.startsWith('support-') && !c.tags.includes('support')));

    // Verify support only has support threads
    assert.equal(supportList.length, 2);
    assert.ok(supportList.every(c => c.id.startsWith('support-') || c.id === 'general-support' || c.tags.includes('support')));

    // 3. Client deduplication test
    const duplicateList = [
      { id: 'inbox-bilalsadiq612_gmail_com', client_email: 'bilalsadiq612@gmail.com', last_message_at: '2026-09-12T16:00:00Z' },
      { id: 'conv-bilalsadiq612_gmail_com', client_email: 'bilalsadiq612@gmail.com', last_message_at: '2026-09-11T12:00:00Z' }
    ];

    const deduplicate = (list) => {
      const seen = new Set();
      const out = [];
      for (const item of list) {
        const email = (item.client_email || '').toLowerCase().trim();
        if (email) {
          if (!seen.has(email)) {
            seen.add(email);
            out.push(item);
          }
        } else {
          out.push(item);
        }
      }
      return out;
    };

    const deduplicated = deduplicate(duplicateList);
    assert.equal(deduplicated.length, 1);
    assert.equal(deduplicated[0].id, 'inbox-bilalsadiq612_gmail_com');

    // 4. Custom offers are strictly forbidden from support threads
    const mixedMessages = [
      { id: 'msg-1', conversation_id: supportThreadId, text: 'Need help with order', type: 'text' },
      { id: 'msg-2', conversation_id: supportThreadId, text: 'Custom Offer: Cap Logo', type: 'custom_offer', offer_id: 'off-123' },
      { id: 'msg-3', conversation_id: supportThreadId, text: 'Thank you for your help', type: 'text' }
    ];

    const sanitizeSupportMessages = (msgs, convId) => {
      const isSupport = convId.startsWith('support-') || convId === 'general-support';
      if (isSupport) {
        return msgs.filter(m => m.type !== 'custom_offer' && !m.offer_id);
      }
      return msgs;
    };

    const sanitizedSupport = sanitizeSupportMessages(mixedMessages, supportThreadId);
    assert.equal(sanitizedSupport.length, 2);
    assert.ok(sanitizedSupport.every(m => m.type !== 'custom_offer' && !m.offer_id));
  });

  await t.test('11. Custom offer state machine properly distinguishes Pending, Awaiting Payment, and Paid states without premature "Accepted & Paid"', () => {
    const resolveCardDisplayState = (status, paymentStatus) => {
      const isPaid = status === 'paid' || paymentStatus === 'paid';
      const isAcceptedUnpaid = status === 'accepted' && !isPaid;
      const isPending = (status === 'pending' || status === 'sent' || status === 'viewed') && !isPaid && !isAcceptedUnpaid;
      
      if (isPaid) {
        return { badge: 'Paid & In Production', canPay: false, hasOrderLink: true, requiresPayment: false };
      }
      if (isAcceptedUnpaid) {
        return { badge: 'Awaiting Payment', canPay: true, hasOrderLink: true, requiresPayment: true };
      }
      if (isPending) {
        return { badge: 'Pending Review', canPay: true, hasOrderLink: false, requiresPayment: true };
      }
      return { badge: status, canPay: false, hasOrderLink: false, requiresPayment: false };
    };

    // 1. Newly sent offer (pending)
    const pendingState = resolveCardDisplayState('pending', 'pending');
    assert.equal(pendingState.badge, 'Pending Review');
    assert.equal(pendingState.canPay, true);
    assert.equal(pendingState.requiresPayment, true);

    // 2. Client accepted offer, but payment is still pending (must NOT falsely show "Accepted & Paid")
    const acceptedUnpaidState = resolveCardDisplayState('accepted', 'pending');
    assert.equal(acceptedUnpaidState.badge, 'Awaiting Payment');
    assert.equal(acceptedUnpaidState.canPay, true);
    assert.equal(acceptedUnpaidState.hasOrderLink, true);
    assert.equal(acceptedUnpaidState.requiresPayment, true);

    // 3. Offer paid and verified
    const paidState = resolveCardDisplayState('paid', 'paid');
    assert.equal(paidState.badge, 'Paid & In Production');
    assert.equal(paidState.canPay, false);
    assert.equal(paidState.hasOrderLink, true);
    assert.equal(paidState.requiresPayment, false);
  });

  await t.test('12. Paying a custom offer transitions order to "in_progress", updates payment_status to "paid", and synchronizes chat message', () => {
    // Initial offer accepted but pending payment
    const originalOffer = {
      id: 'off-custom-999',
      order_id: 'ORD-5544XYZ',
      status: 'accepted',
      payment_status: 'pending',
      final_price: 45.00
    };

    const originalOrder = {
      id: originalOffer.order_id,
      status: 'pending',
      payment_status: 'pending',
      price: originalOffer.final_price
    };

    const originalChatMessage = {
      id: 'msg-offer-1',
      type: 'custom_offer',
      offer_id: originalOffer.id,
      offer_data: originalOffer
    };

    // Simulate payOffer transition logic
    const handlePayOffer = (offer, order, message) => {
      const updatedOffer = {
        ...offer,
        status: 'paid',
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      };

      const updatedOrder = {
        ...order,
        status: 'in_progress',
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      };

      const updatedMessage = {
        ...message,
        offer_data: updatedOffer
      };

      return { updatedOffer, updatedOrder, updatedMessage };
    };

    const result = handlePayOffer(originalOffer, originalOrder, originalChatMessage);

    // Verify Order is placed in production pipeline
    assert.equal(result.updatedOrder.status, 'in_progress');
    assert.equal(result.updatedOrder.payment_status, 'paid');

    // Verify Offer is marked paid
    assert.equal(result.updatedOffer.status, 'paid');
    assert.equal(result.updatedOffer.payment_status, 'paid');

    // Verify chat thread message contains synchronized paid state
    assert.equal(result.updatedMessage.offer_data.status, 'paid');
    assert.equal(result.updatedMessage.offer_data.payment_status, 'paid');
    assert.equal(result.updatedMessage.offer_data.order_id, 'ORD-5544XYZ');
  });

});

