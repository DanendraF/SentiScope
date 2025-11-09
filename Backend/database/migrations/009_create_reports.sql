-- Table: reports
-- Fungsi: History file PDF hasil export

CREATE TYPE report_status_enum AS ENUM ('pending', 'generating', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL DEFAULT 'full', -- full, summary, custom
    file_path TEXT NOT NULL, -- Path atau URL file PDF
    file_size BIGINT, -- Size file dalam bytes
    status report_status_enum NOT NULL DEFAULT 'pending',
    generation_settings JSONB, -- Settings yang digunakan untuk generate report
    error_message TEXT,
    pages_count INTEGER, -- Jumlah halaman PDF
    generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
    
    -- Constraints
    CONSTRAINT valid_file_size CHECK (file_size IS NULL OR file_size > 0),
    CONSTRAINT valid_pages_count CHECK (pages_count IS NULL OR pages_count > 0),
    CONSTRAINT valid_report_type CHECK (report_type IN ('full', 'summary', 'custom'))
);

-- Indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_deleted_at ON reports(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reports_user_status ON reports(user_id, status);

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_reports_updated_at();

-- Comments untuk dokumentasi
COMMENT ON TABLE reports IS 'History file PDF hasil export';
COMMENT ON COLUMN reports.report_type IS 'Jenis report: full (lengkap), summary (ringkas), custom (custom)';
COMMENT ON COLUMN reports.file_path IS 'Path atau URL file PDF di storage';
COMMENT ON COLUMN reports.generation_settings IS 'Settings yang digunakan untuk generate report (format, sections, dll)';
COMMENT ON COLUMN reports.deleted_at IS 'Soft delete timestamp';

