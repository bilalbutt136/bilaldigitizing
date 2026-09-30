import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');

test('Vercel efficiency: always-on API polling is removed from persistent UI shells', () => {
  const header = read('src/components/HeaderNav.jsx');
  const adminDashboard = read('src/components/admin/AdminDashboard.jsx');
  const customerDashboard = read('src/components/customer/CustomerDashboard.jsx');
  const mobileApp = read('src/components/mobile/BDigitizingMobileApp.jsx');
  const adminChat = read('src/components/admin/AdminChatInbox.jsx');
  const customerChat = read('src/components/customer/CustomerSupportChat.jsx');

  assert.equal(header.includes('setInterval(fetchUnreadChats'), false);
  assert.equal(adminDashboard.includes('setInterval(fetchUnreadChats'), false);
  assert.equal(customerDashboard.includes('setInterval(fetchClientChatUnread'), false);
  assert.equal(mobileApp.includes('setInterval(fetchMobileChatUnread'), false);
  assert.equal(adminChat.includes("fetch('/api/chat/typing") && adminChat.includes('setInterval(async'), false);
  assert.equal(customerChat.includes("fetch(`/api/chat/messages") && customerChat.includes('setInterval(async'), false);
});

test('Vercel efficiency: legal pages use ISR instead of per-request SSR', () => {
  for (const path of ['app/privacy/page.jsx', 'app/terms/page.jsx']) {
    const source = read(path);
    assert.match(source, /export const revalidate = 3600/);
    assert.equal(source.includes("dynamic = 'force-dynamic'"), false);
  }
});

test('Vercel efficiency: large storage assets bypass the Vercel download proxy when trusted', () => {
  const downloader = read('src/utils/fileDownloader.js');
  assert.match(downloader, /isTrustedDirectAssetUrl/);
  assert.match(downloader, /res\.cloudinary\.com/);
  assert.match(downloader, /\.supabase\.co/);
  assert.match(downloader, /direct storage\/CDN transfer/i);
});

test('Vercel efficiency: hot chat endpoints have a cheap burst guard', () => {
  for (const path of [
    'app/api/chat/conversations/route.js',
    'app/api/chat/messages/route.js',
    'app/api/chat/typing/route.js',
    'app/api/chat/presence/route.js',
    'app/api/chat/unread-counts/route.js'
  ]) {
    const source = read(path);
    assert.match(source, /BurstLimit|checkRateLimit/);
  }
});

test('Mobile PDF preview uses a local blob URL so remote frame headers cannot block it', () => {
  const downloader = read('src/utils/fileDownloader.js');
  const modal = read('src/components/common/PdfPreviewModal.jsx');
  const nextConfig = read('next.config.js');

  assert.match(downloader, /createFrameSafePdfPreviewUrl/);
  assert.match(downloader, /new Blob\(\[buffer\], \{ type: 'application\/pdf' \}\)/);
  assert.match(modal, /createFrameSafePdfPreviewUrl/);
  assert.match(modal, /src=\{previewUrl\}/);
  assert.match(nextConfig, /frame-src 'self' blob:/);
});
