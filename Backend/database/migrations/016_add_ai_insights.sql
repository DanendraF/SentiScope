-- Add AI insights column to analyses table
-- This stores the AI-generated insights for each analysis

ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS ai_insights TEXT;

COMMENT ON COLUMN analyses.ai_insights IS 'AI-generated insights and recommendations from OpenAI';
