import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = relativePath => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

test('chat replies are persisted from a verified message in the same conversation', () => {
  const route = read('app/api/chat/messages/route.js');

  assert.match(route, /reply_to_message_id = null/);
  assert.match(route, /requestedReplyId/);
  assert.match(route, /\.eq\('id', requestedReplyId\)/);
  assert.match(route, /\.eq\('conversation_id', conversation_id\)/);
  assert.match(route, /resolvedReply = \{/);
  assert.match(route, /reply_to: resolvedReply/);
  assert.match(route, /The replied message is no longer available in this conversation/);
});

test('customer and admin composers support specific-message replies', () => {
  const customer = read('src/components/customer/CustomerSupportChat.jsx');
  const admin = read('src/components/admin/AdminChatInbox.jsx');

  for (const source of [customer, admin]) {
    assert.match(source, /const \[replyingTo, setReplyingTo\] = useState\(null\)/);
    assert.match(source, /handleReplyToMessage/);
    assert.match(source, /reply_to_message_id: replyToSend\?\.id \|\| null/);
    assert.match(source, /getReplyPreviewText\(msg\.reply_to\)/);
    assert.match(source, /<CornerUpLeft size=\{14\} \/>/);
    assert.match(source, /aria-label="Cancel reply"/);
  }
});

test('customer Enter sends and Shift+Enter remains a newline', () => {
  const customer = read('src/components/customer/CustomerSupportChat.jsx');

  assert.match(customer, /if \(e\.key !== 'Enter' \|\| e\.shiftKey \|\| e\.nativeEvent\?\.isComposing\) return/);
  assert.match(customer, /e\.preventDefault\(\);\s*handleSendMessage\(e\)/);
  assert.equal(customer.includes('isTouchOrMobile'), false);
  assert.match(customer, /enterKeyHint="send"/);
});

test('admin Enter sends and Shift+Enter remains a newline', () => {
  const admin = read('src/components/admin/AdminChatInbox.jsx');

  assert.match(admin, /if \(e\.key !== 'Enter' \|\| e\.shiftKey \|\| e\.nativeEvent\?\.isComposing\) return/);
  assert.match(admin, /e\.preventDefault\(\);\s*handleSendMessage\(\)/);
  assert.match(admin, /enterKeyHint="send"/);
});

test('chat composer does not add keyboard instruction copy', () => {
  const customer = read('src/components/customer/CustomerSupportChat.jsx');
  const admin = read('src/components/admin/AdminChatInbox.jsx');

  for (const source of [customer, admin]) {
    assert.equal(/shift\s*\+\s*enter/i.test(source), false);
    assert.equal(/press\s+enter/i.test(source), false);
  }
});


test('production migration restores the reply_to JSON column after chat table recreation', () => {
  const migration = read('supabase/migrations/20261001000006_restore_chat_message_replies.sql');

  assert.match(migration, /ALTER TABLE public\.messages/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS reply_to jsonb/);
});
