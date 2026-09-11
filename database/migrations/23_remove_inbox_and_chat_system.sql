-- ==============================================================================
-- MIGRATION: Complete Removal of Inbox and Chat System
-- Date: 2026-09-11
-- Description:
-- 1. Permanently drops tables: messages, conversations, and order_messages
-- 2. Permanently drops notification function trigger for messages: fn_notify_new_message()
-- 3. Deletes and purges chat-attachments storage bucket and objects
-- ==============================================================================

-- 1. DROP CHAT AND INBOX TABLES
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.order_messages CASCADE;

-- 2. DROP MESSAGE NOTIFICATION TRIGGER FUNCTION
DROP FUNCTION IF EXISTS public.fn_notify_new_message() CASCADE;

-- 3. DROP STORAGE RLS POLICIES SPECIFIC TO CHAT ATTACHMENTS (if any exist)
DROP POLICY IF EXISTS "Chat Attachments Access" ON storage.objects;
DROP POLICY IF EXISTS "Chat Attachments Upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to chat-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated selects from chat-attachments" ON storage.objects;
