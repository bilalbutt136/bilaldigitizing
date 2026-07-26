-- ====================================================================
-- BDIGITIZING.PRO - SUPABASE DATABASE SCHEMA & STORAGE CONFIGURATION
-- Copy and paste this script into your Supabase Dashboard SQL Editor
-- ====================================================================

-- 1. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
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
    payment_status TEXT DEFAULT 'Paid', -- 'Paid' | 'Pending' | 'Wallet'
    notes TEXT,
    artwork_url TEXT,
    image_url TEXT,
    logo TEXT,
    status TEXT DEFAULT 'submitted',
    output_file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORDER FILES TABLE (CLIENT ARTWORK & ADMIN MACHINE PACKAGES)
CREATE TABLE IF NOT EXISTS public.order_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_format TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'client_artwork', -- 'client_artwork' | 'finished_machine_file'
    bucket_name TEXT NOT NULL DEFAULT 'client-uploads',
    file_path TEXT NOT NULL,
    file_url TEXT,
    public_url TEXT NOT NULL,
    uploaded_by TEXT DEFAULT 'client',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. REVISIONS TABLE (CLIENT REVISION REQUEST LOGS)
CREATE TABLE IF NOT EXISTS public.revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    requested_by TEXT NOT NULL DEFAULT 'Client',
    note TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REGISTERED CLIENT SHOPS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    company TEXT,
    company_name TEXT,
    password TEXT,
    role TEXT DEFAULT 'customer',
    wallet_balance NUMERIC(10, 2) DEFAULT 150.00,
    orders_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. WALLET TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_email TEXT NOT NULL,
    type TEXT NOT NULL, -- 'deposit' | 'order_payment' | 'refund'
    amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT DEFAULT 'Wallet Credit',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & PERMISSIONS
-- ====================================================================
-- Enable RLS and apply explicit permissive policies for demo platform
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read/write on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public read/write on order_files" ON public.order_files;
DROP POLICY IF EXISTS "Allow public read/write on revisions" ON public.revisions;
DROP POLICY IF EXISTS "Allow public read/write on clients" ON public.clients;
DROP POLICY IF EXISTS "Allow public read/write on transactions" ON public.transactions;

CREATE POLICY "Allow public read/write on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on order_files" ON public.order_files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on revisions" ON public.revisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- STORAGE BUCKETS CONFIGURATION
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('client-uploads', 'client-uploads', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('finished-packages', 'finished-packages', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Public Read/Write Policies
DROP POLICY IF EXISTS "Public Read/Write Client Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Read/Write Finished Packages" ON storage.objects;

CREATE POLICY "Public Read/Write Client Uploads" ON storage.objects FOR ALL 
USING (bucket_id = 'client-uploads') WITH CHECK (bucket_id = 'client-uploads');

CREATE POLICY "Public Read/Write Finished Packages" ON storage.objects FOR ALL 
USING (bucket_id = 'finished-packages') WITH CHECK (bucket_id = 'finished-packages');
