-- Mandatory MFA hardening for administrator browser sessions.
-- Service-role server jobs remain trusted. Authenticated admin browser sessions
-- must carry Supabase AAL2 before RLS treats them as administrators.

CREATE OR REPLACE FUNCTION public.is_admin_identity()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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
    SELECT 1
    FROM public.admins
    WHERE lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  ) THEN
    RETURN true;
  END IF;

  IF coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
     OR coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin'), 'false') = 'true' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN true;
  END IF;

  IF coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' THEN
    RETURN false;
  END IF;

  RETURN public.is_admin_identity();
END;
$$;

-- The branding table was introduced after the shared admin predicate and used
-- inline admin checks. Bring those write policies under the same AAL2 rule.
DROP POLICY IF EXISTS "site_branding_admin_insert" ON public.site_branding;
CREATE POLICY "site_branding_admin_insert"
ON public.site_branding
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "site_branding_admin_update" ON public.site_branding;
CREATE POLICY "site_branding_admin_update"
ON public.site_branding
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

COMMENT ON FUNCTION public.is_admin_identity() IS
'Trusted administrator identity check without MFA assurance. Use is_admin() for privileged RLS authorization.';

COMMENT ON FUNCTION public.is_admin() IS
'Returns true for service role, or for a trusted administrator browser session only when JWT aal=aal2.';
