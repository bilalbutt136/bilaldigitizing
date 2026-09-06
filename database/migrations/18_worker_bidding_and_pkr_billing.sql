-- ==============================================================================
-- Migration: 18_worker_bidding_and_pkr_billing.sql
-- Worker Job Bidding (PKR), Orders Quoted Price, Ledger & Payouts Table
-- ==============================================================================

-- 1. Ensure orders table has quoted_price (in PKR) and worker_payment_status
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS quoted_price NUMERIC(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS quoted_price_pkr NUMERIC(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS worker_payment_status TEXT DEFAULT 'Unpaid';

-- Ensure worker_payment_status check constraint
DO $$
BEGIN
  ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_worker_payment_status_check;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_worker_payment_status_check 
  CHECK (worker_payment_status IN ('Unpaid', 'Paid', 'Pending'));

-- 2. Create public.payouts table
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_number TEXT UNIQUE,
    worker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    worker_name TEXT,
    worker_email TEXT,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    currency TEXT DEFAULT 'PKR',
    payment_method TEXT DEFAULT 'Bank Transfer',
    reference_note TEXT,
    order_ids JSONB DEFAULT '[]'::jsonb,
    order_count INT DEFAULT 0,
    invoice_pdf_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payouts_worker_id_idx ON public.payouts(worker_id);
CREATE INDEX IF NOT EXISTS payouts_created_at_idx ON public.payouts(created_at DESC);

-- Enable RLS on payouts
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payouts_admin_all" ON public.payouts;
CREATE POLICY "payouts_admin_all" ON public.payouts
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "payouts_worker_select_own" ON public.payouts;
CREATE POLICY "payouts_worker_select_own" ON public.payouts
    FOR SELECT TO authenticated
    USING (worker_id = auth.uid() OR public.is_admin());

-- 3. Create Storage bucket 'worker-invoices'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'worker-invoices',
    'worker-invoices',
    true,
    20971520, -- 20 MB
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY['application/pdf'];

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
