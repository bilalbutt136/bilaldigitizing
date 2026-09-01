-- Migration: 20260901000001_fix_custom_offers_accepted_sync.sql
-- Description: Add accepted_at column, ensure RLS policies allow authenticated and public client offer updates, and verify realtime publication.

DO $$
BEGIN
    -- 1. Ensure accepted_at column exists in custom_offers table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'custom_offers' AND column_name = 'accepted_at'
    ) THEN
        ALTER TABLE public.custom_offers ADD COLUMN accepted_at timestamptz;
    END IF;

    -- 2. Ensure RLS is enabled on custom_offers
    ALTER TABLE public.custom_offers ENABLE ROW LEVEL SECURITY;

    -- 3. Ensure permissive RLS policy for custom_offers exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'custom_offers' AND policyname = 'Allow public and service access to custom_offers'
    ) THEN
        CREATE POLICY "Allow public and service access to custom_offers" 
        ON public.custom_offers FOR ALL 
        USING (true) 
        WITH CHECK (true);
    END IF;

    -- 4. Ensure custom_offers is added to supabase_realtime publication
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_offers;
    EXCEPTION WHEN duplicate_object THEN
        -- already added, ignore
    END;
END $$;
