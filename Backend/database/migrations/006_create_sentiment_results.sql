-- Table: sentiment_results
-- Fungsi: Hasil labeling sentimen dari model HF (Hugging Face)

CREATE TYPE sentiment_label_enum AS ENUM ('positive', 'negative', 'neutral', 'mixed');

CREATE TABLE IF NOT EXISTS sentiment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_text_id UUID NOT NULL REFERENCES raw_texts(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sentiment_label sentiment_label_enum NOT NULL,
    confidence_score DECIMAL(5, 4) NOT NULL, -- Score 0.0 - 1.0
    model_name VARCHAR(255), -- Nama model yang digunakan (misal: distilbert-base-uncased-finetuned-sst-2-english)
    model_version VARCHAR(50), -- Version model
    processing_time_ms INTEGER, -- Waktu processing dalam milliseconds
    raw_model_output JSONB, -- Output mentah dari model (untuk debugging/analisis)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_confidence_score CHECK (confidence_score >= 0 AND confidence_score <= 1),
    CONSTRAINT valid_processing_time CHECK (processing_time_ms IS NULL OR processing_time_ms >= 0)
);

-- Indexes untuk performa query
CREATE UNIQUE INDEX IF NOT EXISTS idx_sentiment_results_raw_text_id ON sentiment_results(raw_text_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_results_project_id ON sentiment_results(project_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_results_sentiment_label ON sentiment_results(sentiment_label);
CREATE INDEX IF NOT EXISTS idx_sentiment_results_confidence_score ON sentiment_results(confidence_score);
CREATE INDEX IF NOT EXISTS idx_sentiment_results_model_name ON sentiment_results(model_name);
CREATE INDEX IF NOT EXISTS idx_sentiment_results_created_at ON sentiment_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_results_project_sentiment ON sentiment_results(project_id, sentiment_label);

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_sentiment_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sentiment_results_updated_at
    BEFORE UPDATE ON sentiment_results
    FOR EACH ROW
    EXECUTE FUNCTION update_sentiment_results_updated_at();

-- Comments untuk dokumentasi
COMMENT ON TABLE sentiment_results IS 'Hasil labeling sentimen dari model HF (Hugging Face)';
COMMENT ON COLUMN sentiment_results.sentiment_label IS 'Label sentimen: positive, negative, neutral, mixed';
COMMENT ON COLUMN sentiment_results.confidence_score IS 'Confidence score dari model (0.0 - 1.0)';
COMMENT ON COLUMN sentiment_results.model_name IS 'Nama model yang digunakan untuk analisis';
COMMENT ON COLUMN sentiment_results.raw_model_output IS 'Output mentah dari model untuk debugging/analisis lebih lanjut';

