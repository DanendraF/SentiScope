-- Table: keywords
-- Fungsi: Kata penting yang sering muncul (extracted keyword/tag) - OPSIONAL

CREATE TABLE IF NOT EXISTS keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    raw_text_id UUID REFERENCES raw_texts(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    keyword_normalized VARCHAR(255) NOT NULL, -- Normalized version (lowercase, stemmed, dll)
    frequency INTEGER NOT NULL DEFAULT 1, -- Frekuensi kemunculan
    sentiment_distribution JSONB, -- Distribusi sentimen untuk keyword ini {positive: X, negative: Y, neutral: Z}
    importance_score DECIMAL(5, 4), -- Score importance (TF-IDF atau metode lain)
    category VARCHAR(100), -- Kategori keyword (product, service, emotion, dll)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT keyword_not_empty CHECK (LENGTH(TRIM(keyword)) > 0),
    CONSTRAINT valid_frequency CHECK (frequency > 0),
    CONSTRAINT valid_importance_score CHECK (importance_score IS NULL OR (importance_score >= 0 AND importance_score <= 1))
);

-- Indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_keywords_project_id ON keywords(project_id);
CREATE INDEX IF NOT EXISTS idx_keywords_raw_text_id ON keywords(raw_text_id);
CREATE INDEX IF NOT EXISTS idx_keywords_keyword_normalized ON keywords(keyword_normalized);
CREATE INDEX IF NOT EXISTS idx_keywords_frequency ON keywords(frequency DESC);
CREATE INDEX IF NOT EXISTS idx_keywords_importance_score ON keywords(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_keywords_category ON keywords(category);
CREATE INDEX IF NOT EXISTS idx_keywords_project_frequency ON keywords(project_id, frequency DESC);

-- Unique constraint untuk mencegah duplikasi keyword per project
CREATE UNIQUE INDEX IF NOT EXISTS idx_keywords_project_keyword_unique ON keywords(project_id, keyword_normalized);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_keywords_keyword_gin ON keywords USING gin(to_tsvector('english', keyword));

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_keywords_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_keywords_updated_at
    BEFORE UPDATE ON keywords
    FOR EACH ROW
    EXECUTE FUNCTION update_keywords_updated_at();

-- Comments untuk dokumentasi
COMMENT ON TABLE keywords IS 'Kata penting yang sering muncul (extracted keyword/tag) - OPSIONAL';
COMMENT ON COLUMN keywords.keyword_normalized IS 'Normalized version untuk matching (lowercase, stemmed, dll)';
COMMENT ON COLUMN keywords.frequency IS 'Frekuensi kemunculan keyword';
COMMENT ON COLUMN keywords.sentiment_distribution IS 'Distribusi sentimen untuk keyword ini dalam format JSON';
COMMENT ON COLUMN keywords.importance_score IS 'Score importance menggunakan TF-IDF atau metode lain (0.0 - 1.0)';
COMMENT ON COLUMN keywords.category IS 'Kategori keyword: product, service, emotion, feature, dll';

