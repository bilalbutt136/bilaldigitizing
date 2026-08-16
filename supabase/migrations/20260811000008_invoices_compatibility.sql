-- Migration 08: Enhance public.invoices columns and compatibility
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_url text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Populate payment_method from method if empty
UPDATE public.invoices SET payment_method = method WHERE payment_method IS NULL AND method IS NOT NULL;
UPDATE public.invoices SET method = payment_method WHERE method IS NULL AND payment_method IS NOT NULL;
