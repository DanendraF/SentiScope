-- Table: analysis_sessions
-- NOTE: Jalankan setelah tabel users dan projects dibuat
-- Fungsi: Tracking setiap sesi analisis/project

CREATE TYPE session_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE input_type_enum AS ENUM ('text', 'csv', 'image', 'keyword', 'mixed');

CREATE TABLE IF NOT EXISTS analysis_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_name VARCHAR(255) NOT NULL,
    input_type input_type_enum NOT NULL DEFAULT 'text',
    status session_status NOT NULL DEFAULT 'pending',
    total_texts_analyzed INTEGER NOT NULL DEFAULT 0,
    total_texts_processed INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    metadata JSONB, -- Untuk menyimpan informasi tambahan seperti config, settings, dll
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_dates_check CHECK (
        (started_at IS NULL OR completed_at IS NULL) OR 
        (started_at <= completed_at)
    )
);

-- Indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_user_id ON analysis_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_project_id ON analysis_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_status ON analysis_sessions(status);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_input_type ON analysis_sessions(input_type);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_created_at ON analysis_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_user_status ON analysis_sessions(user_id, status);

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_analysis_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_analysis_sessions_updated_at
    BEFORE UPDATE ON analysis_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_analysis_sessions_updated_at();

-- Comments untuk dokumentasi
COMMENT ON TABLE analysis_sessions IS 'Tracking setiap sesi analisis/project yang dibuat user';
COMMENT ON COLUMN analysis_sessions.session_name IS 'Nama sesi analisis (bisa diisi user atau auto-generated)';
COMMENT ON COLUMN analysis_sessions.input_type IS 'Jenis input: text, csv, image, keyword, atau mixed';
COMMENT ON COLUMN analysis_sessions.status IS 'Status sesi: pending, processing, completed, failed, cancelled';
COMMENT ON COLUMN analysis_sessions.total_texts_analyzed IS 'Total teks yang berhasil dianalisis';
COMMENT ON COLUMN analysis_sessions.total_texts_processed IS 'Total teks yang diproses (termasuk yang gagal)';
COMMENT ON COLUMN analysis_sessions.metadata IS 'JSON untuk menyimpan informasi tambahan seperti config, settings, dll';

