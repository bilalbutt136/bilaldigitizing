-- Migration: Guest Chat Reliability, Message Persistence & Status Tracking
-- Created: 2026-09-05

-- 1. Add guest_id and status columns to messages
ALTER TABLE IF EXISTS public.messages 
ADD COLUMN IF NOT EXISTS guest_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';

-- 2. Add guest_id to conversations table
ALTER TABLE IF EXISTS public.conversations 
ADD COLUMN IF NOT EXISTS guest_id TEXT;

-- 3. Create indexes for fast guest conversation and message queries
CREATE INDEX IF NOT EXISTS idx_messages_guest_id ON public.messages(guest_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);
CREATE INDEX IF NOT EXISTS idx_conversations_guest_id ON public.conversations(guest_id);

-- 4. Ensure RLS policies permit guests and authenticated users to read/insert chat messages
DO $$
BEGIN
    -- Permit message insertion
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'messages_universal_insert'
    ) THEN
        CREATE POLICY "messages_universal_insert" ON public.messages FOR INSERT WITH CHECK (true);
    END IF;

    -- Permit message select
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'messages_universal_select'
    ) THEN
        CREATE POLICY "messages_universal_select" ON public.messages FOR SELECT USING (true);
    END IF;

    -- Permit conversation upsert
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'conversations_universal_all'
    ) THEN
        CREATE POLICY "conversations_universal_all" ON public.conversations FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
