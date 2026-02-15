-- Telegram users (links Telegram accounts to CodeForFood users)
CREATE TABLE telegram_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    telegram_id BIGINT NOT NULL DEFAULT 0,
    telegram_username TEXT,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    link_token TEXT,
    link_token_expires_at TIMESTAMPTZ,
    UNIQUE(user_id)
);

-- Create unique index on telegram_id but only when it's not 0 (placeholder)
CREATE UNIQUE INDEX idx_telegram_users_telegram_id_unique
    ON telegram_users(telegram_id)
    WHERE telegram_id != 0;

-- Chat/topic to project bindings
CREATE TABLE telegram_chat_bindings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id BIGINT NOT NULL,
    thread_id BIGINT,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    bound_by UUID NOT NULL REFERENCES telegram_users(id) ON DELETE CASCADE,
    access_mode TEXT NOT NULL DEFAULT 'owner_only' CHECK (access_mode IN ('owner_only', 'all')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint on chat_id + thread_id combination
-- Using COALESCE to handle NULL thread_id
CREATE UNIQUE INDEX idx_telegram_chat_bindings_unique
    ON telegram_chat_bindings(chat_id, COALESCE(thread_id, -1));

-- Indexes for faster lookups
CREATE INDEX idx_telegram_users_link_token ON telegram_users(link_token) WHERE link_token IS NOT NULL;
CREATE INDEX idx_telegram_chat_bindings_chat ON telegram_chat_bindings(chat_id, thread_id);
CREATE INDEX idx_telegram_chat_bindings_project ON telegram_chat_bindings(project_id);

-- RLS Policies
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_chat_bindings ENABLE ROW LEVEL SECURITY;

-- telegram_users: users can manage their own telegram link
CREATE POLICY "Users can view own telegram link"
    ON telegram_users FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own telegram link"
    ON telegram_users FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own telegram link"
    ON telegram_users FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own telegram link"
    ON telegram_users FOR DELETE
    USING (user_id = auth.uid());

-- telegram_chat_bindings: users can manage bindings for their projects
CREATE POLICY "Users can view bindings for their projects"
    ON telegram_chat_bindings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN organizations o ON p.organization_id = o.id
            WHERE p.id = telegram_chat_bindings.project_id
            AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert bindings for their projects"
    ON telegram_chat_bindings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN organizations o ON p.organization_id = o.id
            WHERE p.id = project_id
            AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete bindings for their projects"
    ON telegram_chat_bindings FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN organizations o ON p.organization_id = o.id
            WHERE p.id = telegram_chat_bindings.project_id
            AND o.user_id = auth.uid()
        )
    );
