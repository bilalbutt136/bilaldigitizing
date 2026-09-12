-- ==============================================================================
-- MIGRATION: 25_isolate_inbox_and_support_chat_sync.sql
-- Description: Isolate Inbox and Support chat flows, ensure chat_type and is_support
-- columns exist, and backfill existing conversation threads and messages.
-- ==============================================================================

-- 1. CONVERSATIONS TABLE ENHANCEMENTS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
    ALTER TABLE public.conversations 
      ADD COLUMN IF NOT EXISTS chat_type text DEFAULT 'inbox',
      ADD COLUMN IF NOT EXISTS is_support boolean DEFAULT false;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    ALTER TABLE public.messages 
      ADD COLUMN IF NOT EXISTS chat_type text DEFAULT 'inbox',
      ADD COLUMN IF NOT EXISTS is_support boolean DEFAULT false;
  END IF;
END $$;

-- 2. BACKFILL EXISTING CONVERSATIONS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
    -- Mark all support identifiers as chat_type = 'support'
    UPDATE public.conversations
    SET 
      chat_type = 'support',
      is_support = true,
      tags = array_append(array_remove(coalesce(tags, '{}'), 'support'), 'support')
    WHERE 
      id = 'general-support'
      OR id = 'support-guest'
      OR id = 'help-support'
      OR id LIKE 'support-%'
      OR lower(coalesce(order_title, '')) LIKE '%support%'
      OR lower(coalesce(client_company, '')) LIKE '%support%';

    -- Mark all inbox and order identifiers as chat_type = 'inbox'
    UPDATE public.conversations
    SET 
      chat_type = 'inbox',
      is_support = false,
      tags = array_append(array_remove(coalesce(tags, 'support'), 'support'), 'inbox')
    WHERE 
      id LIKE 'inbox-%'
      OR id LIKE 'conv-%'
      OR id LIKE 'order-%'
      OR id LIKE 'direct-%'
      OR (id NOT LIKE 'support-%' AND id != 'general-support' AND id != 'support-guest' AND id != 'help-support');
  END IF;
END $$;

-- 3. BACKFILL EXISTING MESSAGES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    UPDATE public.messages
    SET 
      chat_type = 'support',
      is_support = true
    WHERE 
      conversation_id = 'general-support'
      OR conversation_id = 'support-guest'
      OR conversation_id = 'help-support'
      OR conversation_id LIKE 'support-%';

    UPDATE public.messages
    SET 
      chat_type = 'inbox',
      is_support = false
    WHERE 
      NOT (
        conversation_id = 'general-support'
        OR conversation_id = 'support-guest'
        OR conversation_id = 'help-support'
        OR conversation_id LIKE 'support-%'
      );
  END IF;
END $$;

-- 4. HIGH PERFORMANCE COMPOSITE INDEXES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_chat_type_updated 
      ON public.conversations (chat_type, updated_at DESC);

    CREATE INDEX IF NOT EXISTS idx_conversations_chat_type_email 
      ON public.conversations (chat_type, client_email);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_chat_type_created 
      ON public.messages (chat_type, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_messages_conv_chat_type_created 
      ON public.messages (conversation_id, chat_type, created_at DESC);
  END IF;
END $$;
