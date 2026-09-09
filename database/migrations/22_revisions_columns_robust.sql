-- Migration: 22_revisions_columns_robust.sql
-- Description: Ensure all revisions columns (instructions, details, note, notes) exist to eliminate any column discrepancy or 500 runtime errors across versions.

DO $$
BEGIN
    -- 1. Ensure 'instructions' column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'revisions' AND column_name = 'instructions'
    ) THEN
        ALTER TABLE public.revisions ADD COLUMN instructions text;
    END IF;

    -- 2. Ensure 'details' column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'revisions' AND column_name = 'details'
    ) THEN
        ALTER TABLE public.revisions ADD COLUMN details text;
    END IF;

    -- 3. Ensure 'note' column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'revisions' AND column_name = 'note'
    ) THEN
        ALTER TABLE public.revisions ADD COLUMN note text;
    END IF;

    -- 4. Ensure 'notes' column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'revisions' AND column_name = 'notes'
    ) THEN
        ALTER TABLE public.revisions ADD COLUMN notes text;
    END IF;
END $$;
