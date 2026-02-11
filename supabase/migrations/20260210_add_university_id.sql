-- Migration: Add university_id to content tables for multi-tenancy
-- Each school gets isolated community, marketplace, and course data.
-- Run this AFTER looking up the UMich university ID from the universities table.
--
-- BEFORE RUNNING: Replace '<UMICH_UUID>' with the actual UUID from:
--   SELECT id FROM universities WHERE domain = 'umich.edu';

-- ============================================================
-- 1. Add university_id columns (nullable first for backfill)
-- ============================================================

ALTER TABLE boards
  ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id);

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id);

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id);

ALTER TABLE terms
  ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id);

ALTER TABLE sections
  ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id);

ALTER TABLE marketplace_listings
  ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id);

-- ============================================================
-- 2. Backfill existing rows with UMich university ID
-- ============================================================
-- Replace '<UMICH_UUID>' with the actual value before running.

DO $$
DECLARE
  umich_id UUID;
BEGIN
  SELECT id INTO umich_id FROM universities WHERE domain = 'umich.edu' LIMIT 1;

  IF umich_id IS NULL THEN
    RAISE EXCEPTION 'UMich university not found in universities table';
  END IF;

  UPDATE boards SET university_id = umich_id WHERE university_id IS NULL;
  UPDATE posts SET university_id = umich_id WHERE university_id IS NULL;
  UPDATE courses SET university_id = umich_id WHERE university_id IS NULL;
  UPDATE terms SET university_id = umich_id WHERE university_id IS NULL;
  UPDATE sections SET university_id = umich_id WHERE university_id IS NULL;
  UPDATE marketplace_listings SET university_id = umich_id WHERE university_id IS NULL;
END $$;

-- ============================================================
-- 3. Set NOT NULL constraints
-- ============================================================

ALTER TABLE boards ALTER COLUMN university_id SET NOT NULL;
ALTER TABLE posts ALTER COLUMN university_id SET NOT NULL;
ALTER TABLE courses ALTER COLUMN university_id SET NOT NULL;
ALTER TABLE terms ALTER COLUMN university_id SET NOT NULL;
ALTER TABLE sections ALTER COLUMN university_id SET NOT NULL;
ALTER TABLE marketplace_listings ALTER COLUMN university_id SET NOT NULL;

-- ============================================================
-- 4. Add indexes for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_boards_university_id ON boards(university_id);
CREATE INDEX IF NOT EXISTS idx_posts_university_id ON posts(university_id);
CREATE INDEX IF NOT EXISTS idx_courses_university_id ON courses(university_id);
CREATE INDEX IF NOT EXISTS idx_terms_university_id ON terms(university_id);
CREATE INDEX IF NOT EXISTS idx_sections_university_id ON sections(university_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_university_id ON marketplace_listings(university_id);

-- ============================================================
-- 5. RLS policies — filter SELECT by user's university_id in metadata
-- ============================================================
-- These assume RLS is already enabled on these tables.
-- The user's university_id is stored in auth.users.raw_user_meta_data->>'university_id'.

-- Helper: extract user's university_id
-- Used in policies below.

-- boards
CREATE POLICY "Users see own school boards" ON boards
  FOR SELECT USING (
    university_id = (
      SELECT (raw_user_meta_data->>'university_id')::uuid
      FROM auth.users WHERE id = auth.uid()
    )
  );

-- posts
CREATE POLICY "Users see own school posts" ON posts
  FOR SELECT USING (
    university_id = (
      SELECT (raw_user_meta_data->>'university_id')::uuid
      FROM auth.users WHERE id = auth.uid()
    )
  );

-- courses
CREATE POLICY "Users see own school courses" ON courses
  FOR SELECT USING (
    university_id = (
      SELECT (raw_user_meta_data->>'university_id')::uuid
      FROM auth.users WHERE id = auth.uid()
    )
  );

-- terms
CREATE POLICY "Users see own school terms" ON terms
  FOR SELECT USING (
    university_id = (
      SELECT (raw_user_meta_data->>'university_id')::uuid
      FROM auth.users WHERE id = auth.uid()
    )
  );

-- sections
CREATE POLICY "Users see own school sections" ON sections
  FOR SELECT USING (
    university_id = (
      SELECT (raw_user_meta_data->>'university_id')::uuid
      FROM auth.users WHERE id = auth.uid()
    )
  );

-- marketplace_listings
CREATE POLICY "Users see own school listings" ON marketplace_listings
  FOR SELECT USING (
    university_id = (
      SELECT (raw_user_meta_data->>'university_id')::uuid
      FROM auth.users WHERE id = auth.uid()
    )
  );
