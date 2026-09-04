-- ==============================================================================
-- Migration: 13_storage_buckets_and_rls_policies.sql
-- Overhaul storage buckets, 50MB limits, universal MIME types, and RLS policies
-- ==============================================================================

-- 1. Ensure all active application buckets exist in storage.buckets with 50MB limit and universal MIME support
DO $$
DECLARE
    b_name text;
    app_buckets text[] := ARRAY[
        'client-uploads',
        'chat-attachments',
        'order-files',
        'admin-deliveries',
        'portfolio-images',
        'media-gallery',
        'deliveries',
        'customer-assets',
        'orders'
    ];
BEGIN
    FOREACH b_name IN ARRAY app_buckets
    LOOP
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            b_name,
            b_name,
            true,
            52428800, -- 50MB
            NULL      -- Unrestricted: allows all standard formats (PDF, images, ZIPs, docs, machine files)
        )
        ON CONFLICT (id) DO UPDATE SET
            public = true,
            file_size_limit = 52428800,
            allowed_mime_types = NULL;
    END LOOP;
END $$;

-- 2. Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Public Read Access: Allow anyone (authenticated or anonymous) to view and download files from active application buckets
DROP POLICY IF EXISTS "Public Read Access for Application Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public Select Portfolio Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to Portfolio Images" ON storage.objects;

CREATE POLICY "Public Read Access for Application Buckets"
ON storage.objects
FOR SELECT
TO public
USING (
    bucket_id IN (
        'client-uploads',
        'chat-attachments',
        'order-files',
        'admin-deliveries',
        'portfolio-images',
        'media-gallery',
        'deliveries',
        'customer-assets',
        'orders'
    )
);

-- 4. Universal Insert Access: Allow authenticated users and public client submissions (orders, chat attachments)
DROP POLICY IF EXISTS "Allow Uploads to Application Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Portfolio Images" ON storage.objects;

CREATE POLICY "Allow Uploads to Application Buckets"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
    bucket_id IN (
        'client-uploads',
        'chat-attachments',
        'order-files',
        'admin-deliveries',
        'portfolio-images',
        'media-gallery',
        'deliveries',
        'customer-assets',
        'orders'
    )
);

-- 5. Update and Delete Access: Allow service_role and authenticated users to update/delete
DROP POLICY IF EXISTS "Allow Updates to Application Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Portfolio Images" ON storage.objects;

CREATE POLICY "Allow Updates to Application Buckets"
ON storage.objects
FOR UPDATE
TO authenticated, service_role
USING (
    bucket_id IN (
        'client-uploads',
        'chat-attachments',
        'order-files',
        'admin-deliveries',
        'portfolio-images',
        'media-gallery',
        'deliveries',
        'customer-assets',
        'orders'
    )
);

DROP POLICY IF EXISTS "Allow Deletions from Application Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Portfolio Images" ON storage.objects;

CREATE POLICY "Allow Deletions from Application Buckets"
ON storage.objects
FOR DELETE
TO authenticated, service_role
USING (
    bucket_id IN (
        'client-uploads',
        'chat-attachments',
        'order-files',
        'admin-deliveries',
        'portfolio-images',
        'media-gallery',
        'deliveries',
        'customer-assets',
        'orders'
    )
);
