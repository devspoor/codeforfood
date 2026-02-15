-- Drop the old policy that doesn't allow setting link_token to null
DROP POLICY IF EXISTS "Bot can update by link_token" ON telegram_users;

-- Recreate with WITH CHECK (true) to allow the update result
CREATE POLICY "Bot can update by link_token"
    ON telegram_users FOR UPDATE
    USING (link_token IS NOT NULL)
    WITH CHECK (true);
