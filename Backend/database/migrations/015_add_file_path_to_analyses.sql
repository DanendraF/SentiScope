-- Migration: Add file_path column to analyses table
-- This stores the Supabase Storage path for uploaded CSV/Image files

ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS original_file_name TEXT;

-- Add comment
COMMENT ON COLUMN analyses.file_path IS 'Storage path in Supabase Storage (e.g., userId/csv/file.csv)';
COMMENT ON COLUMN analyses.file_url IS 'Public/Signed URL for file access';
COMMENT ON COLUMN analyses.original_file_name IS 'Original file name uploaded by user';

-- Create index for file_path queries
CREATE INDEX IF NOT EXISTS idx_analyses_file_path ON analyses(file_path) WHERE file_path IS NOT NULL;
