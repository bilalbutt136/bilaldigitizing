import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

describe('P1 Performance Regression Coverage', () => {
  test('portfolio route uses ISR and catalog invalidation instead of forced no-store rendering', () => {
    const page = fs.readFileSync('app/portfolio/page.jsx', 'utf8');
    const serverCatalog = fs.readFileSync('src/lib/catalog/serverCatalog.js', 'utf8');
    const catalogRoute = fs.readFileSync('app/api/catalog/route.js', 'utf8');

    assert.equal(page.includes("dynamic = 'force-dynamic'"), false);
    assert.equal(page.includes("fetchCache = 'force-no-store'"), false);
    assert.equal(page.includes('revalidate = 0'), false);
    assert.match(page, /export const revalidate = 300/);
    assert.match(serverCatalog, /tags: \['catalog', 'homepage', 'portfolio'\]/);
    assert.match(catalogRoute, /revalidatePath\('\/portfolio', 'page'\)/);
    assert.match(catalogRoute, /revalidateTag\('portfolio', 'max'\)/);
  });

  test('server auth is request-memoized and trusted role resolution uses one RPC primary path', () => {
    const auth = fs.readFileSync('src/lib/supabase/serverAuth.js', 'utf8');
    const proxy = fs.readFileSync('proxy.js', 'utf8');

    assert.match(auth, /const requestAuthCache = new WeakMap\(\)/);
    assert.match(auth, /requestAuthCache\.get\(request\)/);
    assert.match(auth, /requestAuthCache\.set\(request, authPromise\)/);
    assert.match(auth, /\.rpc\(\s*'resolve_trusted_user_access'/);
    assert.match(auth, /Promise\.all\(\[/);

    assert.equal(proxy.includes('const timeoutPromise = new Promise'), false);
    assert.match(proxy, /function withTimeout\(/);
    assert.match(proxy, /Promise\.all\(\[/);
  });

  test('chat/database realtime subscriptions are consolidated into the shared hub', () => {
    const service = fs.readFileSync('src/services/supabaseService.js', 'utf8');
    const adminChat = fs.readFileSync('src/components/admin/AdminChatInbox.jsx', 'utf8');
    const customerChat = fs.readFileSync('src/components/customer/CustomerSupportChat.jsx', 'utf8');
    const adminDashboard = fs.readFileSync('src/components/admin/AdminDashboard.jsx', 'utf8');

    assert.match(service, /const chatMessageListeners = new Set\(\)/);
    assert.match(service, /const conversationListeners = new Set\(\)/);
    assert.match(service, /export function subscribeToChatMessages/);
    assert.match(service, /export function subscribeToConversations/);
    assert.match(service, /table: 'messages'/);
    assert.match(service, /table: 'conversations'/);

    assert.equal(adminChat.includes("channel('admin-global-chat-monitor')"), false);
    assert.equal(adminDashboard.includes("channel('admin-dashboard-global-chime')"), false);
    assert.equal(adminChat.includes("table: 'messages'"), false);
    assert.equal(customerChat.includes("table: 'messages'"), false);
    assert.match(adminChat, /subscribeToChatMessages/);
    assert.match(adminChat, /subscribeToConversations/);
    assert.match(customerChat, /subscribeToChatMessages/);
    assert.match(adminDashboard, /subscribeToChatMessages/);
  });


  test('order hydration avoids request storms and oversized admin list payloads', () => {
    const controller = fs.readFileSync('src/server/orders/controllers/ordersGetController.js', 'utf8');
    const fetchAll = fs.readFileSync('src/server/orders/handlers/get/fetchAll.js', 'utf8');
    const service = fs.readFileSync('src/services/supabaseService.js', 'utf8');
    const state = fs.readFileSync('src/context/StateContext.jsx', 'utf8');

    assert.match(controller, /enforceApiBurstLimit\(request, 'orders-get'/);
    assert.match(fetchAll, /ADMIN_SUMMARY_FIELDS/);
    assert.match(fetchAll, /searchParams\.get\('view'\) === 'summary'/);
    assert.match(fetchAll, /_summaryOnly: true/);
    assert.match(fetchAll, /nestedErr\?\.code === '57014'/);

    assert.match(service, /const inFlightApiReads = new Map\(\)/);
    assert.match(service, /runDedupedApiRead\(requestKey/);
    assert.match(service, /\/api\/orders\?action=fetchAll&view=summary/);
    assert.equal(service.includes("action=fetchAll&_t=${Date.now()}"), false);

    assert.match(state, /event === 'INITIAL_SESSION'/);
    assert.match(state, /!orderOrId\._summaryOnly/);
  });

  test('portal refresh and chat presence callbacks cannot recreate request storms', () => {
    const state = fs.readFileSync('src/context/StateContext.jsx', 'utf8');
    const adminDashboard = fs.readFileSync('src/components/admin/AdminDashboard.jsx', 'utf8');
    const adminChat = fs.readFileSync('src/components/admin/AdminChatInbox.jsx', 'utf8');
    const customerChat = fs.readFileSync('src/components/customer/CustomerSupportChat.jsx', 'utf8');
    const presence = fs.readFileSync('src/services/presenceService.js', 'utf8');
    const workersRoute = fs.readFileSync('app/api/admin/workers/route.js', 'utf8');
    const profileRoute = fs.readFileSync('app/api/auth/profile/route.js', 'utf8');

    assert.match(state, /const refreshOrders = useCallback/);
    assert.match(state, /const refreshClients = useCallback/);
    assert.match(state, /event === 'INITIAL_SESSION'/);
    assert.match(state, /event === 'TOKEN_REFRESHED'/);
    assert.equal(state.includes("if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;"), false);
    assert.equal(adminDashboard.includes('refreshOrders'), false);
    assert.equal(adminDashboard.includes('refreshClients'), false);

    assert.match(adminChat, /fetchChatUnreadCounts/);
    assert.equal(adminChat.includes("filter=unread&channel=inbox"), false);
    assert.equal(adminChat.includes("filter=unread&channel=support"), false);

    assert.equal(customerChat.includes('trackUserPresence'), false);
    assert.equal(customerChat.includes('untrackUserPresence'), false);
    const mobileApp = fs.readFileSync('src/components/mobile/BDigitizingMobileApp.jsx', 'utf8');
    assert.match(mobileApp, /lastAutoOrderRefreshAtRef/);
    assert.match(mobileApp, /15_000/);
    assert.match(presence, /REST_PRESENCE_MIN_INTERVAL_MS = 30_000/);

    assert.match(workersRoute, /unstable_cache/);
    assert.match(workersRoute, /revalidate: 30/);
    assert.match(workersRoute, /rpc\('get_admin_worker_directory'\)/);
    assert.match(profileRoute, /resolveTrustedUserAccess/);
    const workerRpcMigration = fs.readFileSync(
      'supabase/migrations/20261001000003_admin_worker_directory_rpc.sql',
      'utf8'
    );
    assert.match(workerRpcMigration, /CREATE OR REPLACE FUNCTION public\.get_admin_worker_directory/);
    assert.match(workerRpcMigration, /GRANT EXECUTE ON FUNCTION public\.get_admin_worker_directory\(\) TO service_role/);
    assert.equal(profileRoute.includes(".from('admins')"), false);
    assert.equal(profileRoute.includes(".from('worker_profiles')"), false);
    assert.equal(profileRoute.includes(".from('workers')"), false);
  });

  test('admin/session, orders, clients and chat bursts are TTL-deduped instead of only in-flight deduped', () => {
    const service = fs.readFileSync('src/services/supabaseService.js', 'utf8');
    const state = fs.readFileSync('src/context/StateContext.jsx', 'utf8');
    const clientDirectory = fs.readFileSync('src/components/admin/ClientDirectory.jsx', 'utf8');
    const clientsRoute = fs.readFileSync('app/api/clients/route.js', 'utf8');
    const adminChat = fs.readFileSync('src/components/admin/AdminChatInbox.jsx', 'utf8');
    const customerChat = fs.readFileSync('src/components/customer/CustomerSupportChat.jsx', 'utf8');
    const tracker = fs.readFileSync('src/components/customer/OrderTrackerDrawer.jsx', 'utf8');
    const boltStatus = fs.readFileSync('app/api/boltpayouts/status/route.js', 'utf8');
    const orderCreate = fs.readFileSync('src/server/orders/handlers/post/createOrder.js', 'utf8');
    const chatMessages = fs.readFileSync('app/api/chat/messages/route.js', 'utf8');
    const reviews = fs.readFileSync('app/api/reviews/route.js', 'utf8');
    const reviewService = fs.readFileSync('src/services/reviewService.js', 'utf8');
    const adminDashboard = fs.readFileSync('src/components/admin/AdminDashboard.jsx', 'utf8');
    const geminiStatus = fs.readFileSync('app/api/admin/gemini-status/route.js', 'utf8');
    const chatTyping = fs.readFileSync('app/api/chat/typing/route.js', 'utf8');

    assert.match(service, /const completedApiReads = new Map\(\)/);
    assert.match(service, /ttlMs: 15_000/);
    assert.match(service, /ttlMs: 60_000/);
    assert.match(service, /const requestKey = `admin-session:\$\{String\(email\)\.toLowerCase\(\)\.trim\(\)\}`/);
    assert.equal(service.includes('admin-session:${getAuthScopeKey(headers)}'), false);
    assert.match(service, /runDedupedApiMutation/);
    assert.match(service, /client-upsert:/);
    assert.match(state, /event === 'INITIAL_SESSION' \|\| event === 'SIGNED_IN'/);
    assert.equal(state.includes('Date.now() - lastHydration.hydratedAt < 15_000'), false);
    assert.match(state, /if \(role === 'customer'\) upsertClientInSupabase/);

    assert.equal(clientDirectory.includes('mount-only directory sync'), false);
    assert.match(clientDirectory, /refreshClients\(\{ force: true \}\)/);
    assert.match(clientsRoute, /enforceApiBurstLimit\(request, 'clients-post', 30, 60_000\)/);

    assert.match(adminChat, /scheduleConversationRefresh/);
    assert.match(adminChat, /hasUnreadIncoming/);
    assert.match(customerChat, /CHAT_CONVERSATION_CACHE_TTL_MS = 60_000/);
    assert.match(customerChat, /getOrCreateConversationCached/);
    assert.equal(tracker.includes('/api/boltpayouts/status?orderId='), false);
    assert.match(boltStatus, /status: 'not_found'/);
    assert.match(boltStatus, /status: 200/);

    assert.match(orderCreate, /after\(async \(\) =>/);
    assert.match(orderCreate, /\.upsert\(fileRows/);
    assert.equal(orderCreate.includes('existingIdCheck'), false);
    assert.match(chatMessages, /after\(async \(\) =>/);
    assert.match(chatMessages, /existingConversation\?\.unread_admin_count/);
    assert.match(reviews, /revalidateTag\('catalog', 'max'\)/);
    assert.match(reviews, /revalidateTag\('homepage', 'max'\)/);

    assert.match(reviewService, /REVIEW_READ_TTL_MS = 5 \* 60_000/);
    assert.match(reviewService, /reviewReadInFlight = new Map\(\)/);
    assert.match(reviewService, /runCachedReviewRead/);
    assert.equal(adminDashboard.includes("const handleFocus = () => fetchPendingReviews()"), false);
    assert.equal(adminDashboard.includes("if (document.visibilityState === 'visible') fetchPendingReviews()"), false);
    assert.match(tracker, /\[reviewOrderId, reviewOrderStatus, authUser\?\.email\]/);

    assert.match(geminiStatus, /GEMINI_PING_TIMEOUT_MS = 3_000/);
    assert.match(geminiStatus, /new AbortController\(\)/);
    assert.match(geminiStatus, /signal: controller\.signal/);
    assert.match(geminiStatus, /NextResponse\.json\(\{ status: 'timeout' \}\)/);

    assert.match(chatMessages, /\.httpSend\('new_chat_message', insertedMsg\)/);
    assert.match(chatTyping, /\.httpSend\('typing'/);
    assert.equal(chatMessages.includes('liveChannel.send({'), false);
  });

  test('durable uploads, bounded list reads and idempotent file rows prevent resource regressions', () => {
    const service = fs.readFileSync('src/services/supabaseService.js', 'utf8');
    const upload = fs.readFileSync('app/api/cloudinary/upload/route.js', 'utf8');
    const signature = fs.readFileSync('app/api/cloudinary/signature/route.js', 'utf8');
    const download = fs.readFileSync('app/api/download/route.js', 'utf8');
    const conversations = fs.readFileSync('app/api/chat/conversations/route.js', 'utf8');
    const messages = fs.readFileSync('app/api/chat/messages/route.js', 'utf8');
    const clients = fs.readFileSync('app/api/clients/route.js', 'utf8');
    const audio = fs.readFileSync('src/utils/audioNotification.js', 'utf8');
    const migration = [
      fs.readFileSync('supabase/migrations/20261001000001_order_files_idempotency.sql', 'utf8'),
      fs.readFileSync('supabase/migrations/20261001000002_order_files_upsert_constraint.sql', 'utf8')
    ].join('\n');
    const orderHandlers = [
      'src/server/orders/handlers/post/createOrder.js',
      'src/server/orders/handlers/post/updateStatus.js',
      'src/server/orders/handlers/post/adminReviewWorker.js',
      'src/server/orders/handlers/post/workerSubmitUpload.js'
    ].map(file => fs.readFileSync(file, 'utf8'));

    assert.equal(service.includes('readAsDataURL'), false);
    assert.match(service, /Never fall back to Data URLs/);

    assert.match(upload, /enforceApiBurstLimit\(request, 'file-upload-post'/);
    assert.match(signature, /enforceApiBurstLimit\(request, 'cloudinary-signature-get'/);
    assert.match(download, /estimatedBytes > 10 \* 1024 \* 1024/);

    assert.match(conversations, /\.limit\(500\)/);
    assert.match(messages, /order\('created_at', \{ ascending: false \}\)\.limit\(500\)/);
    assert.match(clients, /\.limit\(500\)/);

    assert.equal(audio.includes('data:audio/'), false);
    assert.match(audio, /URL\.createObjectURL/);

    assert.match(migration, /CREATE UNIQUE INDEX IF NOT EXISTS uq_order_files_order_type_url/);
    assert.match(migration, /ON public\.order_files \(order_id, file_type, file_url\);/);
    assert.match(migration, /PARTITION BY order_id, file_type, file_url/);

    for (const handler of orderHandlers) {
      assert.match(handler, /onConflict: 'order_id,file_type,file_url'/);
      assert.match(handler, /ignoreDuplicates: true/);
    }
  });

  test('performance migration installs the auth RPC and drops only selected redundant indexes', () => {
    const migration = fs.readFileSync(
      'supabase/migrations/20260929000004_p1_performance_auth_and_index_cleanup.sql',
      'utf8'
    );

    assert.match(migration, /CREATE OR REPLACE FUNCTION public\.resolve_trusted_user_access/);
    assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.resolve_trusted_user_access\(text\) TO service_role/);
    assert.match(migration, /CREATE INDEX IF NOT EXISTS idx_clients_email_lower_auth/);

    const expectedDrops = [
      'idx_orders_user_id',
      'idx_orders_worker_id',
      'idx_orders_worker_status',
      'idx_orders_created_at',
      'idx_messages_client_email_lower',
      'idx_conversations_client_email_lower',
      'idx_custom_offers_conversation_id',
      'clients_email_idx',
      'idx_orders_status',
      'orders_status_idx'
    ];

    for (const indexName of expectedDrops) {
      assert.match(migration, new RegExp('DROP INDEX IF EXISTS public\\.' + indexName));
    }

    assert.equal(migration.includes('DROP INDEX IF EXISTS public.clients_email_key'), false);
    assert.equal(migration.includes('DROP INDEX IF EXISTS public.orders_worker_id_idx'), false);
    assert.equal(migration.includes('DROP INDEX IF EXISTS public.idx_custom_offers_conv_id'), false);
  });
});
