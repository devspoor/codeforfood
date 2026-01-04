-- Migration: Add secure notes to projects
-- Secure notes allow project owners to store encrypted credentials/info
-- that clients can access with a password

-- Add secure note columns to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS secure_note_encrypted TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS secure_note_password_hash TEXT;

-- secure_note_encrypted contains JSON with:
-- {
--   "salt": "base64",      -- Salt for PBKDF2 key derivation
--   "iv": "base64",        -- Initialization vector for AES-256-GCM
--   "ciphertext": "base64" -- Encrypted note (includes auth tag)
-- }
--
-- Security model:
-- - Password is hashed with bcrypt (12 rounds) for validation
-- - Encryption key is derived from password using PBKDF2 (100,000 iterations, SHA-256)
-- - Note content is encrypted with AES-256-GCM
-- - All crypto operations happen server-side
-- - Rate limiting should be applied at API layer

COMMENT ON COLUMN public.projects.secure_note_encrypted IS 'JSON object containing encrypted note data (salt, iv, ciphertext)';
COMMENT ON COLUMN public.projects.secure_note_password_hash IS 'bcrypt hash of the note password for validation';
