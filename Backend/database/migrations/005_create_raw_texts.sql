-- Table: raw_texts
-- Fungsi: Isi teks mentah per baris komentar/kalimat

CREATE TABLE IF NOT EXISTS raw_texts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    text_content TEXT NOT NULL,
    text_order INTEGER NOT NULL DEFAULT 0, -- Urutan teks dalam source
    source_metadata JSONB, -- Info tambahan seperti author, timestamp, location, dll
    language VARCHAR(10), -- ISO 639-1 language code (en, id, dll)
    is_processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT text_not_empty CHECK (LENGTH(TRIM(text_content)) > 0)
);

-- Indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_raw_texts_project_id ON raw_texts(project_id);
CREATE INDEX IF NOT EXISTS idx_raw_texts_data_source_id ON raw_texts(data_source_id);
CREATE INDEX IF NOT EXISTS idx_raw_texts_is_processed ON raw_texts(is_processed);
CREATE INDEX IF NOT EXISTS idx_raw_texts_language ON raw_texts(language);
CREATE INDEX IF NOT EXISTS idx_raw_texts_created_at ON raw_texts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_texts_project_processed ON raw_texts(project_id, is_processed);

-- Full text search index (PostgreSQL)
CREATE INDEX IF NOT EXISTS idx_raw_texts_text_content_gin ON raw_texts USING gin(to_tsvector('english', text_content));

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_raw_texts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_raw_texts_updated_at
    BEFORE UPDATE ON raw_texts
    FOR EACH ROW
    EXECUTE FUNCTION update_raw_texts_updated_at();

-- Comments untuk dokumentasi
COMMENT ON TABLE raw_texts IS 'Isi teks mentah per baris komentar/kalimat';
COMMENT ON COLUMN raw_texts.text_order IS 'Urutan teks dalam source (untuk menjaga urutan asli)';
COMMENT ON COLUMN raw_texts.source_metadata IS 'JSON untuk info tambahan: author, timestamp, location, social media platform, dll';
COMMENT ON COLUMN raw_texts.language IS 'ISO 639-1 language code untuk deteksi bahasa';
COMMENT ON COLUMN raw_texts.is_processed IS 'Flag apakah teks sudah diproses untuk sentiment analysis';

