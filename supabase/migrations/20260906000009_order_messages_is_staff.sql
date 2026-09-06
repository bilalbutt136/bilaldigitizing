-- Migration: 20260906000009_order_messages_is_staff.sql
-- Description: Add is_staff column to order_messages if not exists and refresh cache

ALTER TABLE public.order_messages 
    ADD COLUMN IF NOT EXISTS is_staff boolean DEFAULT false;

NOTIFY pgrst, 'reload schema';
