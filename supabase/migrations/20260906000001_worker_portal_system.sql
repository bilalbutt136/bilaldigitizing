-- ==============================================================================
-- Migration: 20260906000001_worker_portal_system.sql
-- Worker Portal & Digitizer Workflow Integration
-- ==============================================================================

-- 1. Create public.workers directory table
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

CREATE INDEX IF NOT EXISTS workers_email_idx ON public.workers (lower(email));
CREATE INDEX IF NOT EXISTS workers_status_idx ON public.workers (status);

-- Enable RLS on workers table
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workers_admin_all" ON public.workers;
CREATE POLICY "workers_admin_all" ON public.workers
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "workers_view_self_or_active" ON public.workers;
CREATE POLICY "workers_view_self_or_active" ON public.workers
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR status IN ('active', 'Active') OR public.is_admin());

-- 2. Update public.orders table with worker tracking columns
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS worker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS worker_status TEXT DEFAULT 'Unassigned',
    ADD COLUMN IF NOT EXISTS worker_file_url TEXT,
    ADD COLUMN IF NOT EXISTS worker_file_name TEXT,
    ADD COLUMN IF NOT EXISTS worker_notes TEXT,
    ADD COLUMN IF NOT EXISTS admin_worker_feedback TEXT,
    ADD COLUMN IF NOT EXISTS worker_assigned_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS worker_submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS worker_reviewed_at TIMESTAMPTZ;

-- Ensure constraint on worker_status
DO $$
BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_worker_status_check;
    ALTER TABLE public.orders 
        ADD CONSTRAINT orders_worker_status_check 
        CHECK (worker_status IN ('Unassigned', 'Pending_Worker_Acceptance', 'In Progress', 'Review Pending', 'Revisions Needed', 'Completed'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Create performance indexes for worker lookups
CREATE INDEX IF NOT EXISTS orders_worker_id_idx ON public.orders (worker_id);
CREATE INDEX IF NOT EXISTS orders_worker_status_idx ON public.orders (worker_status);

-- 3. Helper function to check if caller is an active worker
CREATE OR REPLACE FUNCTION public.is_worker()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workers WHERE id = auth.uid() AND lower(status) = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.clients WHERE user_id = auth.uid() AND role = 'worker'
  );
$$;

-- 4. Update Row Level Security (RLS) on public.orders for Workers
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
CREATE POLICY "orders_select_policy" ON public.orders
    FOR SELECT TO authenticated
    USING (
        public.is_admin() 
        OR (lower(client_email) = public.current_user_email())
        OR (worker_id = auth.uid())
    );

DROP POLICY IF EXISTS "orders_update_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
CREATE POLICY "orders_update_policy" ON public.orders
    FOR UPDATE TO authenticated
    USING (
        public.is_admin() 
        OR (lower(client_email) = public.current_user_email())
        OR (worker_id = auth.uid())
    )
    WITH CHECK (
        public.is_admin() 
        OR (lower(client_email) = public.current_user_email())
        OR (worker_id = auth.uid())
    );

-- 5. Storage Bucket for Worker Deliveries
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'worker-uploads',
    'worker-uploads',
    true,
    52428800, -- 50MB
    NULL      -- Universal embroidery format support
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = NULL;

-- Storage RLS: Allow authenticated workers and public read of worker files
DROP POLICY IF EXISTS "Worker Uploads Storage Read" ON storage.objects;
CREATE POLICY "Worker Uploads Storage Read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'worker-uploads');

DROP POLICY IF EXISTS "Worker Uploads Storage Insert" ON storage.objects;
CREATE POLICY "Worker Uploads Storage Insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'worker-uploads');
