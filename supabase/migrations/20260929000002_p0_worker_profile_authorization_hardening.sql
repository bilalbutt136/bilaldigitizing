-- P0 authorization hardening: worker privilege state must be server-controlled.
-- Worker registration and admin management already mutate worker_profiles through
-- service-role API routes, so browser clients do not need direct INSERT/UPDATE.

ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "worker_profiles_insert_all" ON public.worker_profiles;
DROP POLICY IF EXISTS "worker_profiles_update_own" ON public.worker_profiles;

-- Keep workers able to read only their own application/profile.
DROP POLICY IF EXISTS "worker_profiles_select_own" ON public.worker_profiles;
CREATE POLICY "worker_profiles_select_own"
ON public.worker_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_admin());

-- Only trusted administrators may mutate worker profile status/identity through
-- authenticated SQL. service_role bypasses RLS for the server-side APIs.
DROP POLICY IF EXISTS "worker_profiles_admin_all" ON public.worker_profiles;
CREATE POLICY "worker_profiles_admin_all"
ON public.worker_profiles
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Do not grant browser roles blanket table mutation privileges.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.worker_profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.worker_profiles FROM authenticated;
GRANT SELECT ON TABLE public.worker_profiles TO authenticated;
GRANT ALL ON TABLE public.worker_profiles TO service_role;


-- P0 authorization hardening: custom offers are private customer/admin records.
ALTER TABLE public.custom_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public and service access to custom_offers" ON public.custom_offers;
DROP POLICY IF EXISTS "custom_offers_select_own" ON public.custom_offers;
DROP POLICY IF EXISTS "custom_offers_admin_all" ON public.custom_offers;

CREATE POLICY "custom_offers_select_own"
ON public.custom_offers
FOR SELECT
TO authenticated
USING (
  lower(client_email) = public.current_user_email()
  OR customer_id = auth.uid()::text
  OR public.is_admin()
);

CREATE POLICY "custom_offers_admin_all"
ON public.custom_offers
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE public.custom_offers FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.custom_offers FROM authenticated;
GRANT SELECT ON TABLE public.custom_offers TO authenticated;
GRANT ALL ON TABLE public.custom_offers TO service_role;
