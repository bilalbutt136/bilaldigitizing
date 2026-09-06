-- ==============================================================================
-- Migration: 20260906000005_stealth_worker_portal_rls.sql
-- Hardened Stealth Worker Portal RLS, Schema Integrity & Storage Policies
-- ==============================================================================

-- 1. Ensure worker_profiles table exists and has all required columns
CREATE TABLE IF NOT EXISTS public.worker_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    experience_years INT DEFAULT 1,
    primary_software TEXT DEFAULT 'Wilcom',
    portfolio_sample_url TEXT,
    portfolio_file_name TEXT,
    bio TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Rejected', 'Suspended', 'pending', 'active', 'rejected', 'suspended')),
    rejection_reason TEXT,
    notes TEXT,
    total_earned NUMERIC(10,2) DEFAULT 0.00,
    pending_payout NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on worker_profiles
ALTER TABLE public.worker_profiles
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS primary_software TEXT DEFAULT 'Wilcom',
    ADD COLUMN IF NOT EXISTS portfolio_sample_url TEXT,
    ADD COLUMN IF NOT EXISTS portfolio_file_name TEXT,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending',
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS total_earned NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS pending_payout NUMERIC(10,2) DEFAULT 0.00;

-- Ensure status constraint accepts both cases
DO $$
BEGIN
    ALTER TABLE public.worker_profiles DROP CONSTRAINT IF EXISTS worker_profiles_status_check;
    ALTER TABLE public.worker_profiles
        ADD CONSTRAINT worker_profiles_status_check 
        CHECK (status IN ('Pending', 'Active', 'Rejected', 'Suspended', 'pending', 'active', 'rejected', 'suspended'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS worker_profiles_email_idx ON public.worker_profiles (lower(email));
CREATE INDEX IF NOT EXISTS worker_profiles_status_idx ON public.worker_profiles (status);

-- Enable RLS on worker_profiles
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate comprehensive RLS policies on worker_profiles
DROP POLICY IF EXISTS "worker_profiles_admin_all" ON public.worker_profiles;
CREATE POLICY "worker_profiles_admin_all" ON public.worker_profiles
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "worker_profiles_insert_all" ON public.worker_profiles;
CREATE POLICY "worker_profiles_insert_all" ON public.worker_profiles
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "worker_profiles_select_own" ON public.worker_profiles;
CREATE POLICY "worker_profiles_select_own" ON public.worker_profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "worker_profiles_update_own" ON public.worker_profiles;
CREATE POLICY "worker_profiles_update_own" ON public.worker_profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid() OR public.is_admin())
    WITH CHECK (id = auth.uid() OR public.is_admin());

GRANT ALL ON TABLE public.worker_profiles TO anon, authenticated, service_role;

-- 2. Ensure workers directory table has all statuses and grants
CREATE TABLE IF NOT EXISTS public.workers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    specialty TEXT DEFAULT 'Embroidery Digitizer',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'busy', 'paused', 'pending', 'rejected', 'suspended', 'Active', 'Pending', 'Rejected', 'Suspended')),
    assigned_orders_count INT DEFAULT 0,
    completed_orders_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workers_admin_all" ON public.workers;
CREATE POLICY "workers_admin_all" ON public.workers
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "workers_view_self_or_active" ON public.workers;
CREATE POLICY "workers_view_self_or_active" ON public.workers
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR lower(status) = 'active' OR public.is_admin());

GRANT ALL ON TABLE public.workers TO anon, authenticated, service_role;

-- 3. Ensure orders table columns and RLS are complete
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS worker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS worker_status TEXT DEFAULT 'Unassigned',
    ADD COLUMN IF NOT EXISTS worker_file_url TEXT,
    ADD COLUMN IF NOT EXISTS worker_file_name TEXT,
    ADD COLUMN IF NOT EXISTS worker_notes TEXT,
    ADD COLUMN IF NOT EXISTS admin_worker_feedback TEXT,
    ADD COLUMN IF NOT EXISTS worker_assigned_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS worker_submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS worker_reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS quoted_price NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS quoted_price_pkr NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS worker_payment_status TEXT DEFAULT 'Unpaid';

DO $$
BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_worker_status_check;
    ALTER TABLE public.orders 
        ADD CONSTRAINT orders_worker_status_check 
        CHECK (worker_status IN ('Unassigned', 'Pending_Worker_Acceptance', 'In Progress', 'Review Pending', 'Revisions Needed', 'Completed'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_worker_payment_status_check;
    ALTER TABLE public.orders 
        ADD CONSTRAINT orders_worker_payment_status_check 
        CHECK (worker_payment_status IN ('Unpaid', 'Paid', 'Pending'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 4. Storage Buckets configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('worker-applications', 'worker-applications', true, 52428800, NULL),
    ('worker-uploads', 'worker-uploads', true, 52428800, NULL),
    ('worker-invoices', 'worker-invoices', true, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    public = true;

-- Storage RLS
DROP POLICY IF EXISTS "Worker Applications Storage Read" ON storage.objects;
CREATE POLICY "Worker Applications Storage Read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'worker-applications');

DROP POLICY IF EXISTS "Worker Applications Storage Insert" ON storage.objects;
CREATE POLICY "Worker Applications Storage Insert"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'worker-applications');

DROP POLICY IF EXISTS "Worker Uploads Storage Read" ON storage.objects;
CREATE POLICY "Worker Uploads Storage Read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'worker-uploads');

DROP POLICY IF EXISTS "Worker Uploads Storage Insert" ON storage.objects;
CREATE POLICY "Worker Uploads Storage Insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'worker-uploads');

DROP POLICY IF EXISTS "worker_invoices_admin_all" ON storage.objects;
CREATE POLICY "worker_invoices_admin_all" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'worker-invoices' AND public.is_admin())
    WITH CHECK (bucket_id = 'worker-invoices' AND public.is_admin());

DROP POLICY IF EXISTS "worker_invoices_worker_read" ON storage.objects;
CREATE POLICY "worker_invoices_worker_read" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'worker-invoices');

DROP POLICY IF EXISTS "worker_invoices_public_read" ON storage.objects;
CREATE POLICY "worker_invoices_public_read" ON storage.objects
    FOR SELECT TO anon
    USING (bucket_id = 'worker-invoices');
