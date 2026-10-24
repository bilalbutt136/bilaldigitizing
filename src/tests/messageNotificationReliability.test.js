import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  notificationIdForMessage,
  resolveAdminMessageLink
} from '../lib/adminMessageNotification.js';

const source = (file) => fs.readFileSync(file, 'utf8');

test('message notification reliability safeguards', async (t) => {
  await t.test('admin message notification IDs are deterministic and links open the right channel', () => {
    assert.equal(
      notificationIdForMessage('msg-123'),
      'notif-chat-msg-123'
    );
    assert.equal(
      resolveAdminMessageLink('inbox-contact_alex_mercer_gmail_com'),
      '/admin-portal?tab=inbox&conversationId=inbox-contact_alex_mercer_gmail_com'
    );
    assert.equal(
      resolveAdminMessageLink('support-guest_abc123'),
      '/admin-portal?tab=support&conversationId=support-guest_abc123'
    );
  });

  await t.test('every customer message entry path persists a durable admin alert', () => {
    const loggedInChat = source('app/api/chat/messages/route.js');
    const guestChat = source('app/api/chat/guest/route.js');
    const contact = source('app/api/contact/route.js');

    assert.match(loggedInChat, /ensureAdminMessageNotification/);
    assert.match(guestChat, /ensureAdminMessageNotification/);
    assert.match(contact, /ensureAdminMessageNotification/);
  });

  await t.test('admin notification history self-heals missing message alerts', () => {
    const route = source('app/api/admin/notifications/route.js');
    const helper = source('src/lib/adminMessageNotification.js');

    assert.match(route, /reconcileAdminMessageNotifications/);
    assert.match(helper, /\.eq\('sender', 'client'\)/);
    assert.match(helper, /recoveryWindowStart/);
    assert.match(helper, /ignoreDuplicates: true/);
  });

  await t.test('email and push delivery have reliability fallbacks and exact deep links', () => {
    const email = source('src/lib/emailService.js');
    const push = source('src/lib/pushService.js');
    const popup = source('src/components/common/WhatsAppMessagePopup.jsx');

    assert.match(email, /const maxAttempts = 2/);
    assert.match(email, /response\.status === 429 \|\| response\.status >= 500/);
    assert.match(push, /conversationId=/);
    assert.doesNotMatch(push, /admin-portal\?tab=inbox.*chatId=/);
    assert.match(popup, /admin-portal\?tab=/);
    assert.match(popup, /conversationId=/);
  });

  await t.test('mobile notification history opens stored notification links', () => {
    const mobile = source('src/components/admin/MobileAdminConsole.jsx');
    assert.match(mobile, /const link = String\(notification\?\.link/);
    assert.match(mobile, /navigate\(link\)/);
  });
});
