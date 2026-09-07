import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Mirror of core isolation helpers in AdminChatInbox & services
const isSupportThread = (conv) => {
  if (!conv) return false;
  return conv.chat_type === 'support' ||
    conv.chatType === 'support' ||
    conv.isSupport === true ||
    conv.is_support === true ||
    String(conv.id || '').startsWith('support-') ||
    String(conv.channel || '').toLowerCase() === 'support';
};

const isInboxThread = (conv) => {
  return !isSupportThread(conv);
};

const matchesConversation = (targetConv, candidate) => {
  if (!targetConv || !candidate) return false;

  const targetId = String(targetConv.id || targetConv.conversation_id || '');
  const candidateId = String(candidate.id || candidate.conversation_id || '');

  // Strict check: if one is support and the other is inbox, NEVER match!
  const targetIsSupport = isSupportThread(targetConv);
  const candidateIsSupport = isSupportThread(candidate);
  if (targetIsSupport !== candidateIsSupport) {
    return false;
  }

  // Exact ID match
  if (targetId && candidateId && targetId === candidateId) {
    return true;
  }

  // Order thread check: order threads must match orderId or exact ID
  if (targetConv.orderId || candidate.orderId || targetId.startsWith('order-') || candidateId.startsWith('order-')) {
    if (targetConv.orderId && candidate.orderId && String(targetConv.orderId) === String(candidate.orderId)) {
      return true;
    }
    return false;
  }

  // Support thread check: support threads match by support ticket id or clean support email
  if (targetIsSupport) {
    const targetClean = targetId.replace('support-', '').toLowerCase().trim();
    const candidateClean = candidateId.replace('support-', '').toLowerCase().trim();
    if (targetClean && candidateClean && targetClean === candidateClean) {
      return true;
    }
    const targetEmail = String(targetConv.clientEmail || targetConv.client_email || '').toLowerCase().trim();
    const candidateEmail = String(candidate.clientEmail || candidate.client_email || '').toLowerCase().trim();
    if (targetEmail && candidateEmail && targetEmail === candidateEmail) {
      return true;
    }
    return false;
  }

  // Inbox thread check
  const targetEmail = String(targetConv.clientEmail || targetConv.client_email || '').toLowerCase().trim();
  const candidateEmail = String(candidate.clientEmail || candidate.client_email || '').toLowerCase().trim();
  if (targetEmail && candidateEmail && targetEmail === candidateEmail) {
    return true;
  }

  return false;
};

const deduplicateThreads = (threads) => {
  const map = new Map();
  threads.forEach(t => {
    if (!t) return;
    const isSupp = isSupportThread(t);
    const prefix = isSupp ? 'support_' : 'inbox_';
    const email = (t.clientEmail || t.client_email || '').toLowerCase().trim();
    const key = t.orderId ? `${prefix}order_${t.orderId}` : (email ? `${prefix}client_${email}` : `${prefix}id_${t.id}`);
    
    if (!map.has(key)) {
      map.set(key, t);
    } else {
      const existing = map.get(key);
      const existingMsgs = existing.messages || [];
      const incomingMsgs = t.messages || [];
      const mergedMsgs = [...existingMsgs];
      incomingMsgs.forEach(m => {
        if (m && !mergedMsgs.some(em => em.id === m.id)) {
          mergedMsgs.push(m);
        }
      });
      map.set(key, {
        ...existing,
        ...t,
        messages: mergedMsgs,
        unreadCount: Math.max(existing.unreadCount || 0, t.unreadCount || 0),
        adminUnreadCount: Math.max(existing.adminUnreadCount || 0, t.adminUnreadCount || 0)
      });
    }
  });
  return Array.from(map.values());
};

describe('Chat Channel Isolation: Inbox vs Support Tabs', () => {

  test('Thread Discrimination: isSupportThread and isInboxThread correctly identify thread types', () => {
    const inboxOrderConv = { id: 'order-101', chat_type: 'inbox', orderId: '101' };
    const inboxDirectConv = { id: 'inbox-john@example.com', clientEmail: 'john@example.com', chat_type: 'inbox' };
    const supportTicketConv = { id: 'support-ticket-99', chat_type: 'support', is_support: true };
    const supportEmailConv = { id: 'support-john@example.com', clientEmail: 'john@example.com', isSupport: true };

    assert.equal(isSupportThread(inboxOrderConv), false);
    assert.equal(isInboxThread(inboxOrderConv), true);

    assert.equal(isSupportThread(inboxDirectConv), false);
    assert.equal(isInboxThread(inboxDirectConv), true);

    assert.equal(isSupportThread(supportTicketConv), true);
    assert.equal(isInboxThread(supportTicketConv), false);

    assert.equal(isSupportThread(supportEmailConv), true);
    assert.equal(isInboxThread(supportEmailConv), false);
  });

  test('Strict Thread Matching: Inbox and Support threads for the SAME client email NEVER match', () => {
    const inboxConv = {
      id: 'inbox-alex@example.com',
      clientEmail: 'alex@example.com',
      chat_type: 'inbox',
      is_support: false
    };

    const supportConv = {
      id: 'support-alex@example.com',
      clientEmail: 'alex@example.com',
      chat_type: 'support',
      is_support: true
    };

    assert.equal(matchesConversation(inboxConv, supportConv), false, 'Inbox and Support threads for alex@example.com must not match');
    assert.equal(matchesConversation(supportConv, inboxConv), false, 'Support and Inbox threads for alex@example.com must not match');
  });

  test('Thread Deduplication: Keeps separate buckets for Inbox and Support for the same client', () => {
    const threads = [
      {
        id: 'inbox-sarah@example.com',
        clientEmail: 'sarah@example.com',
        chat_type: 'inbox',
        unreadCount: 2,
        messages: [{ id: 'm-inbox-1', text: 'Where is my order?' }]
      },
      {
        id: 'support-sarah@example.com',
        clientEmail: 'sarah@example.com',
        chat_type: 'support',
        is_support: true,
        unreadCount: 1,
        messages: [{ id: 'm-supp-1', text: 'Help with billing inquiry' }]
      }
    ];

    const deduplicated = deduplicateThreads(threads);
    assert.equal(deduplicated.length, 2, 'Should keep both threads without merging them');

    const inboxThread = deduplicated.find(t => isInboxThread(t));
    const supportThread = deduplicated.find(t => isSupportThread(t));

    assert.ok(inboxThread, 'Inbox thread must exist');
    assert.ok(supportThread, 'Support thread must exist');
    assert.equal(inboxThread.messages.length, 1);
    assert.equal(inboxThread.messages[0].text, 'Where is my order?');
    assert.equal(supportThread.messages.length, 1);
    assert.equal(supportThread.messages[0].text, 'Help with billing inquiry');
  });

  test('Unread Counters: Inbox unread counts and Support unread counts are strictly isolated', () => {
    const conversations = [
      { id: 'inbox-1', chat_type: 'inbox', adminUnreadCount: 3 },
      { id: 'inbox-2', chat_type: 'inbox', adminUnreadCount: 2 },
      { id: 'support-1', chat_type: 'support', is_support: true, adminUnreadCount: 5 },
      { id: 'support-2', chat_type: 'support', is_support: true, adminUnreadCount: 1 }
    ];

    const inboxUnreadTotal = conversations
      .filter(c => isInboxThread(c))
      .reduce((sum, c) => sum + (c.adminUnreadCount || 0), 0);

    const supportUnreadTotal = conversations
      .filter(c => isSupportThread(c))
      .reduce((sum, c) => sum + (c.adminUnreadCount || 0), 0);

    assert.equal(inboxUnreadTotal, 5, 'Inbox unread total should be exactly 5');
    assert.equal(supportUnreadTotal, 6, 'Support unread total should be exactly 6');
  });

  test('Realtime Routing: Message arriving for Support does not mutate Inbox thread messages', () => {
    let state = [
      {
        id: 'inbox-user@test.com',
        clientEmail: 'user@test.com',
        chat_type: 'inbox',
        messages: [{ id: 'm1', text: 'Hello Inbox' }],
        unreadCount: 0
      },
      {
        id: 'support-user@test.com',
        clientEmail: 'user@test.com',
        chat_type: 'support',
        is_support: true,
        messages: [{ id: 'm2', text: 'Hello Support' }],
        unreadCount: 0
      }
    ];

    const incomingSupportMsg = {
      id: 'm3',
      conversation_id: 'support-user@test.com',
      client_email: 'user@test.com',
      chat_type: 'support',
      is_support: true,
      text: 'Support ticket update!'
    };

    // Simulate state update
    state = state.map(conv => {
      const match = matchesConversation(conv, {
        id: incomingSupportMsg.conversation_id,
        clientEmail: incomingSupportMsg.client_email,
        chat_type: incomingSupportMsg.chat_type,
        is_support: incomingSupportMsg.is_support
      });
      if (match) {
        return {
          ...conv,
          messages: [...conv.messages, incomingSupportMsg],
          unreadCount: (conv.unreadCount || 0) + 1
        };
      }
      return conv;
    });

    const inboxThread = state.find(c => c.id === 'inbox-user@test.com');
    const supportThread = state.find(c => c.id === 'support-user@test.com');

    assert.equal(inboxThread.messages.length, 1, 'Inbox thread must NOT receive support message');
    assert.equal(inboxThread.unreadCount, 0, 'Inbox thread unread count must remain 0');

    assert.equal(supportThread.messages.length, 2, 'Support thread must receive the message');
    assert.equal(supportThread.unreadCount, 1, 'Support thread unread count must be 1');
  });

  test('Channel Filtering: Tab views only display their respective conversations', () => {
    const allConversations = [
      { id: 'inbox-order-1', chat_type: 'inbox', title: 'Order #1' },
      { id: 'inbox-direct-2', chat_type: 'inbox', title: 'Direct Chat' },
      { id: 'support-ticket-1', chat_type: 'support', is_support: true, title: 'Support Inquiry' }
    ];

    const inboxTabList = allConversations.filter(c => isInboxThread(c));
    const supportTabList = allConversations.filter(c => isSupportThread(c));

    assert.equal(inboxTabList.length, 2);
    assert.ok(inboxTabList.every(c => c.chat_type === 'inbox'));

    assert.equal(supportTabList.length, 1);
    assert.equal(supportTabList[0].id, 'support-ticket-1');
  });

});
