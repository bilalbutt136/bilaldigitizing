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
    assert.match(catalogRoute, /revalidateTag\('portfolio'\)/);
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
