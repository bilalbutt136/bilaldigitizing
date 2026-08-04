-- ====================================================================
-- BDIGITIZING.PRO - SUPABASE DATABASE SCHEMA & STORAGE CONFIGURATION
-- ====================================================================

create extension if not exists pgcrypto;

-- 1. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    company TEXT,
    company_name TEXT,
    role TEXT DEFAULT 'customer',
    wallet_balance NUMERIC(10, 2) DEFAULT 0,
    orders_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.clients (id, name, full_name, email, company, company_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'company', ''),
    COALESCE(new.raw_user_meta_data->>'company_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    client_id TEXT,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    service_category TEXT NOT NULL,
    service_type TEXT,
    placement_type TEXT,
    fabric_type TEXT,
    dimensions JSONB DEFAULT '{"width": 3.5, "height": 3.0, "unit": "inches"}'::jsonb,
    estimated_stitches INT DEFAULT 12400,
    colors_count INT DEFAULT 4,
    requested_formats TEXT[] DEFAULT ARRAY['dst', 'pes', 'emb', 'pdf'],
    is_rush BOOLEAN DEFAULT FALSE,
    price NUMERIC(10, 2) DEFAULT 15.00,
    cost NUMERIC(10, 2) DEFAULT 15.00,
    payment_status TEXT DEFAULT 'pending', -- 'paid' | 'pending' | 'wallet'
    notes TEXT,
    artwork_url TEXT,
    image_url TEXT,
    logo TEXT,
    status TEXT DEFAULT 'awaiting_payment',
    output_file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS orders_client_email_idx ON public.orders (client_email);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);

-- 3. ORDER FILES TABLE
CREATE TABLE IF NOT EXISTS public.order_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_format TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'client_artwork',
    bucket_name TEXT NOT NULL DEFAULT 'client-uploads',
    file_path TEXT NOT NULL,
    file_url TEXT,
    public_url TEXT NOT NULL,
    uploaded_by TEXT DEFAULT 'client',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REVISIONS TABLE
CREATE TABLE IF NOT EXISTS public.revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    requested_by TEXT NOT NULL DEFAULT 'Client',
    note TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_email TEXT NOT NULL,
    type TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT DEFAULT 'Wallet Credit',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ADMINS TABLE
CREATE TABLE IF NOT EXISTS public.admins (
    email TEXT PRIMARY KEY,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ORDER MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.order_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    sender_email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CATALOG TABLES
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    price TEXT,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.pricing_cards (
    id TEXT PRIMARY KEY,
    tier TEXT,
    price TEXT,
    features TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.patch_cards (
    id TEXT PRIMARY KEY,
    type TEXT,
    price TEXT,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.portfolio (
    id TEXT PRIMARY KEY,
    title TEXT,
    image TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.sew_outs (
    id TEXT PRIMARY KEY,
    title TEXT,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.hero_slides (
    id TEXT PRIMARY KEY,
    title TEXT,
    subtitle TEXT,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.digitizers (
    id TEXT PRIMARY KEY,
    name TEXT,
    role TEXT,
    avatar TEXT,
    rating TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.site_config (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. INVOICES & RECEIPTS (BoltPayouts)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- HELPER FUNCTIONS FOR RLS
-- ====================================================================
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT LANGUAGE SQL STABLE AS $$
  SELECT lower((auth.jwt() ->> 'email'))
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_user_email() IN (
    SELECT lower(email) FROM public.admins
  )
$$;

-- ====================================================================
-- SECURE WALLET & TRANSACTION FUNCTIONS (RPC)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.deposit_funds(p_client_email TEXT, p_amount NUMERIC, p_payment_method TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_client_id UUID;
    v_new_balance NUMERIC;
BEGIN
    -- Verify the caller is the owner or an admin
    IF lower(p_client_email) != public.current_user_email() AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized to deposit funds for this email';
    END IF;

    -- Ensure amount is positive
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Deposit amount must be positive';
    END IF;

    -- Update balance and get new balance
    UPDATE public.clients
    SET wallet_balance = wallet_balance + p_amount
    WHERE lower(email) = lower(p_client_email)
    RETURNING id, wallet_balance INTO v_client_id, v_new_balance;

    IF v_client_id IS NULL THEN
        RAISE EXCEPTION 'Client not found';
    END IF;

    -- Insert transaction log
    INSERT INTO public.transactions (client_email, type, amount, payment_method, description)
    VALUES (lower(p_client_email), 'deposit', p_amount, p_payment_method, 'Studio Wallet Deposit Top-up (+ $' || ROUND(p_amount, 2) || ')');

    RETURN v_new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(p_client_email TEXT, p_amount NUMERIC, p_order_id TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_client_id UUID;
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    -- Verify the caller is the owner or an admin
    IF lower(p_client_email) != public.current_user_email() AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized to deduct funds for this email';
    END IF;

    -- Ensure amount is positive
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Deduction amount must be positive';
    END IF;

    -- Get current balance
    SELECT id, wallet_balance INTO v_client_id, v_current_balance
    FROM public.clients
    WHERE lower(email) = lower(p_client_email);

    IF v_client_id IS NULL THEN
        RAISE EXCEPTION 'Client not found';
    END IF;

    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds in wallet';
    END IF;

    -- Deduct balance
    UPDATE public.clients
    SET wallet_balance = wallet_balance - p_amount
    WHERE id = v_client_id
    RETURNING wallet_balance INTO v_new_balance;

    -- Insert transaction log
    INSERT INTO public.transactions (client_email, type, amount, payment_method, description)
    VALUES (lower(p_client_email), 'order_payment', p_amount, 'Studio Wallet Credit', 'Order Brief Payment for ' || p_order_id || ' (- $' || ROUND(p_amount, 2) || ')');

    -- Update order to paid and in_progress
    IF p_order_id IS NOT NULL THEN
        UPDATE public.orders
        SET payment_status = 'paid', status = 'in_progress'
        WHERE id = p_order_id;
    END IF;

    RETURN v_new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_order_paid(p_order_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.orders
    SET payment_status = 'paid', status = 'in_progress'
    WHERE id = p_order_id;
END;
$$;

-- ====================================================================
-- TRIGGERS FOR ORDER SECURITY & STATE MACHINE
-- ====================================================================

CREATE OR REPLACE FUNCTION public.enforce_order_security()
RETURNS trigger AS $$
BEGIN
  -- If not an admin, prevent changing sensitive fields
  -- Bypass if current_user is postgres or supabase_admin (e.g. running from a SECURITY DEFINER function)
  IF NOT public.is_admin() AND current_user != 'postgres' AND current_user != 'supabase_admin' THEN
    IF NEW.price IS DISTINCT FROM OLD.price THEN
      RAISE EXCEPTION 'Clients cannot modify the order price.';
    END IF;
    IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
      RAISE EXCEPTION 'Clients cannot modify the payment status.';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Clients cannot modify the order status directly.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_order_security ON public.orders;
CREATE TRIGGER trg_enforce_order_security
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_order_security();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orders_anon_all ON public.orders;
DROP POLICY IF EXISTS order_files_anon_all ON public.order_files;
DROP POLICY IF EXISTS revisions_anon_all ON public.revisions;
DROP POLICY IF EXISTS clients_anon_all ON public.clients;
DROP POLICY IF EXISTS transactions_anon_all ON public.transactions;

DROP POLICY IF EXISTS orders_select_own ON public.orders;
DROP POLICY IF EXISTS orders_insert_own ON public.orders;
DROP POLICY IF EXISTS orders_update_own ON public.orders;
DROP POLICY IF EXISTS orders_delete_own ON public.orders;
CREATE POLICY orders_select_own ON public.orders FOR SELECT USING (lower(client_email) = public.current_user_email() OR public.is_admin());
CREATE POLICY orders_insert_own ON public.orders FOR INSERT WITH CHECK (lower(client_email) = public.current_user_email() OR public.is_admin());
CREATE POLICY orders_update_own ON public.orders FOR UPDATE USING (lower(client_email) = public.current_user_email() OR public.is_admin()) WITH CHECK (lower(client_email) = public.current_user_email() OR public.is_admin());
CREATE POLICY orders_delete_own ON public.orders FOR DELETE USING (lower(client_email) = public.current_user_email() OR public.is_admin());

DROP POLICY IF EXISTS order_files_select_own ON public.order_files;
DROP POLICY IF EXISTS order_files_insert_own ON public.order_files;
CREATE POLICY order_files_select_own ON public.order_files FOR SELECT USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND lower(o.client_email) = public.current_user_email()));
CREATE POLICY order_files_insert_own ON public.order_files FOR INSERT WITH CHECK (public.is_admin() OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND lower(o.client_email) = public.current_user_email()));

DROP POLICY IF EXISTS revisions_select_own ON public.revisions;
DROP POLICY IF EXISTS revisions_insert_own ON public.revisions;
CREATE POLICY revisions_select_own ON public.revisions FOR SELECT USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND lower(o.client_email) = public.current_user_email()));
CREATE POLICY revisions_insert_own ON public.revisions FOR INSERT WITH CHECK (public.is_admin() OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND lower(o.client_email) = public.current_user_email()));

DROP POLICY IF EXISTS clients_select_own ON public.clients;
DROP POLICY IF EXISTS clients_update_own ON public.clients;
CREATE POLICY clients_select_own ON public.clients FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY clients_update_own ON public.clients FOR UPDATE USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS transactions_select_own ON public.transactions;
CREATE POLICY transactions_select_own ON public.transactions FOR SELECT USING (public.is_admin() OR lower(client_email) = public.current_user_email());

DROP POLICY IF EXISTS admins_read_only ON public.admins;
DROP POLICY IF EXISTS admins_admin_write ON public.admins;
CREATE POLICY admins_read_only ON public.admins FOR SELECT USING (public.is_admin());
CREATE POLICY admins_admin_write ON public.admins FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Catalog read-only
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY services_read_all ON public.services FOR SELECT USING (true);
ALTER TABLE public.pricing_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY pricing_cards_read_all ON public.pricing_cards FOR SELECT USING (true);

-- ====================================================================
-- STORAGE BUCKETS CONFIGURATION
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('client-uploads', 'client-uploads', false) ON CONFLICT (id) DO UPDATE SET public = false;
INSERT INTO storage.buckets (id, name, public) VALUES ('finished-packages', 'finished-packages', false) ON CONFLICT (id) DO UPDATE SET public = false;

-- Admins can do everything in storage
DROP POLICY IF EXISTS storage_admin_all ON storage.objects;
CREATE POLICY storage_admin_all ON storage.objects FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Client Uploads: Clients can read their own uploads and insert new ones
DROP POLICY IF EXISTS storage_client_uploads_read ON storage.objects;
CREATE POLICY storage_client_uploads_read ON storage.objects FOR SELECT USING (
  bucket_id = 'client-uploads' AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS storage_client_uploads_write ON storage.objects;
CREATE POLICY storage_client_uploads_write ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'client-uploads' AND auth.role() = 'authenticated'
);

-- Finished Packages: Clients can read them if they are authenticated
DROP POLICY IF EXISTS storage_finished_packages_read ON storage.objects;
CREATE POLICY storage_finished_packages_read ON storage.objects FOR SELECT USING (
  bucket_id = 'finished-packages' AND auth.role() = 'authenticated'
);

