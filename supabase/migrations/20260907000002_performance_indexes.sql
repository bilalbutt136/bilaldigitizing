-- ============================================================
-- PERFORMANCE INDEXES: Frequently filtered & sorted columns
-- Run once against live Supabase production database.
-- Dramatically reduces sequential scans on hot queries.
-- ============================================================

-- messages table (chat inbox filters & sorting)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
  ON messages (conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_created_at 
  ON messages (created_at ASC);

CREATE INDEX IF NOT EXISTS idx_messages_client_email 
  ON messages (client_email);

CREATE INDEX IF NOT EXISTS idx_messages_sender 
  ON messages (sender);

-- orders table (admin dashboard, client portal, worker portal)
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
  ON orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status 
  ON orders (status);

CREATE INDEX IF NOT EXISTS idx_orders_client_email 
  ON orders (client_email);

CREATE INDEX IF NOT EXISTS idx_orders_worker_id 
  ON orders (worker_id) WHERE worker_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
  ON orders (payment_status);

-- Composite index for admin dashboard queries (filter by status + order by date)
CREATE INDEX IF NOT EXISTS idx_orders_status_created 
  ON orders (status, created_at DESC);

-- conversations table (inbox thread list)
CREATE INDEX IF NOT EXISTS idx_conversations_client_email 
  ON conversations (client_email);

CREATE INDEX IF NOT EXISTS idx_conversations_updated_at 
  ON conversations (updated_at DESC);

-- notifications table (notification bell & unread counts)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS recipient_email text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_email 
  ON notifications (recipient_email);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
  ON notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
  ON notifications (is_read) WHERE is_read = false;

-- custom_offers table (offer status & thread lookups)
CREATE INDEX IF NOT EXISTS idx_custom_offers_client_email 
  ON custom_offers (client_email);

CREATE INDEX IF NOT EXISTS idx_custom_offers_status 
  ON custom_offers (status);

CREATE INDEX IF NOT EXISTS idx_custom_offers_conversation_id 
  ON custom_offers (conversation_id);
