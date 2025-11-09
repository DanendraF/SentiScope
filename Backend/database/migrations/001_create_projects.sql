-- Table: projects
-- Fungsi: Workspace/analisis yang pernah dibuat user

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, archived, deleted
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    settings JSONB, -- Untuk menyimpan settings project seperti model config, dll
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('active', 'archived', 'deleted'))
);

-- Indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON projects(is_public);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at) WHERE deleted_at IS NULL;

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_projects_updated_at();

-- Comments untuk dokumentasi
COMMENT ON TABLE projects IS 'Workspace/analisis yang pernah dibuat user';
COMMENT ON COLUMN projects.status IS 'Status project: active, archived, deleted';
COMMENT ON COLUMN projects.is_public IS 'Apakah project bisa diakses publik';
COMMENT ON COLUMN projects.settings IS 'JSON untuk menyimpan settings project seperti model config, dll';
COMMENT ON COLUMN projects.deleted_at IS 'Soft delete timestamp';

