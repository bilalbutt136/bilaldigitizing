-- Migration 07: Ensure phone, avatar_url, and company columns exist on public.clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company_name text;

-- Ensure RLS policies allow users to read/update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'clients_select_own'
  ) THEN
    CREATE POLICY "clients_select_own" ON public.clients FOR SELECT USING (((id = auth.uid()) OR public.is_admin()));
  END IF;
END $$;
