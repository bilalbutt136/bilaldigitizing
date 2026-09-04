-- Migration: 20260904000003_messages_reliability_and_offer_states.sql
-- Description: Add deleted_at for soft deletes, idempotency_key, and payment_status to custom_offers, plus performance indexes.

-- 1. Enhance messages table
ALTER TABLE IF EXISTS public.messages 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS offer_id TEXT,
ADD COLUMN IF NOT EXISTS offer_data JSONB,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Enhance custom_offers table
ALTER TABLE IF EXISTS public.custom_offers 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- 3. Enhance orders table to ensure payment_status exists
ALTER TABLE IF EXISTS public.orders
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- 4. Create performance & search indexes
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON public.messages(deleted_at);
CREATE INDEX IF NOT EXISTS idx_messages_idempotency ON public.messages(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_messages_client_email ON public.messages(client_email);
CREATE INDEX IF NOT EXISTS idx_messages_offer_id ON public.messages(offer_id);

CREATE INDEX IF NOT EXISTS idx_custom_offers_client_email ON public.custom_offers(client_email);
CREATE INDEX IF NOT EXISTS idx_custom_offers_status_payment ON public.custom_offers(status, payment_status);
CREATE INDEX IF NOT EXISTS idx_custom_offers_conv_id ON public.custom_offers(conversation_id);
CREATE INDEX IF NOT EXISTS idx_custom_offers_idempotency ON public.custom_offers(idempotency_key);
