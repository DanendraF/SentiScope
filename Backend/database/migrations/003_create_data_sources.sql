-- Table: data_sources
-- Fungsi: Menyimpan info input (text, csv, gambar, keyword)

CREATE TYPE data_source_type_enum AS ENUM ('text', 'csv', 'image', 'keyword', 'api', 'url');

CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type data_source_type_enum NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    source_description TEXT,
    source_url TEXT, -- URL jika source dari web/API
    file_upload_id UUID REFERENCES file_uploads(id) ON DELETE SET NULL,
    metadata JSONB, -- Untuk menyimpan info tambahan seperti CSV columns, image dimensions, dll
    total_items INTEGER NOT NULL DEFAULT 0, -- Total items yang diharapkan dari source ini
    processed_items INTEGER NOT NULL DEFAULT 0, -- Total items yang sudah diproses
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    CONSTRAINT valid_items_count CHECK (processed_items <= total_items)
);

-- Indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_data_sources_project_id ON data_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_user_id ON data_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_source_type ON data_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_data_sources_status ON data_sources(status);
CREATE INDEX IF NOT EXISTS idx_data_sources_file_upload_id ON data_sources(file_upload_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_created_at ON data_sources(created_at DESC);

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_data_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_data_sources_updated_at
    BEFORE UPDATE ON data_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_data_sources_updated_at();

-- Comments untuk dokumentasi
COMMENT ON TABLE data_sources IS 'Menyimpan info input (text, csv, gambar, keyword, API, URL)';
COMMENT ON COLUMN data_sources.source_type IS 'Jenis source: text, csv, image, keyword, api, url';
COMMENT ON COLUMN data_sources.source_url IS 'URL jika source dari web atau API';
COMMENT ON COLUMN data_sources.file_upload_id IS 'Foreign key ke file_uploads jika source dari file';
COMMENT ON COLUMN data_sources.metadata IS 'JSON untuk info tambahan: CSV columns, image dimensions, API config, dll';
COMMENT ON COLUMN data_sources.total_items IS 'Total items yang diharapkan dari source ini';
COMMENT ON COLUMN data_sources.processed_items IS 'Total items yang sudah diproses';

