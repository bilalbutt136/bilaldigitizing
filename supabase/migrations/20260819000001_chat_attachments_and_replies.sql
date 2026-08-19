-- Migration: 20260819000001_chat_attachments_and_replies.sql
-- Description: Add attachment_url, attachment_name, attachment_size, attachment_type, and reply_to for WhatsApp-style chat features

DO $$
BEGIN
    -- 1. Enhance messages table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'attachment_url'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN attachment_url text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'attachment_name'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN attachment_name text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'attachment_size'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN attachment_size text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'attachment_type'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN attachment_type text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'reply_to'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN reply_to jsonb;
    END IF;

    -- 2. Enhance order_messages table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'order_messages' AND column_name = 'attachment_url'
    ) THEN
        ALTER TABLE public.order_messages ADD COLUMN attachment_url text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'order_messages' AND column_name = 'attachment_name'
    ) THEN
        ALTER TABLE public.order_messages ADD COLUMN attachment_name text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'order_messages' AND column_name = 'attachment_size'
    ) THEN
        ALTER TABLE public.order_messages ADD COLUMN attachment_size text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'order_messages' AND column_name = 'reply_to'
    ) THEN
        ALTER TABLE public.order_messages ADD COLUMN reply_to jsonb;
    END IF;
END $$;
