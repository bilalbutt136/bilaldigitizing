-- Phase 1: Database Safety & Column Fix
ALTER TABLE IF EXISTS public.messages 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT ''text'',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT ''{}''::jsonb,
ADD COLUMN IF NOT EXISTS sender TEXT DEFAULT ''customer'',
ADD COLUMN IF NOT EXISTS text TEXT DEFAULT '''',
ADD COLUMN IF NOT EXISTS thread_id TEXT,
ADD COLUMN IF NOT EXISTS conversation_id TEXT,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS attachment TEXT,
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_size TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS reply_to TEXT,
ADD COLUMN IF NOT EXISTS offer_id TEXT,
ADD COLUMN IF NOT EXISTS offer_data JSONB,
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_autopilot BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS timestamp TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Ensure thread_id index exists for fast message loading
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_client_email ON public.messages(client_email);
CREATE INDEX IF NOT EXISTS idx_messages_offer_id ON public.messages(offer_id);

-- Ensure conversations table has safety columns and indexes
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY,
  client_name TEXT,
  client_email TEXT,
  client_company TEXT,
  channel TEXT DEFAULT ''inbox'',
  order_id TEXT,
  order_title TEXT,
  avatar TEXT,
  status TEXT DEFAULT ''online'',
  unread_count INTEGER DEFAULT 0,
  admin_unread_count INTEGER DEFAULT 0,
  client_unread_count INTEGER DEFAULT 0,
  last_message TEXT,
  last_message_time TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_channel ON public.conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversations_client_email ON public.conversations(client_email);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at);
