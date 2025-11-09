-- Table: insight_summaries
-- Fungsi: Hasil insight & summary dari GPT/Gemini

CREATE TYPE ai_provider_enum AS ENUM ('openai', 'gemini', 'anthropic', 'custom');

CREATE TABLE IF NOT EXISTS insight_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    analysis_session_id UUID REFERENCES analysis_sessions(id) ON DELETE SET NULL,
    provider ai_provider_enum NOT NULL DEFAULT 'openai',
    model_name VARCHAR(255), -- Misal: gpt-4, gemini-pro, claude-3, dll
    summary_text TEXT NOT NULL,
    key_insights JSONB, -- Array of insights dalam format JSON
    recommendations JSONB, -- Array of recommendations dalam format JSON
    sentiment_summary JSONB, -- Summary statistik sentimen
    topics_extracted JSONB, -- Topics yang diekstrak
    prompt_used TEXT, -- Prompt yang digunakan untuk generate summary
    tokens_used INTEGER, -- Total tokens yang digunakan
    cost_estimate DECIMAL(10, 6), -- Estimasi cost dalam USD
    processing_time_ms INTEGER, -- Waktu processing dalam milliseconds
    raw_response JSONB, -- Raw response dari AI provider
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_tokens CHECK (tokens_used IS NULL OR tokens_used >= 0),
    CONSTRAINT valid_cost CHECK (cost_estimate IS NULL OR cost_estimate >= 0),
    CONSTRAINT valid_processing_time CHECK (processing_time_ms IS NULL OR processing_time_ms >= 0)
);

-- Indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_insight_summaries_project_id ON insight_summaries(project_id);
CREATE INDEX IF NOT EXISTS idx_insight_summaries_analysis_session_id ON insight_summaries(analysis_session_id);
CREATE INDEX IF NOT EXISTS idx_insight_summaries_provider ON insight_summaries(provider);
CREATE INDEX IF NOT EXISTS idx_insight_summaries_model_name ON insight_summaries(model_name);
CREATE INDEX IF NOT EXISTS idx_insight_summaries_created_at ON insight_summaries(created_at DESC);

-- Full text search index untuk summary_text
CREATE INDEX IF NOT EXISTS idx_insight_summaries_summary_text_gin ON insight_summaries USING gin(to_tsvector('english', summary_text));

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION update_insight_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_insight_summaries_updated_at
    BEFORE UPDATE ON insight_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_insight_summaries_updated_at();

-- Comments untuk dokumentasi
COMMENT ON TABLE insight_summaries IS 'Hasil insight & summary dari GPT/Gemini atau AI provider lainnya';
COMMENT ON COLUMN insight_summaries.provider IS 'AI provider: openai, gemini, anthropic, custom';
COMMENT ON COLUMN insight_summaries.key_insights IS 'Array of insights dalam format JSON';
COMMENT ON COLUMN insight_summaries.recommendations IS 'Array of recommendations dalam format JSON';
COMMENT ON COLUMN insight_summaries.sentiment_summary IS 'Summary statistik sentimen dalam format JSON';
COMMENT ON COLUMN insight_summaries.topics_extracted IS 'Topics yang diekstrak dalam format JSON';
COMMENT ON COLUMN insight_summaries.prompt_used IS 'Prompt yang digunakan untuk generate summary';
COMMENT ON COLUMN insight_summaries.cost_estimate IS 'Estimasi cost dalam USD';

