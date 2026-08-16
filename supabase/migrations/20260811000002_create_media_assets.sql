-- Migration: Create media_assets table for persistent media library storage
CREATE TABLE IF NOT EXISTS media_assets (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  public_id TEXT,
  category TEXT DEFAULT 'Uploaded Asset',
  type TEXT DEFAULT 'image',
  size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'media_assets' AND policyname = 'media_assets_public_read'
  ) THEN
    CREATE POLICY "media_assets_public_read" ON media_assets FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'media_assets' AND policyname = 'media_assets_allow_insert'
  ) THEN
    CREATE POLICY "media_assets_allow_insert" ON media_assets FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'media_assets' AND policyname = 'media_assets_allow_update'
  ) THEN
    CREATE POLICY "media_assets_allow_update" ON media_assets FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'media_assets' AND policyname = 'media_assets_allow_delete'
  ) THEN
    CREATE POLICY "media_assets_allow_delete" ON media_assets FOR DELETE USING (true);
  END IF;
END $$;

-- Index for fast category filtering
CREATE INDEX IF NOT EXISTS idx_media_assets_category ON media_assets (category);

-- Index for chronological ordering
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets (created_at DESC);
