-- Migration: 20260811000009_chat_system_enhancements.sql
-- Description: Add client_unread_count, admin_unread_count, and is_read columns for unified chat sync

DO $$
BEGIN
    -- 1. Enhance conversations table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'client_unread_count'
    ) THEN
        ALTER TABLE public.conversations ADD COLUMN client_unread_count integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'admin_unread_count'
    ) THEN
        ALTER TABLE public.conversations ADD COLUMN admin_unread_count integer DEFAULT 0;
    END IF;

    -- 2. Enhance messages table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'is_read'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN is_read boolean DEFAULT false;
    END IF;

    -- 3. Enhance order_messages table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'order_messages' AND column_name = 'is_read'
    ) THEN
        ALTER TABLE public.order_messages ADD COLUMN is_read boolean DEFAULT false;
    END IF;
END $$;

-- 4. Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client_email ON public.conversations (lower(client_email));
CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON public.order_messages (order_id);
