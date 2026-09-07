-- ==============================================================================
-- MIGRATION: Persistent Chat History & Manual Read Status Control
-- Date: 2026-09-07
-- Description:
-- 1. Ensures indestructible message history with permanent storage.
-- 2. Adds explicit manual read tracking columns (read_at, last_marked_read_at).
-- 3. Adds high-performance composite indexes for cursor-based pagination and sorting by activity.
-- ==============================================================================

-- 1. MESSAGES TABLE ENHANCEMENTS
DO $$ 
BEGIN
  -- Ensure messages table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    CREATE TABLE public.messages (
      id text PRIMARY KEY,
      conversation_id text NOT NULL,
      thread_id text,
      client_email text,
      guest_id text,
      sender text NOT NULL DEFAULT 'client',
      sender_name text,
      text text DEFAULT '',
      type text DEFAULT 'text',
      attachment text,
      attachment_url text,
      attachment_name text,
      attachment_size text,
      attachment_type text,
      file_id text,
      reply_to jsonb,
      offer_id text,
      offer_data jsonb,
      metadata jsonb DEFAULT '{}'::jsonb,
      status text DEFAULT 'sent',
      is_read boolean DEFAULT false,
      read_at timestamptz,
      is_autopilot boolean DEFAULT false,
      auto_pilot boolean DEFAULT false,
      deleted_at timestamptz,
      timestamp timestamptz DEFAULT timezone('utc'::text, now()),
      created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  END IF;
END $$;

-- Ensure all required columns exist on messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS thread_id text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS guest_id text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_name text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS type text DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_name text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_size text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_type text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_id text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to jsonb;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS offer_id text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS offer_data jsonb;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status text DEFAULT 'sent';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at timestamptz;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_autopilot boolean DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS auto_pilot boolean DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS timestamp timestamptz DEFAULT timezone('utc'::text, now());
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT timezone('utc'::text, now());

-- 2. CONVERSATIONS TABLE ENHANCEMENTS
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
    CREATE TABLE public.conversations (
      id text PRIMARY KEY,
      client_email text,
      client_name text,
      client_company text,
      order_id text,
      order_title text,
      avatar text,
      status text DEFAULT 'online',
      unread_count integer DEFAULT 0,
      admin_unread_count integer DEFAULT 0,
      client_unread_count integer DEFAULT 0,
      last_marked_read_at timestamptz,
      created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  END IF;
END $$;

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS client_company text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS order_id text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS order_title text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS status text DEFAULT 'online';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS unread_count integer DEFAULT 0;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS admin_unread_count integer DEFAULT 0;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS client_unread_count integer DEFAULT 0;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_marked_read_at timestamptz;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc'::text, now());

-- 3. HIGH-PERFORMANCE INDEXES FOR PERMANENT HISTORY & LAZY LOADING
CREATE INDEX IF NOT EXISTS idx_messages_conv_created_desc 
  ON public.messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conv_created_asc 
  ON public.messages (conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_messages_client_created_desc 
  ON public.messages (client_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_read_filter 
  ON public.messages (conversation_id, is_read, sender);

CREATE INDEX IF NOT EXISTS idx_conversations_updated_desc 
  ON public.conversations (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_client_email 
  ON public.conversations (client_email);

-- 4. ENABLE REALTIME REPLICATION FOR MESSAGES & CONVERSATIONS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
