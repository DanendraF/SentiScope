-- Table: sentiment_statistics
-- NOTE: Jalankan setelah tabel projects dan analysis_sessions dibuat
-- Fungsi: Statistik agregat per project untuk performa query

CREATE TABLE IF NOT EXISTS sentiment_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    analysis_session_id UUID REFERENCES analysis_sessions(id) ON DELETE SET NULL,
    
    -- Basic Statistics
    total_texts INTEGER NOT NULL DEFAULT 0,
    positive_count INTEGER NOT NULL DEFAULT 0,
    negative_count INTEGER NOT NULL DEFAULT 0,
    neutral_count INTEGER NOT NULL DEFAULT 0,
    
    -- Score Statistics
    average_score DECIMAL(5, 4) NOT NULL DEFAULT 0.0000,
    min_score DECIMAL(5, 4),
    max_score DECIMAL(5, 4),
    
    -- Likert Statistics
    likert_total_responses INTEGER NOT NULL DEFAULT 0,
    likert_scale_1_count INTEGER NOT NULL DEFAULT 0,
    likert_scale_2_count INTEGER NOT NULL DEFAULT 0,
    likert_scale_3_count INTEGER NOT NULL DEFAULT 0,
    likert_scale_4_count INTEGER NOT NULL DEFAULT 0,
    likert_scale_5_count INTEGER NOT NULL DEFAULT 0,
    likert_average DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    satisfaction_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00, -- Percentage of scale 4-5
    
    -- Percentage Statistics
    positive_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    negative_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    neutral_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    
    -- Additional Statistics
    total_keywords INTEGER NOT NULL DEFAULT 0,
    unique_keywords INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT score_range_check CHECK (
        average_score >= 0 AND average_score <= 1 AND
        (min_score IS NULL OR (min_score >= 0 AND min_score <= 1)) AND
        (max_score IS NULL OR (max_score >= 0 AND max_score <= 1))
    ),
    CONSTRAINT likert_average_check CHECK (
        likert_average >= 1 AND likert_average <= 5
    ),
    CONSTRAINT percentage_check CHECK (
        positive_percentage >= 0 AND positive_percentage <= 100 AND
        negative_percentage >= 0 AND negative_percentage <= 100 AND
        neutral_percentage >= 0 AND neutral_percentage <= 100 AND
        satisfaction_rate >= 0 AND satisfaction_rate <= 100
    ),
    CONSTRAINT counts_consistency_check CHECK (
        total_texts = (positive_count + negative_count + neutral_count) AND
        likert_total_responses = (likert_scale_1_count + likert_scale_2_count + likert_scale_3_count + likert_scale_4_count + likert_scale_5_count)
    )
);

-- Indexes untuk performa query
CREATE UNIQUE INDEX IF NOT EXISTS idx_sentiment_statistics_project_id ON sentiment_statistics(project_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_statistics_analysis_session_id ON sentiment_statistics(analysis_session_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_statistics_calculated_at ON sentiment_statistics(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_statistics_average_score ON sentiment_statistics(average_score);
CREATE INDEX IF NOT EXISTS idx_sentiment_statistics_satisfaction_rate ON sentiment_statistics(satisfaction_rate);

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_sentiment_statistics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sentiment_statistics_updated_at
    BEFORE UPDATE ON sentiment_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_sentiment_statistics_updated_at();

-- Comments untuk dokumentasi
COMMENT ON TABLE sentiment_statistics IS 'Statistik agregat per project untuk performa query dan reporting';
COMMENT ON COLUMN sentiment_statistics.average_score IS 'Rata-rata confidence score (0.0 - 1.0)';
COMMENT ON COLUMN sentiment_statistics.likert_average IS 'Rata-rata skala Likert (1.0 - 5.0)';
COMMENT ON COLUMN sentiment_statistics.satisfaction_rate IS 'Persentase satisfaction (skala 4-5) dari total Likert responses';
COMMENT ON COLUMN sentiment_statistics.calculated_at IS 'Timestamp kapan statistik terakhir dihitung';

