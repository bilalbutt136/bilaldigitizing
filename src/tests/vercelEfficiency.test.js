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


test('Vercel efficiency: push registration and unread counts are guarded against request bursts', () => {
  const registrar = read('src/components/common/PWARegistrar.jsx');
  const pushHook = read('src/hooks/usePushNotifications.js');
  const pushClient = read('src/utils/pushSubscriptionClient.js');
  const unread = read('src/services/chatUnreadService.js');
  const nextConfig = read('next.config.js');

  assert.match(registrar, /isSubscribingRef/);
  assert.match(registrar, /canSyncPush/);
  assert.match(registrar, /isPushSubscriptionSynced/);
  assert.match(pushHook, /isSubscribingRef/);
  assert.match(pushHook, /Authentication required/);
  assert.match(pushClient, /bdigi_push_subscription_synced_v1/);

  assert.match(unread, /CACHE_TTL_MS = 60_000/);
  assert.match(unread, /DEDUPING_INTERVAL_MS = 60_000/);
  assert.match(unread, /STORAGE_PREFIX = 'bdigi_chat_unread_v2:'/);
  assert.match(unread, /document\.visibilityState === 'hidden'/);
  assert.match(unread, /authBlocked\.add\(identityKey\)/);
  assert.match(nextConfig, /source: '\/3d-puff-digitizing'/);
  assert.match(nextConfig, /destination: '\/services\/embroidery-digitizing'/);
});

test('Vercel efficiency: chat recovery is Realtime-first with 60 second guarded fallback', () => {
  const adminChat = read('src/components/admin/AdminChatInbox.jsx');
  const customerChat = read('src/components/customer/CustomerSupportChat.jsx');
  const presence = read('src/services/presenceService.js');
  const queryService = read('src/services/clientQueryService.js');

  assert.match(adminChat, /now - lastRecoveryAt < 60_000/);
  assert.match(customerChat, /now - lastRecoveryAt < 60_000/);
  assert.match(presence, /REST_PRESENCE_MIN_INTERVAL_MS = 60_000/);
  assert.match(presence, /now - lastRestPresenceReadAt < REST_PRESENCE_MIN_INTERVAL_MS/);
  assert.match(queryService, /new QueryClient/);
  assert.match(queryService, /staleTime: 60_000/);
  assert.match(adminChat, /fetchClientQuery/);
  assert.match(customerChat, /fetchClientQuery/);
});

test('Vercel efficiency: hot read routes use bounded projections and cache headers', () => {
  const messages = read('app/api/chat/messages/route.js');
  const conversations = read('app/api/chat/conversations/route.js');
  const unread = read('app/api/chat/unread-counts/route.js');
  const presence = read('app/api/chat/presence/route.js');
  const clients = read('app/api/clients/route.js');
  const orders = read('src/server/orders/handlers/get/fetchAll.js');

  assert.match(messages, /MESSAGE_FIELDS/);
  assert.match(messages, /\.limit\(150\)/);
  assert.match(messages, /'Cache-Control': 'private, no-cache'/);
  assert.match(conversations, /CONVERSATION_FIELDS/);
  assert.match(conversations, /\.limit\(200\)/);
  assert.match(conversations, /stale-while-revalidate=45/);
  assert.match(unread, /stale-while-revalidate=60/);
  assert.match(presence, /stale-while-revalidate=60/);
  assert.match(clients, /stale-while-revalidate=90/);
  assert.match(orders, /stale-while-revalidate=45/);
});

test('Vercel efficiency: web-push dependency is patched off deprecated url.parse', () => {
  const patcher = read('scripts/patch-web-push-url.mjs');
  const pkg = read('package.json');

  assert.equal(JSON.parse(pkg).scripts.postinstall, 'node scripts/patch-web-push-url.mjs');
  assert.match(patcher, /new URL\(subscription\.endpoint\)/);
  assert.match(patcher, /new URL\(requestDetails\.endpoint\)/);
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

test('Mobile PDF preview renders with PDF.js canvas instead of native iframe PDF embedding', () => {
  const downloader = read('src/utils/fileDownloader.js');
  const modal = read('src/components/common/PdfPreviewModal.jsx');
  const nextConfig = read('next.config.js');

  assert.match(downloader, /createFrameSafePdfPreviewUrl/);
  assert.match(modal, /pdfjs-dist\/build\/pdf\.mjs/);
  assert.match(modal, /PDF_WORKER_SRC = '\/pdf\.worker\.min\.mjs'/);
  assert.match(modal, /page\.render\(/);
  assert.match(modal, /document\.createElement\('canvas'\)/);
  assert.equal(modal.includes('<iframe'), false, 'PDF preview must not depend on mobile browser iframe PDF support');
  assert.equal(fs.existsSync('public/pdf.worker.min.mjs'), true, 'Self-hosted PDF.js worker must ship with the app');
  assert.equal(fs.existsSync('app/pdf-viewer/page.jsx'), true, 'Direct PDF opens must have a same-origin viewer route');
  assert.match(downloader, /\/pdf-viewer\?url=/);
  assert.match(nextConfig, /worker-src 'self' blob:/);
});
