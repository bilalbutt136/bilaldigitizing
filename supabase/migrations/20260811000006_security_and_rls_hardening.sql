-- Migration 06: Security, Row Level Security (RLS) & Payment Function Hardening
-- Codified to ensure production compliance, eliminate role escalation, and secure webhooks

-- 1. Ensure deposit_funds supports service_role execution & admin access
CREATE OR REPLACE FUNCTION public.deposit_funds(p_client_email text, p_amount numeric, p_payment_method text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $_$
DECLARE
    v_client_id UUID;
    v_new_balance NUMERIC;
BEGIN
    -- Verify the caller is service_role, owner, or an admin
    IF auth.role() != 'service_role' AND lower(p_client_email) != public.current_user_email() AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized to deposit funds for this email';
    END IF;

    -- Ensure amount is positive
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Deposit amount must be positive';
    END IF;

    -- Update balance
    UPDATE public.clients
    SET wallet_balance = wallet_balance + p_amount,
        updated_at = NOW()
    WHERE lower(email) = lower(p_client_email)
    RETURNING id, wallet_balance INTO v_client_id, v_new_balance;

    IF v_client_id IS NULL THEN
        RAISE EXCEPTION 'Client not found';
    END IF;

    -- Insert transaction log
    INSERT INTO public.transactions (user_id, client_email, type, amount, payment_method, description, created_at)
    VALUES (v_client_id, lower(p_client_email), 'deposit', p_amount, p_payment_method, 'Studio Wallet Deposit Top-up (+ $' || ROUND(p_amount, 2) || ')', NOW());

    RETURN v_new_balance;
END;
$_$;

ALTER FUNCTION public.deposit_funds(p_client_email text, p_amount numeric, p_payment_method text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.deposit_funds(p_client_email text, p_amount numeric, p_payment_method text) TO service_role;
GRANT ALL ON FUNCTION public.deposit_funds(p_client_email text, p_amount numeric, p_payment_method text) TO authenticated;

-- 2. Ensure deduct_wallet_balance supports service_role execution
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(p_client_email text, p_amount numeric, p_order_id text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $_$
DECLARE
    v_client_id UUID;
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    -- Verify the caller is service_role, owner, or an admin
    IF auth.role() != 'service_role' AND lower(p_client_email) != public.current_user_email() AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized to deduct funds for this email';
    END IF;

    -- Get current balance with row-level lock
    SELECT id, wallet_balance INTO v_client_id, v_current_balance
    FROM public.clients
    WHERE lower(email) = lower(p_client_email)
    FOR UPDATE;

    IF v_client_id IS NULL THEN
        RAISE EXCEPTION 'Client not found';
    END IF;

    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds in wallet';
    END IF;

    -- Deduct balance
    UPDATE public.clients
    SET wallet_balance = wallet_balance - p_amount,
        updated_at = NOW()
    WHERE id = v_client_id
    RETURNING wallet_balance INTO v_new_balance;

    -- Insert transaction log
    INSERT INTO public.transactions (user_id, client_email, type, amount, payment_method, description, created_at)
    VALUES (v_client_id, lower(p_client_email), 'order_payment', -p_amount, 'Studio Wallet Credit', 'Order Brief Payment' || CASE WHEN p_order_id IS NOT NULL AND p_order_id != '' THEN ' for #' || p_order_id ELSE '' END || ' (- $' || ROUND(p_amount, 2) || ')', NOW());

    -- Update order to paid and in_progress if provided
    IF p_order_id IS NOT NULL AND p_order_id != '' THEN
        UPDATE public.orders
        SET payment_status = 'paid', status = 'in_progress', paid_at = NOW(), updated_at = NOW()
        WHERE id = p_order_id;
    END IF;

    RETURN v_new_balance;
END;
$_$;

ALTER FUNCTION public.deduct_wallet_balance(p_client_email text, p_amount numeric, p_order_id text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.deduct_wallet_balance(p_client_email text, p_amount numeric, p_order_id text) TO service_role;
GRANT ALL ON FUNCTION public.deduct_wallet_balance(p_client_email text, p_amount numeric, p_order_id text) TO authenticated;

-- 3. Ensure admins table exists with proper RLS
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admins' AND policyname = 'admins_read_policy'
  ) THEN
    CREATE POLICY "admins_read_policy" ON public.admins FOR SELECT USING (true);
  END IF;
END $$;

-- 4. Re-harden RLS on CMS / Catalog tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patch_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digitizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sew_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

-- 5. Drop over-permissive authenticated write policies if any exist
DO $$
BEGIN
  -- services
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'services_authenticated_write') THEN
    DROP POLICY "services_authenticated_write" ON public.services;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'services_read_all') THEN
    CREATE POLICY "services_read_all" ON public.services FOR SELECT USING (true);
  END IF;

  -- pricing_cards
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pricing_cards' AND policyname = 'pricing_cards_authenticated_write') THEN
    DROP POLICY "pricing_cards_authenticated_write" ON public.pricing_cards;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pricing_cards' AND policyname = 'pricing_cards_read_all') THEN
    CREATE POLICY "pricing_cards_read_all" ON public.pricing_cards FOR SELECT USING (true);
  END IF;

  -- patch_cards
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patch_cards' AND policyname = 'patch_cards_authenticated_write') THEN
    DROP POLICY "patch_cards_authenticated_write" ON public.patch_cards;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patch_cards' AND policyname = 'patch_cards_read_all') THEN
    CREATE POLICY "patch_cards_read_all" ON public.patch_cards FOR SELECT USING (true);
  END IF;

  -- site_config
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_config' AND policyname = 'site_config_authenticated_write') THEN
    DROP POLICY "site_config_authenticated_write" ON public.site_config;
  END IF;
END $$;
