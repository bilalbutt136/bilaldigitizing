-- ==============================================================================
-- SUPABASE STORAGE BUCKET & RLS POLICIES FOR PORTFOLIO IMAGES
-- ==============================================================================

-- 1. Ensure the 'portfolio-images' storage bucket exists and is marked public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-images',
  'portfolio-images',
  true,
  26214400, -- 25MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'application/octet-stream',
    'application/postscript'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'application/octet-stream',
    'application/postscript'
  ];

-- 2. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Public Read Policy: Allow anyone (anon + authenticated) to view portfolio images
DROP POLICY IF EXISTS "Public Access to Portfolio Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Select Portfolio Images" ON storage.objects;

CREATE POLICY "Public Select Portfolio Images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'portfolio-images');

-- 4. Admin / Service Role Insert Policy: Allow authenticated admin users and service_role to upload images
DROP POLICY IF EXISTS "Admin Upload Portfolio Images" ON storage.objects;

CREATE POLICY "Admin Upload Portfolio Images"
ON storage.objects
FOR INSERT
TO authenticated, service_role
WITH CHECK (
  bucket_id = 'portfolio-images' AND (
    auth.role() = 'service_role' OR
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt()->>'email')
  )
);

-- 5. Admin / Service Role Update Policy
DROP POLICY IF EXISTS "Admin Update Portfolio Images" ON storage.objects;

CREATE POLICY "Admin Update Portfolio Images"
ON storage.objects
FOR UPDATE
TO authenticated, service_role
USING (
  bucket_id = 'portfolio-images' AND (
    auth.role() = 'service_role' OR
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt()->>'email')
  )
);

-- 6. Admin / Service Role Delete Policy
DROP POLICY IF EXISTS "Admin Delete Portfolio Images" ON storage.objects;

CREATE POLICY "Admin Delete Portfolio Images"
ON storage.objects
FOR DELETE
TO authenticated, service_role
USING (
  bucket_id = 'portfolio-images' AND (
    auth.role() = 'service_role' OR
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt()->>'email')
  )
);
