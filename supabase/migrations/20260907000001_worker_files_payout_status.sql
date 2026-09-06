-- Migration: worker_files JSONB column for multi-file uploads
-- AND payouts status column for unpaid/paid tracking

-- 1. Add worker_files JSONB column to orders (for multiple worker uploads)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS worker_files JSONB DEFAULT '[]'::jsonb;

-- 2. Add status tracking to payouts table
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unpaid';
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS paid_by TEXT;

-- 3. Create index for quick filtering of Review Pending orders
CREATE INDEX IF NOT EXISTS idx_orders_worker_status ON orders(worker_status);
