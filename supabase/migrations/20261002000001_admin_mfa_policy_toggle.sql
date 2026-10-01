-- Runtime policy switch for administrator two-factor authentication.
-- MFA remains ON by default. Disabling it only changes the authorization
-- requirement; existing TOTP factors remain enrolled so MFA can be re-enabled
-- without rebuilding the authenticator setup.

CREATE TABLE IF NOT EXISTS public.admin_security_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  mfa_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

INSERT INTO public.admin_security_settings (id, mfa_enabled)
VALUES (1, TRUE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.admin_security_settings ENABLE ROW LEVEL SECURITY;

-- Browser clients do not read or write this table directly. The server-side
-- admin API uses the service role, and the public helper below exposes only the
-- single non-secret policy boolean needed by middleware/RLS.

CREATE OR REPLACE FUNCTION public.admin_mfa_required()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT mfa_enabled FROM public.admin_security_settings WHERE id = 1),
    TRUE
  );
$$;

REVOKE ALL ON FUNCTION public.admin_mfa_required() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_mfa_required() TO anon, authenticated, service_role;

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

  IF public.admin_mfa_required()
     AND coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' THEN
    RETURN false;
  END IF;

  RETURN public.is_admin_identity();
END;
$$;

COMMENT ON TABLE public.admin_security_settings IS
'Singleton runtime security policy for administrator access. MFA defaults to enabled.';

COMMENT ON FUNCTION public.admin_mfa_required() IS
'Returns whether trusted administrator browser sessions must present Supabase AAL2.';

COMMENT ON FUNCTION public.is_admin() IS
'Returns true for service role, or a trusted administrator browser session that satisfies the current MFA policy.';
