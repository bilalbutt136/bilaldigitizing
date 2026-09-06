-- ==============================================================================
-- Migration: 20260906000007_orders_worker_accepted_at_columns.sql
-- Add missing worker_accepted_at, worker_bid_notes, worker_payout columns to orders
-- and loosen worker_status check constraint to support both In Progress and In_Progress
-- ==============================================================================

-- 1. Ensure all worker lifecycle columns exist on public.orders
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS worker_accepted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS worker_bid_notes TEXT,
    ADD COLUMN IF NOT EXISTS worker_payout NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS worker_payout_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS quoted_price NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS quoted_price_pkr NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS worker_payment_status TEXT DEFAULT 'Unpaid';

-- 2. Update worker_status check constraint to support all common variants
DO $$
BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_worker_status_check;
    ALTER TABLE public.orders 
        ADD CONSTRAINT orders_worker_status_check 
        CHECK (worker_status IN (
            'Unassigned', 
            'Pending_Worker_Acceptance', 
            'In Progress', 
            'In_Progress', 
            'in_progress', 
            'Review Pending', 
            'Review_Pending', 
            'Revisions Needed', 
            'Revisions_Needed', 
            'Completed', 
            'completed', 
            'Cancelled', 
            'cancelled'
        ));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. Update worker_payment_status check constraint
DO $$
BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_worker_payment_status_check;
    ALTER TABLE public.orders 
        ADD CONSTRAINT orders_worker_payment_status_check 
        CHECK (worker_payment_status IN ('Unpaid', 'Paid', 'Pending', 'unpaid', 'paid', 'pending'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 4. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
