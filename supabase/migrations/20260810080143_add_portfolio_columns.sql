ALTER TABLE public.portfolio 
  ADD COLUMN IF NOT EXISTS formats TEXT,
  ADD COLUMN IF NOT EXISTS client_type TEXT;
