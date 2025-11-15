-- Table: analysis_chat_messages
-- Fungsi: Menyimpan chat messages untuk setiap analysis
CREATE TABLE IF NOT EXISTS analysis_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_chat_role CHECK (role IN ('user', 'assistant'))
);

-- Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_chat_messages_analysis_id ON analysis_chat_messages(analysis_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON analysis_chat_messages(created_at ASC);

-- Comments
COMMENT ON TABLE analysis_chat_messages IS 'Chat messages for analysis chatbot conversations';
COMMENT ON COLUMN analysis_chat_messages.role IS 'Message sender: user or assistant';
COMMENT ON COLUMN analysis_chat_messages.content IS 'Message content';
