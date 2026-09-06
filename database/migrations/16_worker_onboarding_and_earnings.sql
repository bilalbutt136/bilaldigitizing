-- ==============================================================================
-- Migration: 16_worker_onboarding_and_earnings.sql
-- Worker Onboarding, Profiles, Earnings Ledger, and Storage
-- ==============================================================================

-- 1. Create public.worker_profiles table
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
    status TEXT DEFAULT 'Pending' CHECK (status IN ('pending', 'active', 'rejected', 'suspended', 'Pending', 'Active', 'Rejected', 'Suspended')),
    rejection_reason TEXT,
    notes TEXT,
    total_earned NUMERIC(10,2) DEFAULT 0.00,
    pending_payout NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS worker_profiles_email_idx ON public.worker_profiles (lower(email));
CREATE INDEX IF NOT EXISTS worker_profiles_status_idx ON public.worker_profiles (status);

-- Enable RLS on worker_profiles
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;

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

-- 2. Ensure public.workers table has compatibility columns and sync trigger
CREATE TABLE IF NOT EXISTS public.workers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    specialty TEXT DEFAULT 'Embroidery Digitizer',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'busy', 'paused', 'pending', 'rejected', 'suspended')),
    assigned_orders_count INT DEFAULT 0,
    completed_orders_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync trigger between worker_profiles and workers
CREATE OR REPLACE FUNCTION public.sync_worker_profile_to_workers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.workers (id, name, email, phone, specialty, status, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.name,
        NEW.email,
        NEW.phone,
        COALESCE(NEW.primary_software, 'Embroidery Digitizer'),
        NEW.status,
        NEW.created_at,
        NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        specialty = EXCLUDED.specialty,
        status = EXCLUDED.status,
        updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_worker_profile ON public.worker_profiles;
CREATE TRIGGER trigger_sync_worker_profile
AFTER INSERT OR UPDATE ON public.worker_profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_worker_profile_to_workers();

-- 3. Add worker payout tracking columns to public.orders
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
    ADD COLUMN IF NOT EXISTS worker_payout NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS worker_payout_status TEXT DEFAULT 'unpaid';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_worker_payout_status_check'
    ) THEN
        ALTER TABLE public.orders 
            ADD CONSTRAINT orders_worker_payout_status_check 
            CHECK (worker_payout_status IN ('unpaid', 'pending', 'paid'));
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 4. Create public.worker_earnings ledger table
CREATE TABLE IF NOT EXISTS public.worker_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
    order_number TEXT,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS worker_earnings_worker_id_idx ON public.worker_earnings (worker_id);
CREATE INDEX IF NOT EXISTS worker_earnings_status_idx ON public.worker_earnings (status);

-- Enable RLS on worker_earnings
ALTER TABLE public.worker_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "worker_earnings_admin_all" ON public.worker_earnings;
CREATE POLICY "worker_earnings_admin_all" ON public.worker_earnings
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "worker_earnings_select_own" ON public.worker_earnings;
CREATE POLICY "worker_earnings_select_own" ON public.worker_earnings
    FOR SELECT TO authenticated
    USING (worker_id = auth.uid() OR public.is_admin());

-- 5. Updated helper function to check if caller is an active approved worker
CREATE OR REPLACE FUNCTION public.is_worker()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.worker_profiles WHERE id = auth.uid() AND lower(status) = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.workers WHERE id = auth.uid() AND lower(status) = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.clients WHERE user_id = auth.uid() AND role = 'worker'
  );
$$;

-- 6. Storage Bucket for Worker Application Samples & Resumes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'worker-applications',
    'worker-applications',
    true,
    52428800, -- 50MB
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = NULL;

DROP POLICY IF EXISTS "Worker Applications Storage Read" ON storage.objects;
CREATE POLICY "Worker Applications Storage Read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'worker-applications');

DROP POLICY IF EXISTS "Worker Applications Storage Insert" ON storage.objects;
CREATE POLICY "Worker Applications Storage Insert"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'worker-applications');
