-- Simplified analysis tables for quick implementation
-- Nanti bisa migrate ke schema lengkap (analysis_sessions, raw_texts, sentiment_results)

-- Table: analyses (simplified version)
-- Fungsi: Menyimpan summary dari setiap analisis
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    input_type VARCHAR(50) NOT NULL, -- 'text', 'batch', 'keywords'
    total_items INTEGER NOT NULL DEFAULT 0,
    positive_count INTEGER NOT NULL DEFAULT 0,
    negative_count INTEGER NOT NULL DEFAULT 0,
    neutral_count INTEGER NOT NULL DEFAULT 0,
    average_score DECIMAL(5, 4) NOT NULL DEFAULT 0, -- Average confidence score
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: analysis_items (simplified version)
-- Fungsi: Menyimpan detail setiap text yang dianalisis
CREATE TABLE IF NOT EXISTS analysis_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    text_content TEXT NOT NULL,
    sentiment_label VARCHAR(20) NOT NULL, -- 'positive', 'negative', 'neutral'
    confidence_score DECIMAL(5, 4) NOT NULL, -- Score 0.0 - 1.0
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_confidence_score CHECK (confidence_score >= 0 AND confidence_score <= 1),
    CONSTRAINT valid_sentiment_label CHECK (sentiment_label IN ('positive', 'negative', 'neutral', 'error'))
);

-- Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_input_type ON analyses(input_type);
CREATE INDEX IF NOT EXISTS idx_analysis_items_analysis_id ON analysis_items(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_items_sentiment_label ON analysis_items(sentiment_label);

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_analyses_updated_at
    BEFORE UPDATE ON analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_analyses_updated_at();

-- Comments
COMMENT ON TABLE analyses IS 'Simplified analysis summary table';
COMMENT ON TABLE analysis_items IS 'Detailed items for each analysis';
COMMENT ON COLUMN analyses.input_type IS 'Type of input: text, batch, or keywords';
COMMENT ON COLUMN analyses.total_items IS 'Total number of items analyzed';
