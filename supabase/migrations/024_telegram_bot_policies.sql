-- Allow bot to read telegram_users by link_token (for token validation)
CREATE POLICY "Bot can read by link_token"
    ON telegram_users FOR SELECT
    USING (link_token IS NOT NULL);

-- Allow bot to update telegram_users by link_token (for linking account)
-- USING: can select rows with link_token
-- WITH CHECK: allows the result to have null link_token (after linking)
CREATE POLICY "Bot can update by link_token"
    ON telegram_users FOR UPDATE
    USING (link_token IS NOT NULL)
    WITH CHECK (true);

-- Allow bot to read telegram_users by telegram_id (for command access checks)
CREATE POLICY "Bot can read by telegram_id"
    ON telegram_users FOR SELECT
    USING (telegram_id != 0);

-- Allow bot to read chat bindings (for command handling)
CREATE POLICY "Bot can read all chat bindings"
    ON telegram_chat_bindings FOR SELECT
    USING (true);

-- Allow bot to insert chat bindings (via linked telegram user)
CREATE POLICY "Bot can insert chat bindings"
    ON telegram_chat_bindings FOR INSERT
    WITH CHECK (true);

-- Allow bot to delete chat bindings
CREATE POLICY "Bot can delete chat bindings"
    ON telegram_chat_bindings FOR DELETE
    USING (true);
