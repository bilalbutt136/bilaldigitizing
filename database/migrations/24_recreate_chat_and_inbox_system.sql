-- ==============================================================================
-- MIGRATION: 24_recreate_chat_and_inbox_system.sql
-- Description: Recreate chat conversations, messages, saved_replies, realtime and attachments
-- ==============================================================================

-- 1. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id text PRIMARY KEY,
    client_email text NOT NULL,
    client_name text DEFAULT 'Client',
    client_company text DEFAULT '',
    order_id text,
    order_title text,
    avatar text,
    status text DEFAULT 'online',
    last_message text DEFAULT '',
    last_message_at timestamptz DEFAULT timezone('utc'::text, now()),
    unread_admin_count integer DEFAULT 0,
    unread_client_count integer DEFAULT 0,
    is_starred boolean DEFAULT false,
    tags text[] DEFAULT '{}',
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS client_name text DEFAULT 'Client';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS client_company text DEFAULT '';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS order_id text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS order_title text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS status text DEFAULT 'online';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message text DEFAULT '';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_at timestamptz DEFAULT timezone('utc'::text, now());
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS unread_admin_count integer DEFAULT 0;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS unread_client_count integer DEFAULT 0;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_starred boolean DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc'::text, now());

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_client_email ON public.conversations (lower(client_email));
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations (last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_starred ON public.conversations (is_starred);

-- 2. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id text PRIMARY KEY,
    conversation_id text NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    client_email text NOT NULL,
    sender text NOT NULL DEFAULT 'client',
    sender_name text,
    sender_email text,
    text text DEFAULT '',
    type text DEFAULT 'text',
    attachments jsonb DEFAULT '[]'::jsonb,
    attachment_url text,
    attachment_name text,
    attachment_size text,
    attachment_type text,
    offer_id text,
    offer_data jsonb,
    is_read boolean DEFAULT false,
    read_at timestamptz,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_name text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_size text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_type text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS offer_id text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS offer_data jsonb;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages (conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_client_email ON public.messages (lower(client_email));
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages (conversation_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_offer_id ON public.messages (offer_id);

-- 3. SAVED REPLIES TABLE
CREATE TABLE IF NOT EXISTS public.saved_replies (
    id text PRIMARY KEY,
    title text NOT NULL,
    content text NOT NULL,
    shortcut text,
    category text DEFAULT 'general',
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.saved_replies (id, title, content, shortcut, category)
VALUES
    ('reply-welcome', 'Order Inquiry Received', 'Hello! Thank you for contacting Bilal Digitizing Studio. We have received your design inquiry and our digitizers are reviewing your artwork specifications now.', '/welcome', 'general'),
    ('reply-emb-ready', 'Embroidery Files Tested & Ready', 'Great news! Your embroidery design has been digitized and test-stitched. The production-ready files (DST, PES, EMB) and visual production worksheet are attached.', '/embdone', 'deliveries'),
    ('reply-vec-ready', 'Vector Artwork Ready', 'Your artwork has been converted into crisp, high-resolution vector format. The print-ready master files (AI, EPS, SVG, and 300 DPI PDF) are attached.', '/vecdone', 'deliveries'),
    ('reply-custom-offer', 'Custom Offer Sent', 'We have prepared a custom offer tailored specifically to your project requirements. You can review the deliverables, turnaround time, and price in the offer card above.', '/offer', 'offers'),
    ('reply-specs-needed', 'Clarification on Size & Fabric', 'To ensure perfect embroidery density, could you please confirm the required dimensions (width and height in inches or mm) and the target fabric (e.g. cap, polo, jacket back, hoodie)?', '/specs', 'inquiries'),
    ('reply-revisions', 'Revisions Applied', 'We have updated the design according to your revision notes. Please inspect the new files attached and let us know if any further tweaks are needed!', '/revised', 'deliveries')
ON CONFLICT (id) DO NOTHING;

-- 4. REALTIME REPLICATION CONFIGURATION
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
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'saved_replies'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_replies;
    END IF;
END $$;

ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversations access policy" ON public.conversations;
CREATE POLICY "Conversations access policy" ON public.conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Messages access policy" ON public.messages;
CREATE POLICY "Messages access policy" ON public.messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Saved replies access policy" ON public.saved_replies;
CREATE POLICY "Saved replies access policy" ON public.saved_replies FOR ALL USING (true) WITH CHECK (true);
