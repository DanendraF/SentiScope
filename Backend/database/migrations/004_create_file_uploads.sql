-- Table: file_uploads
-- NOTE: Jalankan setelah tabel users, projects, dan analysis_sessions dibuat
-- Fungsi: Metadata file yang diupload (CSV, images)

CREATE TYPE file_type_enum AS ENUM ('csv', 'image', 'text', 'other');
CREATE TYPE upload_status_enum AS ENUM ('uploading', 'uploaded', 'processing', 'processed', 'failed', 'deleted');

CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    analysis_session_id UUID REFERENCES analysis_sessions(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_type file_type_enum NOT NULL,
    file_size BIGINT NOT NULL, -- Size in bytes
    file_path TEXT NOT NULL, -- Path atau URL file
    mime_type VARCHAR(100),
    upload_status upload_status_enum NOT NULL DEFAULT 'uploading',
    processing_status VARCHAR(50), -- Status processing khusus (extracting, parsing, dll)
    error_message TEXT,
    metadata JSONB, -- Untuk menyimpan info tambahan seperti dimensions untuk image, columns untuk CSV, dll
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
    
    -- Constraints
    CONSTRAINT file_size_check CHECK (file_size > 0),
    CONSTRAINT valid_processing_dates CHECK (
        (processed_at IS NULL) OR 
        (uploaded_at <= processed_at)
    )
);

-- Indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_project_id ON file_uploads(project_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_analysis_session_id ON file_uploads(analysis_session_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_file_type ON file_uploads(file_type);
CREATE INDEX IF NOT EXISTS idx_file_uploads_upload_status ON file_uploads(upload_status);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_uploads_deleted_at ON file_uploads(deleted_at) WHERE deleted_at IS NULL;

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_file_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_file_uploads_updated_at
    BEFORE UPDATE ON file_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_file_uploads_updated_at();

-- Comments untuk dokumentasi
COMMENT ON TABLE file_uploads IS 'Metadata file yang diupload (CSV, images, dll)';
COMMENT ON COLUMN file_uploads.file_name IS 'Nama file setelah diupload (bisa di-hash atau di-rename)';
COMMENT ON COLUMN file_uploads.original_file_name IS 'Nama file asli dari user';
COMMENT ON COLUMN file_uploads.file_path IS 'Path atau URL file di storage (local/S3/cloud storage)';
COMMENT ON COLUMN file_uploads.metadata IS 'JSON untuk info tambahan: image dimensions, CSV columns, encoding, dll';
COMMENT ON COLUMN file_uploads.deleted_at IS 'Soft delete timestamp';

