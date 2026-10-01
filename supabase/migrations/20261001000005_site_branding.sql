-- Dynamic site branding singleton.
-- Public users can read branding; writes are limited by RLS to authenticated admins.
CREATE TABLE IF NOT EXISTS public.site_branding (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  app_icon_url text,
  favicon_url text,
  header_logo_url text,
  footer_logo_url text,
  og_image_url text,
  theme_color text NOT NULL DEFAULT '#ffffff'
    CHECK (theme_color ~ '^#[0-9A-Fa-f]{6}$'),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.site_branding (
  id,
  app_icon_url,
  favicon_url,
  header_logo_url,
  footer_logo_url,
  og_image_url,
  theme_color
)
VALUES (
  1,
  '/icon-512x512.png',
  '/favicon.png',
  '/logo.png',
  '/logo.png',
  '/icon-512x512.png',
  '#ffffff'
)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_site_branding_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_site_branding_updated_at ON public.site_branding;
CREATE TRIGGER trg_site_branding_updated_at
BEFORE UPDATE ON public.site_branding
FOR EACH ROW
EXECUTE FUNCTION public.set_site_branding_updated_at();

ALTER TABLE public.site_branding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_branding_public_read" ON public.site_branding;
CREATE POLICY "site_branding_public_read"
ON public.site_branding
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "site_branding_admin_insert" ON public.site_branding;
CREATE POLICY "site_branding_admin_insert"
ON public.site_branding
FOR INSERT
TO authenticated
WITH CHECK (
  lower(coalesce(auth.jwt() ->> 'email', '')) IN (
    SELECT lower(a.email) FROM public.admins a
  )
  OR lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) = 'admin'
  OR lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'is_admin', '')) = 'true'
);

DROP POLICY IF EXISTS "site_branding_admin_update" ON public.site_branding;
CREATE POLICY "site_branding_admin_update"
ON public.site_branding
FOR UPDATE
TO authenticated
USING (
  lower(coalesce(auth.jwt() ->> 'email', '')) IN (
    SELECT lower(a.email) FROM public.admins a
  )
  OR lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) = 'admin'
  OR lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'is_admin', '')) = 'true'
)
WITH CHECK (
  lower(coalesce(auth.jwt() ->> 'email', '')) IN (
    SELECT lower(a.email) FROM public.admins a
  )
  OR lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) = 'admin'
  OR lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'is_admin', '')) = 'true'
);

GRANT SELECT ON public.site_branding TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_branding TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_branding TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'site_branding'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_branding;
  END IF;
END $$;
