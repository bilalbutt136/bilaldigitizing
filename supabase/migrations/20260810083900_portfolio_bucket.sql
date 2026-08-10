-- Create portfolio-images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('portfolio-images', 'portfolio-images', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- Give public read access to portfolio-images
DROP POLICY IF EXISTS "Public Access to Portfolio Images" ON storage.objects;
CREATE POLICY "Public Access to Portfolio Images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'portfolio-images');

-- Note: Admin access for INSERT/UPDATE/DELETE is already covered by the global storage_admin_all policy 
-- created in unified_schema.sql (`USING (public.is_admin()) WITH CHECK (public.is_admin())`).
