-- Migration: Add first_name and last_name to users table
-- Fungsi: Memisahkan name menjadi first_name dan last_name untuk register form

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Update existing records: split name into first_name and last_name
-- Jika name sudah ada, split berdasarkan spasi
UPDATE users 
SET 
  first_name = SPLIT_PART(name, ' ', 1),
  last_name = CASE 
    WHEN POSITION(' ' IN name) > 0 THEN 
      SUBSTRING(name FROM POSITION(' ' IN name) + 1)
    ELSE 
      ''
  END
WHERE first_name IS NULL AND last_name IS NULL AND name IS NOT NULL;

-- Add constraint untuk memastikan minimal first_name ada
ALTER TABLE users 
ADD CONSTRAINT users_name_check CHECK (
  (first_name IS NOT NULL AND LENGTH(TRIM(first_name)) > 0) OR 
  (name IS NOT NULL AND LENGTH(TRIM(name)) > 0)
);

-- Indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);

-- Comments untuk dokumentasi
COMMENT ON COLUMN users.first_name IS 'Nama depan user';
COMMENT ON COLUMN users.last_name IS 'Nama belakang user';
COMMENT ON COLUMN users.name IS 'Nama lengkap (backward compatibility, bisa diisi otomatis dari first_name + last_name)';

