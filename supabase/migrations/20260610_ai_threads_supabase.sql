CREATE TABLE ai_threads (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    messages JSONB,
    updated_at BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ai_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own AI threads"
    ON ai_threads FOR ALL
    USING (auth.uid() = user_id);
