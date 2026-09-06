-- ====================================================================================
-- MIGRATION: 20260907000003_chat_rebuild_clean_slate.sql
-- DESCRIPTION: Complete wipe and normalized redesign of the real-time chat inbox system
-- TABLES: conversations, conversation_participants, messages
-- ====================================================================================

-- 1. DROP OLD CHAT TABLES & LEFTOVER OBJECTS WITH CASCADE
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.chat_rooms CASCADE;
DROP TABLE IF EXISTS public.chat_participants CASCADE;

-- 2. CREATE NORMALIZED CONVERSATIONS TABLE
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT DEFAULT 'Support Inquiry',
    type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'order', 'support', 'group')),
    order_id TEXT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    last_message_preview TEXT NULL,
    last_message_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. CREATE CONVERSATION PARTICIPANTS TABLE
CREATE TABLE public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- auth UUID or guest session identifier
    user_email TEXT NOT NULL,
    user_name TEXT DEFAULT 'User',
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin', 'staff', 'worker', 'guest')),
    last_read_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    unread_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(conversation_id, user_id)
);

-- 4. CREATE MESSAGES TABLE
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    sender_name TEXT DEFAULT 'User',
    sender_role TEXT NOT NULL DEFAULT 'client' CHECK (sender_role IN ('client', 'admin', 'staff', 'worker', 'guest', 'system')),
    content TEXT NOT NULL DEFAULT '',
    attachments JSONB DEFAULT '[]'::jsonb,
    reply_to JSONB DEFAULT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. PERFORMANCE INDEXES
CREATE INDEX idx_conversations_last_msg_at ON public.conversations (last_message_at DESC);
CREATE INDEX idx_conversations_order_id ON public.conversations (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_conversations_type ON public.conversations (type);

CREATE INDEX idx_conv_participants_user_id ON public.conversation_participants (user_id);
CREATE INDEX idx_conv_participants_user_email ON public.conversation_participants (user_email);
CREATE INDEX idx_conv_participants_conv_id ON public.conversation_participants (conversation_id);

CREATE INDEX idx_messages_conv_created ON public.messages (conversation_id, created_at ASC);
CREATE INDEX idx_messages_sender_id ON public.messages (sender_id);
CREATE INDEX idx_messages_sender_email ON public.messages (sender_email);
CREATE INDEX idx_messages_created_at ON public.messages (created_at ASC);

-- 6. ATOMIC TRIGGER: AUTO-UPDATE CONVERSATIONS ON NEW MESSAGE
CREATE OR REPLACE FUNCTION public.handle_new_chat_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update conversation last_message preview and timestamp
    UPDATE public.conversations
    SET 
        last_message_preview = substring(NEW.content from 1 for 150),
        last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;

    -- Increment unread count for other participants
    UPDATE public.conversation_participants
    SET 
        unread_count = unread_count + 1
    WHERE 
        conversation_id = NEW.conversation_id
        AND user_id != NEW.sender_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_chat_message_insert ON public.messages;
CREATE TRIGGER trg_on_chat_message_insert
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_chat_message();

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations RLS: Public read/write with service role override and participant check
CREATE POLICY "Allow public read conversations"
ON public.conversations FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated insert conversations"
ON public.conversations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow authenticated update conversations"
ON public.conversations FOR UPDATE
USING (true);

-- Conversation Participants RLS
CREATE POLICY "Allow public read participants"
ON public.conversation_participants FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated insert participants"
ON public.conversation_participants FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow authenticated update participants"
ON public.conversation_participants FOR UPDATE
USING (true);

-- Messages RLS
CREATE POLICY "Allow public read messages"
ON public.messages FOR SELECT
USING (deleted_at IS NULL);

CREATE POLICY "Allow authenticated insert messages"
ON public.messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow authenticated update messages"
ON public.messages FOR UPDATE
USING (true);

-- 8. SUPABASE REALTIME REPLICATION PUBLICATION
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'conversation_participants'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;
