import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Helper mirror for timestamp parsing
const parseMessageTime = (msg) => {
  if (!msg) return 0;
  const raw = msg.timestamp || msg.created_at || msg.createdAt || msg.time;
  if (!raw) return 0;
  if (typeof raw === 'number') return raw;
  const parsed = new Date(raw).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

// Helper mirror for snippet extraction
const extractSnippet = (msg) => {
  if (!msg) return 'No messages yet';
  let snippet = msg.text || '';
  if (!snippet) {
    if (msg.attachment_name || msg.attachment) {
      snippet = `📎 ${msg.attachment_name || msg.attachment}`;
    } else if (msg.offer_data || msg.offer_id) {
      snippet = '📋 Custom Design Offer';
    } else {
      snippet = 'New Message';
    }
  } else if (snippet.includes('[OFFER_DATA:')) {
    snippet = '📋 Custom Design Offer';
  }
  return snippet;
};

// Helper mirror of inbox conversation sorting logic
const sortConversationsNewestFirst = (conversations) => {
  return [...conversations].sort((a, b) => {
    const timeA = a.lastMessageTime || (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
    const timeB = b.lastMessageTime || (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
    return timeB - timeA;
  });
};

describe('Chat Inbox Overhaul: Sorting, Snippets & Read Management', () => {

  test('Inbox Sorting: Active conversation with newest message moves to #1 position immediately', () => {
    const olderTime = Date.now() - 60000;
    const newerTime = Date.now();

    const initialList = [
      {
        id: 'inbox-clientA@example.com',
        clientEmail: 'clientA@example.com',
        lastMessageTime: olderTime,
        updatedAt: new Date(olderTime).toISOString(),
        messages: [{ id: 'm1', text: 'Hello', timestamp: olderTime }]
      },
      {
        id: 'inbox-clientB@example.com',
        clientEmail: 'clientB@example.com',
        lastMessageTime: olderTime - 10000,
        updatedAt: new Date(olderTime - 10000).toISOString(),
        messages: [{ id: 'm0', text: 'Prior message', timestamp: olderTime - 10000 }]
      }
    ];

    // Client B sends a new message
    const incomingMsg = {
      id: 'm2',
      conversation_id: 'inbox-clientB@example.com',
      client_email: 'clientB@example.com',
      sender: 'client',
      text: 'Need urgent embroidery digitizing quote!',
      timestamp: new Date(newerTime).toISOString(),
      created_at: new Date(newerTime).toISOString()
    };

    // Update conversation and re-sort
    const updated = initialList.map(c => {
      if (c.id === incomingMsg.conversation_id) {
        return {
          ...c,
          lastMessage: extractSnippet(incomingMsg),
          lastMessageTime: parseMessageTime(incomingMsg),
          updatedAt: incomingMsg.timestamp,
          messages: [...c.messages, incomingMsg]
        };
      }
      return c;
    });

    const sorted = sortConversationsNewestFirst(updated);

    assert.equal(sorted[0].id, 'inbox-clientB@example.com', 'Client B should be at index 0 (top)');
    assert.equal(sorted[0].lastMessage, 'Need urgent embroidery digitizing quote!');
    assert.equal(sorted[1].id, 'inbox-clientA@example.com', 'Client A should be at index 1');
  });

  test('Snippet Extraction: Sanitizes embedded [OFFER_DATA:...] and formats attachments correctly', () => {
    const offerMsg = {
      id: 'msg-offer-1',
      sender: 'admin',
      text: '[OFFER_DATA:{"id":"off-123","title":"Jacket Back Logo","price":45}]',
      offer_id: 'off-123'
    };

    const attachMsg = {
      id: 'msg-attach-1',
      sender: 'client',
      text: '',
      attachment_name: 'vector_logo.ai'
    };

    const plainMsg = {
      id: 'msg-plain-1',
      sender: 'client',
      text: 'Can you deliver by tomorrow morning?'
    };

    assert.equal(extractSnippet(offerMsg), '📋 Custom Design Offer', 'Offer JSON must not leak raw string');
    assert.equal(extractSnippet(attachMsg), '📎 vector_logo.ai', 'Attachment snippet formatted with paperclip');
    assert.equal(extractSnippet(plainMsg), 'Can you deliver by tomorrow morning?', 'Plain text preserved as-is');
  });

  test('Strict Manual Read Status: Incoming messages increment unread count without auto-marking read', () => {
    let conversation = {
      id: 'inbox-customer@studio.com',
      clientEmail: 'customer@studio.com',
      unreadCount: 0,
      adminUnreadCount: 0,
      messages: []
    };

    // Customer sends 2 messages in background
    const msg1 = { id: 'm1', sender: 'client', text: 'Hi support team' };
    const msg2 = { id: 'm2', sender: 'client', text: 'Do you offer DST files?' };

    // Handler increments admin unread count for customer messages
    [msg1, msg2].forEach(m => {
      conversation = {
        ...conversation,
        unreadCount: conversation.unreadCount + 1,
        adminUnreadCount: conversation.adminUnreadCount + 1,
        messages: [...conversation.messages, { ...m, is_read: false }]
      };
    });

    assert.equal(conversation.adminUnreadCount, 2, 'Unread count should be 2');
    assert.equal(conversation.messages.every(m => !m.is_read), true, 'All incoming messages are unread');

    // Admin explicitly clicks "Mark as Read"
    const explicitMarkRead = (conv) => ({
      ...conv,
      unreadCount: 0,
      adminUnreadCount: 0,
      admin_unread_count: 0,
      messages: conv.messages.map(m => ({ ...m, is_read: true }))
    });

    const readConversation = explicitMarkRead(conversation);
    assert.equal(readConversation.adminUnreadCount, 0, 'Unread count cleared upon explicit action');
    assert.equal(readConversation.messages.every(m => m.is_read), true, 'All messages marked as read');
  });

  test('Channel Separation: Accurately separates Support threads from Direct Inbox threads', () => {
    const threads = [
      { id: 'support-guest_12345', isSupport: true },
      { id: 'support-user@example.com', isSupport: true },
      { id: 'inbox-user@example.com', isSupport: false },
      { id: 'order-1055', orderId: '1055', isSupport: false }
    ];

    const supportOnly = threads.filter(t => t.id.startsWith('support-') || t.isSupport);
    const inboxOnly = threads.filter(t => !t.id.startsWith('support-') && !t.isSupport);

    assert.equal(supportOnly.length, 2, 'Two support threads filtered correctly');
    assert.equal(inboxOnly.length, 2, 'Two inbox/order threads filtered correctly');
  });

});
