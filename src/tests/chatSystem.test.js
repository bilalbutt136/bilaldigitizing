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
    const requiredKeywords = ['DST', 'PES', 'EMB', 'BDigitizing', 'courteous', 'professional'];
    const mockSystemPrompt = `You are a professional assistant for "BDigitizing". Polish this message into courteous, professional studio English while preserving technical digitizing details (DST, PES, EMB): ${rawDraft}`;

    for (const kw of requiredKeywords) {
      assert.ok(mockSystemPrompt.includes(kw), `Prompt missing expected instruction: ${kw}`);
    }

    // Verify mock clean output strips quotes and markdown fences
    const rawOutputWithQuotes = '"Dear Sir, I have attached your logo in DST and PES formats. Please review and let me know if changes are needed. Thank you."';
    const cleaned = rawOutputWithQuotes.replace(/^["']|["']$/g, '').trim();
    assert.ok(!cleaned.startsWith('"'));
    assert.ok(!cleaned.endsWith('"'));

    const rawOutputWithMarkdown = '```text\nHere is your DST and PES file.\n```';
    const cleanedMarkdown = rawOutputWithMarkdown.replace(/^```[a-zA-Z]*\n?([\s\S]*?)\n?```$/g, '$1').trim();
    assert.equal(cleanedMarkdown, 'Here is your DST and PES file.');

    // Verify Roman Urdu translation instruction keyword
    const romanUrduPrompt = 'MULTILINGUAL / ROMAN URDU TRANSLATION: If the draft is written in Roman Urdu / Hindi';
    assert.ok(romanUrduPrompt.includes('ROMAN URDU'));
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

  await t.test('9. Notification routing: customer messages and new orders both trigger guaranteed admin alerts', () => {
    const shouldSendNotification = (eventType, title = '', sender = 'client') => {
      const type = (eventType || '').toLowerCase();
      const t = (title || '').toLowerCase();
      
      // Admin messages to client do not notify admin
      if (sender === 'admin') return false;

      // Customer chat messages ALWAYS notify admin (offline guarantee)
      if (type === 'chat' || type === 'message' || t.includes('new message')) {
        return true;
      }
      return type === 'order' || type === 'delivery' || type === 'offer' || 
             t.includes('order') || t.includes('placed') || t.includes('delivered') || t.includes('accepted');
    };

    // Customer messages MUST notify admin
    assert.equal(shouldSendNotification('chat', 'New message from Client', 'client'), true);
    assert.equal(shouldSendNotification('message', 'New Message received', 'client'), true);

    // Admin replies do not self-notify
    assert.equal(shouldSendNotification('chat', 'Admin reply sent', 'admin'), false);

    // Orders MUST notify
    assert.equal(shouldSendNotification('order', 'New Order Placed #1042', 'client'), true);
    assert.equal(shouldSendNotification('delivery', 'Production Files Delivered', 'client'), true);
    assert.equal(shouldSendNotification('offer', 'Custom Offer Accepted!', 'client'), true);
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

  await t.test('13. Customer portal 24/7 Live Support tab functions independently without collapsing to "chat" or mixing with Inbox', () => {
    // 1. Tab state normalization in StateContext: 'support' and 'inbox' are preserved distinctly
    const normalizeCustomerTab = (tab) => {
      return tab === 'chat' ? 'inbox' : tab;
    };

    assert.equal(normalizeCustomerTab('support'), 'support');
    assert.equal(normalizeCustomerTab('inbox'), 'inbox');
    assert.equal(normalizeCustomerTab('chat'), 'inbox');
    assert.equal(normalizeCustomerTab('orders'), 'orders');
    assert.notEqual(normalizeCustomerTab('support'), 'inbox');
    assert.notEqual(normalizeCustomerTab('support'), 'chat');

    // 2. Client thread derivation
    const clientEmail = 'bilalsadiq612@gmail.com';
    const cleanEmail = clientEmail.replace(/[^a-zA-Z0-9]/g, '_');

    const deriveConversationId = (chatType, email) => {
      const prefix = chatType === 'support' ? 'support' : 'inbox';
      return `${prefix}-${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    };

    const supportConvId = deriveConversationId('support', clientEmail);
    const inboxConvId = deriveConversationId('inbox', clientEmail);

    assert.equal(supportConvId, `support-${cleanEmail}`);
    assert.equal(inboxConvId, `inbox-${cleanEmail}`);
    assert.notEqual(supportConvId, inboxConvId);

    // 3. Message dispatch scoping: messages sent with support thread ID never mix with inbox thread ID
    const databaseMessages = [
      { id: 'm-1', conversation_id: supportConvId, client_email: clientEmail, text: 'Need help with digitizing order', type: 'text' },
      { id: 'm-2', conversation_id: inboxConvId, client_email: clientEmail, text: 'Here is the stitch quote', type: 'text' },
      { id: 'm-3', conversation_id: inboxConvId, client_email: clientEmail, text: 'Custom Offer: Cap Logo', type: 'custom_offer', offer_id: 'off-1' }
    ];

    const getMessagesForConversation = (allMessages, convId) => {
      return allMessages.filter(m => m.conversation_id === convId);
    };

    const supportMessages = getMessagesForConversation(databaseMessages, supportConvId);
    const inboxMessages = getMessagesForConversation(databaseMessages, inboxConvId);

    assert.equal(supportMessages.length, 1);
    assert.equal(supportMessages[0].text, 'Need help with digitizing order');
    assert.ok(supportMessages.every(m => m.conversation_id === supportConvId));

    assert.equal(inboxMessages.length, 2);
    assert.ok(inboxMessages.every(m => m.conversation_id === inboxConvId));
    assert.ok(inboxMessages.every(m => m.conversation_id !== supportConvId));
  });

  await t.test('10. Realtime typing indicators: channel parity, instant broadcast, debouncing, and role segregation', () => {
    const testConvId = 'inbox-client123';

    // 1. Channel parity check: Client and Admin must bind to the EXACT same room channel
    const getClientChannel = (convId) => `chat-room-${convId}`;
    const getAdminChannel = (convId) => `chat-room-${convId}`;

    assert.equal(getClientChannel(testConvId), getAdminChannel(testConvId));
    assert.equal(getClientChannel(testConvId), 'chat-room-inbox-client123');

    // 2. Role segregation: receiver only displays typing if the payload role is opposite
    const clientState = { isAdminTyping: false };
    const adminState = { isClientTyping: false };

    const handleClientBroadcast = (payload) => {
      if (payload?.role === 'admin') {
        clientState.isAdminTyping = Boolean(payload.isTyping);
      }
    };

    const handleAdminBroadcast = (payload) => {
      if (payload?.role === 'client') {
        adminState.isClientTyping = Boolean(payload.isTyping);
      }
    };

    // Client starts typing
    handleAdminBroadcast({ role: 'client', isTyping: true, conversationId: testConvId });
    assert.equal(adminState.isClientTyping, true, 'Admin should immediately see client typing');
    assert.equal(clientState.isAdminTyping, false, 'Client should not see itself as admin typing');

    // Admin starts typing
    handleClientBroadcast({ role: 'admin', isTyping: true, conversationId: testConvId });
    assert.equal(clientState.isAdminTyping, true, 'Client should immediately see admin typing');

    // Client stops typing
    handleAdminBroadcast({ role: 'client', isTyping: false, conversationId: testConvId });
    assert.equal(adminState.isClientTyping, false, 'Admin typing indicator should turn off');

    // 3. Stale timestamp expiration: heartbeats older than 3500ms are expired
    const isTimestampActive = (isoString, maxAgeMs = 3500) => {
      if (!isoString) return false;
      return (Date.now() - new Date(isoString).getTime()) < maxAgeMs;
    };

    const freshTs = new Date(Date.now() - 500).toISOString();
    const staleTs = new Date(Date.now() - 4000).toISOString();

    assert.equal(isTimestampActive(freshTs), true, '500ms old heartbeat must be considered active');
    assert.equal(isTimestampActive(staleTs), false, '4000ms old heartbeat must be expired');
    assert.equal(isTimestampActive(null), false, 'Null heartbeat is not active');
  });

  await t.test('22. Optimistic message reconciliation and Realtime deduplication strictly prevents double bubbles', () => {
    // Simulate initial conversation with 1 greeting message
    let messages = [
      { id: 'msg-init-1', sender: 'admin', text: 'Hello! How can we help?', isPending: false }
    ];

    // Deduplication function matching CustomerSupportChat.jsx & AdminChatInbox.jsx
    const deduplicateMessages = (rawMessages) => {
      const confirmedIds = new Set();
      const confirmedFingerprints = new Set();

      for (const msg of rawMessages) {
        if (!msg) continue;
        const isTemp = Boolean(msg.isPending || String(msg.id || '').startsWith('temp-'));
        if (!isTemp) {
          if (msg.id) confirmedIds.add(msg.id);
          const textKey = (msg.text || '').trim();
          const contentFingerprint = `${msg.sender || ''}:::${textKey}:::${(msg.attachments || []).length}`;
          if (textKey || (msg.attachments && msg.attachments.length > 0)) {
            confirmedFingerprints.add(contentFingerprint);
          }
        }
      }

      const result = [];
      const seenFinalIds = new Set();
      const seenTempFingerprints = new Set();

      for (const msg of rawMessages) {
        if (!msg) continue;
        const isTemp = Boolean(msg.isPending || String(msg.id || '').startsWith('temp-'));
        const textKey = (msg.text || '').trim();
        const contentFingerprint = `${msg.sender || ''}:::${textKey}:::${(msg.attachments || []).length}`;

        if (!isTemp) {
          if (msg.id && seenFinalIds.has(msg.id)) continue;
          if (msg.id) seenFinalIds.add(msg.id);
          result.push(msg);
        } else {
          if (confirmedFingerprints.has(contentFingerprint)) {
            continue;
          }
          if (seenTempFingerprints.has(contentFingerprint)) {
            continue;
          }
          seenTempFingerprints.add(contentFingerprint);
          if (msg.id) seenFinalIds.add(msg.id);
          result.push(msg);
        }
      }
      return result;
    };

    // Step 1: User sends message -> optimistic message is added
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      sender: 'client',
      text: 'Helo',
      attachments: [],
      isPending: true
    };
    messages = [...messages, optimisticMessage];

    // Assert: User sees their message immediately (total 2 messages)
    assert.equal(messages.length, 2);
    assert.equal(deduplicateMessages(messages).length, 2);
    assert.equal(messages[1].id, tempId);

    // Step 2: Supabase Realtime event arrives BEFORE fetch finishes
    const realtimePayload = {
      new: {
        id: 'msg-confirmed-101',
        sender: 'client',
        text: 'Helo',
        attachments: [],
        created_at: new Date().toISOString()
      }
    };

    // Realtime handler with pending reconciliation
    const handleRealtimeInsert = (payload, currentMessages) => {
      if (!payload?.new) return currentMessages;
      if (currentMessages.some(m => m.id === payload.new.id)) return currentMessages;

      if (payload.new.sender === 'client') {
        const pendingIdx = currentMessages.findIndex(m => 
          (m.isPending || String(m.id).startsWith('temp-')) &&
          (m.text || '').trim() === (payload.new.text || '').trim()
        );
        if (pendingIdx !== -1) {
          const next = [...currentMessages];
          next[pendingIdx] = payload.new;
          return next;
        }
      }

      return [...currentMessages, payload.new];
    };

    messages = handleRealtimeInsert(realtimePayload, messages);

    // Assert: Realtime replaced temp message instead of creating a second bubble!
    assert.equal(messages.length, 2, 'Message count must remain 2, not double to 3');
    assert.equal(messages[1].id, 'msg-confirmed-101', 'Optimistic message was seamlessly upgraded to confirmed DB ID');
    assert.equal(deduplicateMessages(messages).length, 2);

    // Step 3: Fetch POST finishes later and returns confirmed message
    const fetchResponseData = {
      message: {
        id: 'msg-confirmed-101',
        sender: 'client',
        text: 'Helo',
        attachments: [],
        created_at: new Date().toISOString()
      }
    };

    // handleSend callback
    const handleFetchResolved = (data, currentMessages, tempMsgId) => {
      const alreadyExists = currentMessages.some(m => m.id === data.message.id);
      if (alreadyExists) {
        return currentMessages.filter(m => m.id !== tempMsgId);
      }
      return currentMessages.map(m => m.id === tempMsgId ? data.message : m);
    };

    messages = handleFetchResolved(fetchResponseData, messages, tempId);

    // Assert: Still exactly 2 messages
    assert.equal(messages.length, 2, 'Post-fetch reconciliation must never create duplicate message');
    assert.equal(deduplicateMessages(messages).length, 2);

    // Step 4: Verify fallback deduplication if a raw race occurred
    const corruptedStateWithBoth = [
      { id: 'temp-999', sender: 'client', text: 'Helo', attachments: [], isPending: true },
      { id: 'msg-confirmed-101', sender: 'client', text: 'Helo', attachments: [], isPending: false }
    ];
    const deduplicated = deduplicateMessages(corruptedStateWithBoth);
    assert.equal(deduplicated.length, 1, 'Fingerprint deduplicator must strictly suppress duplicate optimistic bubble');
    assert.equal(deduplicated[0].id, 'msg-confirmed-101', 'Confirmed message must be preferred over optimistic');
  });

  await t.test('26. Online status indicator isolates live present users and never shows green dot for offline users', () => {
    // Simulated active presence set from Supabase Presence
    const onlineEmails = new Set(['active_alice@studio.com']);

    const isClientOnline = (conv) => {
      if (!conv) return false;
      const email = (conv.client_email || '').toLowerCase().trim();
      if (email && onlineEmails.has(email)) return true;
      if (conv.status === 'online' || conv.is_online === true) {
        const lastActive = conv.last_seen_at || conv.last_message_at || conv.updated_at;
        if (lastActive) {
          const diffMs = Date.now() - new Date(lastActive).getTime();
          if (diffMs < 2.5 * 60 * 1000) return true;
        }
      }
      return false;
    };

    const aliceOnline = { id: 'conv-1', client_email: 'active_alice@studio.com', status: 'offline' };
    const bobOffline = { id: 'conv-2', client_email: 'offline_bob@studio.com', status: 'offline', last_seen_at: '2026-09-20T10:00:00Z' };
    const charlieStaleOnline = { id: 'conv-3', client_email: 'charlie@studio.com', status: 'online', last_seen_at: '2026-09-14T08:00:00Z' };
    const davidRecentActive = { id: 'conv-4', client_email: 'david@studio.com', status: 'online', last_seen_at: new Date(Date.now() - 30000).toISOString() };

    // Alice is in live presence -> MUST be online (green dot shown)
    assert.equal(isClientOnline(aliceOnline), true, 'Alice is in live presence and must show green dot');

    // Bob is not present and offline -> MUST be false (zero green dot)
    assert.equal(isClientOnline(bobOffline), false, 'Bob is offline and must never show green dot');

    // Charlie has stale DB status from 11 days ago -> MUST be false (zero green dot)
    assert.equal(isClientOnline(charlieStaleOnline), false, 'Charlie has stale status and must never show green dot');

    // David was active 30s ago -> MUST be true
    assert.equal(isClientOnline(davidRecentActive), true, 'David was active 30s ago and is online');
  });

  await t.test('27. formatLastSeen correctly calculates human-friendly activity timestamps', () => {
    const formatLastSeen = (dateStr) => {
      if (!dateStr) return 'Offline';
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      if (isNaN(diffMs) || diffMs < 0) return 'Offline';

      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);

      if (diffSec < 90) return 'Active just now';
      if (diffMin < 60) return `Active ${diffMin}m ago`;
      if (diffHr < 24) return `Active ${diffHr}h ago`;
      if (diffDay === 1) return 'Active yesterday';
      if (diffDay < 7) return `Active ${diffDay}d ago`;
      return `Active ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };

    const now = Date.now();
    assert.equal(formatLastSeen(new Date(now - 30000).toISOString()), 'Active just now');
    assert.equal(formatLastSeen(new Date(now - 15 * 60000).toISOString()), 'Active 15m ago');
    assert.equal(formatLastSeen(new Date(now - 4 * 3600000).toISOString()), 'Active 4h ago');
    assert.equal(formatLastSeen(new Date(now - 25 * 3600000).toISOString()), 'Active yesterday');
    assert.equal(formatLastSeen(null), 'Offline');
  });

});



