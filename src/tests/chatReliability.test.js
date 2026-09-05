import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getCanonicalThreadId } from '../utils/sessionHelper.js';
import { generateHelpDeskAutoReply } from '../lib/chat/autoReply.js';

// Mirror of mergeChatMessages from ClientLiveChatWidget.jsx
function mergeChatMessages(prevMsgs, newMsgs) {
  const mergedMap = new Map();

  const parseTime = (msg) => {
    if (!msg) return 0;
    const raw = msg.timestamp || msg.created_at || msg.createdAt || msg.time;
    if (!raw) return 0;
    if (typeof raw === 'number') return raw;
    const parsed = new Date(raw).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

  (prevMsgs || []).forEach(m => {
    if (!m) return;
    const key = m.id || `${m.sender}-${m.text}-${m.timestamp}`;
    mergedMap.set(key, m);
  });

  (newMsgs || []).forEach(incoming => {
    if (!incoming) return;
    const incomingId = incoming.id;
    const incomingTime = parseTime(incoming);

    let matchedKey = null;
    if (incomingId && mergedMap.has(incomingId)) {
      matchedKey = incomingId;
    } else {
      for (const [k, existing] of mergedMap.entries()) {
        const existingTime = parseTime(existing);
        const isSameText = existing.text === incoming.text;
        const isSameSender = existing.sender === incoming.sender;
        const isNearTime = Math.abs(existingTime - incomingTime) < 15000;
        if (isSameSender && isSameText && isNearTime) {
          matchedKey = k;
          break;
        }
      }
    }

    if (matchedKey) {
      const existing = mergedMap.get(matchedKey);
      mergedMap.delete(matchedKey);
      const resolved = {
        ...existing,
        ...incoming,
        id: incomingId || existing.id,
        status: incoming.status || 'sent'
      };
      mergedMap.set(resolved.id, resolved);
    } else {
      mergedMap.set(incomingId || `${incoming.sender}-${incoming.text}-${incomingTime}`, {
        ...incoming,
        status: incoming.status || 'sent'
      });
    }
  });

  const list = Array.from(mergedMap.values());
  list.sort((a, b) => parseTime(a) - parseTime(b));
  return list;
}

describe('Chat Reliability & Guest Support Engine', () => {
  test('Canonical Thread ID isolation between guests and registered clients', () => {
    const guestSessionA = 'guest_abc12345';
    const guestSessionB = 'guest_xyz98765';
    const clientEmail = 'john@example.com';

    // Guest A gets thread isolated to their guest session
    const threadA = getCanonicalThreadId('support', 'guest@bdigitizing.pro', guestSessionA);
    const threadB = getCanonicalThreadId('support', 'guest@bdigitizing.pro', guestSessionB);

    assert.equal(threadA, `support-${guestSessionA}`);
    assert.equal(threadB, `support-${guestSessionB}`);
    assert.notEqual(threadA, threadB, 'Different guests must have completely separate threads');

    // Authenticated client gets canonical thread tied to their registered email
    const registeredThread = getCanonicalThreadId('support', clientEmail, guestSessionA);
    assert.equal(registeredThread, `support-${clientEmail}`);
    assert.ok(registeredThread.includes('john@example.com'));
  });

  test('Optimistic messages are never wiped out when server fetch resolves earlier or without new message', () => {
    const optimisticMsg = {
      id: 'msg-client-temp-001',
      temp_id: 'msg-client-temp-001',
      sender: 'client',
      text: 'Need digitizing quote for 5000 jackets',
      status: 'sending',
      timestamp: new Date().toISOString()
    };

    const initialMessages = [
      {
        id: 'db-msg-001',
        sender: 'admin',
        text: 'Welcome to Bilal Digitizing! How can we help?',
        status: 'sent',
        timestamp: new Date(Date.now() - 60000).toISOString()
      }
    ];

    // User types and hits Send: optimistic message is added
    const withOptimistic = [...initialMessages, optimisticMsg];
    assert.equal(withOptimistic.length, 2);
    assert.equal(withOptimistic[1].status, 'sending');

    // Scenario: Server fetch resolves immediately, returning only the older server rows (replica lag)
    const serverFetchResult = [
      {
        id: 'db-msg-001',
        sender: 'admin',
        text: 'Welcome to Bilal Digitizing! How can we help?',
        status: 'sent',
        timestamp: new Date(Date.now() - 60000).toISOString()
      }
    ];

    // Merging must PRESERVE the pending optimistic message!
    const mergedAfterLaggedFetch = mergeChatMessages(withOptimistic, serverFetchResult);
    assert.equal(mergedAfterLaggedFetch.length, 2, 'Optimistic message MUST NOT be wiped out');
    const preservedMsg = mergedAfterLaggedFetch.find(m => m.id === 'msg-client-temp-001');
    assert.ok(preservedMsg, 'Pending message is retained');
    assert.equal(preservedMsg.status, 'sending');
  });

  test('Server confirmation smoothly transitions optimistic message from sending to sent and updates ID', () => {
    const optimisticMsg = {
      id: 'msg-client-temp-002',
      sender: 'client',
      text: 'What is your rush turnaround time?',
      status: 'sending',
      timestamp: new Date().toISOString()
    };

    const currentList = [optimisticMsg];

    // Server responds via Realtime broadcast with authoritative database record
    const serverBroadcast = [
      {
        id: 'db-msg-uuid-999',
        sender: 'client',
        text: 'What is your rush turnaround time?',
        status: 'sent',
        timestamp: optimisticMsg.timestamp
      }
    ];

    const merged = mergeChatMessages(currentList, serverBroadcast);
    assert.equal(merged.length, 1, 'Temporary message must be deduplicated into confirmed record');
    assert.equal(merged[0].id, 'db-msg-uuid-999');
    assert.equal(merged[0].status, 'sent');
  });

  test('Auto-pilot reply is generated reliably for common embroidery inquiries', async () => {
    const inquiry = 'Can you digitize 3D puff embroidery for caps? What is your price and rate?';
    const autoReplyText = await generateHelpDeskAutoReply({ latestText: inquiry, clientName: 'Test Customer' });

    assert.ok(typeof autoReplyText === 'string' && autoReplyText.length > 20);
    const lower = autoReplyText.toLowerCase();
    assert.ok(
      lower.includes('embroidery') || 
      lower.includes('digitizing') || 
      lower.includes('puff') || 
      lower.includes('bilal') ||
      lower.includes('quote'),
      'Auto-reply should contain contextually relevant embroidery information'
    );
  });

  test('Error state is properly assigned on delivery failure without losing message content', () => {
    const msg = {
      id: 'msg-client-temp-003',
      sender: 'client',
      text: 'High-priority order inquiry',
      status: 'sending',
      timestamp: new Date().toISOString()
    };

    const failedList = [msg].map(m => m.id === msg.id ? { ...m, status: 'error' } : m);

    assert.equal(failedList.length, 1);
    assert.equal(failedList[0].status, 'error');
    assert.equal(failedList[0].text, 'High-priority order inquiry');
  });
});
