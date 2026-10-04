-- Performance Optimization: Composite Indexes for Chat Unread Counts, Messages, and Orders
-- Addresses slow queries (>1.5s) on Vercel function routes: /api/chat/unread-counts and /api/orders

-- 1. Conversations & Chat Unread Counts Composite Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_client_unread_counts
  ON public.conversations (client_email, unread_client_count)
  WHERE unread_client_count > 0;

CREATE INDEX IF NOT EXISTS idx_conversations_client_email_lower_unread
  ON public.conversations ((lower(client_email)), unread_client_count)
  WHERE unread_client_count > 0;

CREATE INDEX IF NOT EXISTS idx_conversations_unread_admin_count
  ON public.conversations (unread_admin_count)
  WHERE unread_admin_count > 0;

-- 2. Chat Messages Read Status Composite Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_is_read
  ON public.messages (conversation_id, is_read);

CREATE INDEX IF NOT EXISTS idx_messages_client_email_is_read
  ON public.messages (client_email, is_read);

-- 3. Orders Composite Indexes for user_id + status, worker_id + status, and created_at sorting
CREATE INDEX IF NOT EXISTS idx_orders_user_id_status
  ON public.orders (user_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at_desc
  ON public.orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_client_email_created_at_desc
  ON public.orders (client_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_client_email_lower_created_at_desc
  ON public.orders ((lower(client_email)), created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_worker_id_status
  ON public.orders (worker_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_worker_id_created_at_desc
  ON public.orders (worker_id, created_at DESC);

-- 4. Revisions Order Lookup Index
CREATE INDEX IF NOT EXISTS idx_revisions_order_id_created_at
  ON public.revisions (order_id, created_at DESC);
