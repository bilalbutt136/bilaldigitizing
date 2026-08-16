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

-- 3. Drop overly permissive "Admin write access" policies that used auth.role() = 'authenticated'
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admin write access" ON public.cms_content;
    DROP POLICY IF EXISTS "Admin write access" ON public.digitizers;
    DROP POLICY IF EXISTS "Admin write access" ON public.hero_slides;
    DROP POLICY IF EXISTS "Admin write access" ON public.patch_cards;
    DROP POLICY IF EXISTS "Admins have full access to clients" ON public.clients;
    DROP POLICY IF EXISTS "Allow public read/write on users" ON public.users;
    DROP POLICY IF EXISTS "Admin write access" ON public.home_page_settings;
    DROP POLICY IF EXISTS "Admin write access" ON public.home_page_slides;
    DROP POLICY IF EXISTS "Admin write access" ON public.trust_stats;
    DROP POLICY IF EXISTS "Admin write access" ON public.trust_features;
    DROP POLICY IF EXISTS "Admin write access" ON public.workflow_steps;
    DROP POLICY IF EXISTS "Admin write access" ON public.pricing_static_cards;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 4. Re-enforce strict admin-only write policies on CMS & Catalog tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cms_content' AND policyname = 'cms_content_admin_write') THEN
        CREATE POLICY cms_content_admin_write ON public.cms_content USING (public.is_admin()) WITH CHECK (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'home_page_settings' AND policyname = 'home_page_settings_admin_write') THEN
        CREATE POLICY home_page_settings_admin_write ON public.home_page_settings USING (public.is_admin()) WITH CHECK (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'home_page_slides' AND policyname = 'home_page_slides_admin_write') THEN
        CREATE POLICY home_page_slides_admin_write ON public.home_page_slides USING (public.is_admin()) WITH CHECK (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trust_stats' AND policyname = 'trust_stats_admin_write') THEN
        CREATE POLICY trust_stats_admin_write ON public.trust_stats USING (public.is_admin()) WITH CHECK (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trust_features' AND policyname = 'trust_features_admin_write') THEN
        CREATE POLICY trust_features_admin_write ON public.trust_features USING (public.is_admin()) WITH CHECK (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workflow_steps' AND policyname = 'workflow_steps_admin_write') THEN
        CREATE POLICY workflow_steps_admin_write ON public.workflow_steps USING (public.is_admin()) WITH CHECK (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pricing_static_cards' AND policyname = 'pricing_static_cards_admin_write') THEN
        CREATE POLICY pricing_static_cards_admin_write ON public.pricing_static_cards USING (public.is_admin()) WITH CHECK (public.is_admin());
    END IF;
END $$;

-- 5. Secure media_assets table
DO $$
BEGIN
    DROP POLICY IF EXISTS "media_assets_allow_insert" ON public.media_assets;
    DROP POLICY IF EXISTS "media_assets_allow_update" ON public.media_assets;
    DROP POLICY IF EXISTS "media_assets_allow_delete" ON public.media_assets;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_assets' AND policyname = 'media_assets_admin_insert') THEN
        CREATE POLICY media_assets_admin_insert ON public.media_assets FOR INSERT WITH CHECK (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_assets' AND policyname = 'media_assets_admin_update') THEN
        CREATE POLICY media_assets_admin_update ON public.media_assets FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_assets' AND policyname = 'media_assets_admin_delete') THEN
        CREATE POLICY media_assets_admin_delete ON public.media_assets FOR DELETE USING (public.is_admin());
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
