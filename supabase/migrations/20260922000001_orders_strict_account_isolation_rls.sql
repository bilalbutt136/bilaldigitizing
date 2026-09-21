-- ==============================================================================
-- Migration: 20260922000001_orders_strict_account_isolation_rls.sql
-- Description: Enforce strict account isolation & Row Level Security (RLS)
--              on public.orders and public.order_files
-- ==============================================================================

-- 1. Ensure user_id column exists on public.orders with foreign key to auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Create performance indexes for high-throughput user & worker isolation
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_email_lower ON public.orders(lower(client_email));
CREATE INDEX IF NOT EXISTS idx_orders_worker_id ON public.orders(worker_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 3. Ensure helper functions exist and are up to date
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN true;
  END IF;

  IF lower(coalesce(auth.jwt() ->> 'email', '')) IN (
    'bilalsadiq612@gmail.com',
    'bilalbutt136@gmail.com',
    'admin@bdigitizing.com',
    'support@bdigitizing.com'
  ) THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.admins 
    WHERE lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  ) THEN
    RETURN true;
  END IF;

  IF coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin' 
     OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin' 
     OR coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin'), 'false') = 'true' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 4. Enable Row Level Security (RLS) on public.orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 5. Drop legacy or overly permissive policies on public.orders
DROP POLICY IF EXISTS orders_select_policy ON public.orders;
DROP POLICY IF EXISTS orders_insert_policy ON public.orders;
DROP POLICY IF EXISTS orders_update_policy ON public.orders;
DROP POLICY IF EXISTS orders_delete_policy ON public.orders;
DROP POLICY IF EXISTS orders_read_policy ON public.orders;
DROP POLICY IF EXISTS orders_write_policy ON public.orders;
DROP POLICY IF EXISTS orders_all_policy ON public.orders;

-- 6. Create hardened RLS policies on public.orders
-- SELECT: Admins, assigned workers, or account owners (by user_id or verified email)
CREATE POLICY orders_select_policy ON public.orders
  FOR SELECT
  USING (
    public.is_admin()
    OR user_id = auth.uid()
    OR (auth.uid() IS NOT NULL AND lower(client_email) = public.current_user_email())
    OR worker_id = auth.uid()
  );

-- INSERT: Admins or verified users creating orders for themselves
CREATE POLICY orders_insert_policy ON public.orders
  FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR user_id = auth.uid()
    OR (auth.uid() IS NOT NULL AND lower(client_email) = public.current_user_email())
  );

-- UPDATE: Admins, account owners, or assigned workers
CREATE POLICY orders_update_policy ON public.orders
  FOR UPDATE
  USING (
    public.is_admin()
    OR user_id = auth.uid()
    OR (auth.uid() IS NOT NULL AND lower(client_email) = public.current_user_email())
    OR worker_id = auth.uid()
  )
  WITH CHECK (
    public.is_admin()
    OR user_id = auth.uid()
    OR (auth.uid() IS NOT NULL AND lower(client_email) = public.current_user_email())
    OR worker_id = auth.uid()
  );

-- DELETE: Strictly restricted to platform administrators
CREATE POLICY orders_delete_policy ON public.orders
  FOR DELETE
  USING (
    public.is_admin()
  );

-- 7. Enable RLS and isolate public.order_files
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'order_files'
  ) THEN
    ALTER TABLE public.order_files ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS order_files_select_policy ON public.order_files;
    DROP POLICY IF EXISTS order_files_insert_policy ON public.order_files;
    DROP POLICY IF EXISTS order_files_update_policy ON public.order_files;
    DROP POLICY IF EXISTS order_files_delete_policy ON public.order_files;

    CREATE POLICY order_files_select_policy ON public.order_files
      FOR SELECT
      USING (
        public.is_admin()
        OR EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = order_files.order_id
            AND (
              o.user_id = auth.uid()
              OR (auth.uid() IS NOT NULL AND lower(o.client_email) = public.current_user_email())
              OR o.worker_id = auth.uid()
            )
        )
      );

    CREATE POLICY order_files_insert_policy ON public.order_files
      FOR INSERT
      WITH CHECK (
        public.is_admin()
        OR EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = order_files.order_id
            AND (
              o.user_id = auth.uid()
              OR (auth.uid() IS NOT NULL AND lower(o.client_email) = public.current_user_email())
              OR o.worker_id = auth.uid()
            )
        )
      );

    CREATE POLICY order_files_update_policy ON public.order_files
      FOR UPDATE
      USING (
        public.is_admin()
        OR EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = order_files.order_id
            AND (
              o.user_id = auth.uid()
              OR (auth.uid() IS NOT NULL AND lower(o.client_email) = public.current_user_email())
              OR o.worker_id = auth.uid()
            )
        )
      );

    CREATE POLICY order_files_delete_policy ON public.order_files
      FOR DELETE
      USING (
        public.is_admin()
        OR EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = order_files.order_id
            AND (
              o.user_id = auth.uid()
              OR (auth.uid() IS NOT NULL AND lower(o.client_email) = public.current_user_email())
            )
        )
      );
  END IF;
END $$;

-- 8. Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
