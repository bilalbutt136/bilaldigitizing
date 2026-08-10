-- Migration: Create media_assets table for persistent media library storage
-- This table stores metadata for files uploaded via the Media Library Manager,
-- including Cloudinary URLs and asset details.

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

-- Public read access (media assets are displayed on public pages)
CREATE POLICY "media_assets_public_read" ON media_assets
  FOR SELECT USING (true);

-- Allow inserts (admin uploads)
CREATE POLICY "media_assets_allow_insert" ON media_assets
  FOR INSERT WITH CHECK (true);

-- Allow updates (admin edits)
CREATE POLICY "media_assets_allow_update" ON media_assets
  FOR UPDATE USING (true);

-- Allow deletes (admin cleanup)
CREATE POLICY "media_assets_allow_delete" ON media_assets
  FOR DELETE USING (true);

-- Index for fast category filtering
CREATE INDEX IF NOT EXISTS idx_media_assets_category ON media_assets (category);

-- Index for chronological ordering
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets (created_at DESC);
