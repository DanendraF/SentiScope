-- Table: likert_results
-- NOTE: Jalankan setelah tabel projects dan raw_texts dibuat
-- Fungsi: Menyimpan hasil emotional sentiment dengan skala Likert 1-5

CREATE TABLE IF NOT EXISTS likert_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    raw_text_id UUID REFERENCES raw_texts(id) ON DELETE CASCADE,
    scale_value INTEGER NOT NULL CHECK (scale_value >= 1 AND scale_value <= 5),
    count INTEGER NOT NULL DEFAULT 0,
    percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT likert_scale_check CHECK (scale_value IN (1, 2, 3, 4, 5)),
    CONSTRAINT percentage_check CHECK (percentage >= 0 AND percentage <= 100)
);

-- Indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_likert_results_project_id ON likert_results(project_id);
CREATE INDEX IF NOT EXISTS idx_likert_results_raw_text_id ON likert_results(raw_text_id);
CREATE INDEX IF NOT EXISTS idx_likert_results_scale_value ON likert_results(scale_value);
CREATE INDEX IF NOT EXISTS idx_likert_results_created_at ON likert_results(created_at);

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_likert_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_likert_results_updated_at
    BEFORE UPDATE ON likert_results
    FOR EACH ROW
    EXECUTE FUNCTION update_likert_results_updated_at();

-- Comments untuk dokumentasi
COMMENT ON TABLE likert_results IS 'Menyimpan hasil emotional sentiment dengan skala Likert 1-5';
COMMENT ON COLUMN likert_results.scale_value IS 'Nilai skala Likert: 1=Very Dissatisfied, 2=Dissatisfied, 3=Neutral, 4=Satisfied, 5=Very Satisfied';
COMMENT ON COLUMN likert_results.count IS 'Jumlah response untuk skala ini';
COMMENT ON COLUMN likert_results.percentage IS 'Persentase dari total responses';

