-- ============================================
-- Migration: Fix Users Table - Make Optional Columns Nullable
-- File: 013_fix_users_nullable_columns.sql
-- Description: Remove NOT NULL constraint from optional columns
-- ============================================

-- Make 'name' column nullable (since we use first_name and last_name)
ALTER TABLE users
ALTER COLUMN name DROP NOT NULL;

-- Verify the change
COMMENT ON COLUMN users.name IS 'Full name (optional, can use first_name + last_name instead)';

-- Update existing records that have NULL name but have first_name and last_name
UPDATE users
SET name = CONCAT(first_name, ' ', last_name)
WHERE name IS NULL
  AND first_name IS NOT NULL
  AND last_name IS NOT NULL;

-- Add a check to ensure at least one name field is provided
-- (Either name OR (first_name AND last_name) must be present)
-- Commented out to allow flexibility
-- ALTER TABLE users
-- ADD CONSTRAINT users_name_check
-- CHECK (
--   name IS NOT NULL OR
--   (first_name IS NOT NULL AND last_name IS NOT NULL)
-- );

COMMENT ON TABLE users IS 'Users table - name field is optional, can use first_name + last_name instead';
