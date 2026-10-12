import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

test('CustomerDashboard safely defines and destructures siteSettings from useAppState', () => {
  const content = read('src/components/customer/CustomerDashboard.jsx');
  assert.match(content, /siteSettings\s*=\s*\{\}/, 'siteSettings must be destructured with default value in useAppState');
  assert.match(content, /Boolean\(siteSettings\?\.enableAppInstallPrompt\)/, 'Install prompt feature check uses safe siteSettings');
});

test('audioNotification properly scopes resolvedMsgId without reference error', () => {
  const content = read('src/utils/audioNotification.js');
  assert.match(content, /let resolvedMsgId = messageId;/, 'resolvedMsgId must be declared with let');
  assert.match(content, /resolvedMsgId = null;/, 'resolvedMsgId assignment succeeds without ReferenceError');
});

test('adminMfaService imports supabase client', () => {
  const content = read('src/services/adminMfaService.js');
  assert.match(content, /import\s*\{\s*supabase\s*\}\s*from\s*['"]\.\.\/lib\/supabase\/client['"]/, 'supabase must be imported');
});

test('server order handlers import logServerCaughtError and reference correct payloads', () => {
  const updateStatus = read('src/server/orders/handlers/post/updateStatus.js');
  assert.match(updateStatus, /import\s*\{\s*logServerCaughtError\s*\}\s*from/, 'updateStatus imports logServerCaughtError');
  assert.match(updateStatus, /const resolvedOrderId = targetOrder\?\.id \|\| cleanId \|\| rawId \|\| orderId;/, 'resolvedOrderId declared in handler scope');

  const adminReview = read('src/server/orders/handlers/post/adminReviewWorker.js');
  assert.match(adminReview, /import\s*\{\s*logServerCaughtError\s*\}\s*from/, 'adminReviewWorker imports logServerCaughtError');
  assert.doesNotMatch(adminReview, /orderUpdatePayload/, 'orderUpdatePayload typo is resolved to updatePayload');

  const processBackup = read('scripts/process_backup.mjs');
  assert.match(processBackup, /if\s*\(isJson\)/, 'process_backup references isJson correctly');
});
