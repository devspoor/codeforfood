-- Migration: Add automatic cleanup for rate_limits table
-- Issue: rate_limits table grows unbounded over time
-- Solution: Add expiry column and scheduled cleanup function

-- Add expires_at column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'rate_limits'
    AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.rate_limits
    ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Drop existing function first to allow signature changes
DROP FUNCTION IF EXISTS public.check_rate_limit(TEXT, INT, INT);

-- Recreate check_rate_limit function with expires_at support
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max_attempts INT,
  p_window_seconds INT
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining_attempts INT,
  reset_in_seconds INT,
  is_blocked BOOLEAN
) AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_attempts INT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;
  v_expires_at := NOW() + (p_window_seconds || ' seconds')::INTERVAL;

  -- Insert or update the rate limit entry
  INSERT INTO public.rate_limits (key, attempts, window_start, expires_at)
  VALUES (p_key, 1, NOW(), v_expires_at)
  ON CONFLICT (key) DO UPDATE SET
    attempts = CASE
      WHEN rate_limits.window_start < v_window_start THEN 1
      ELSE rate_limits.attempts + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start < v_window_start THEN NOW()
      ELSE rate_limits.window_start
    END,
    expires_at = v_expires_at
  RETURNING rate_limits.attempts INTO v_current_attempts;

  -- Return the result
  RETURN QUERY SELECT
    v_current_attempts <= p_max_attempts AS allowed,
    GREATEST(0, p_max_attempts - v_current_attempts) AS remaining_attempts,
    p_window_seconds AS reset_in_seconds,
    v_current_attempts > p_max_attempts AS is_blocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS INT AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM public.rate_limits
  WHERE expires_at < NOW()
  OR (expires_at IS NULL AND window_start < NOW() - INTERVAL '1 day');

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index on expires_at for efficient cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at
ON public.rate_limits (expires_at)
WHERE expires_at IS NOT NULL;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.cleanup_expired_rate_limits() TO service_role;

-- ============================================
-- COMMENTS
-- ============================================
-- This migration adds automatic expiry tracking to rate_limits:
-- 1. expires_at column tracks when each entry can be safely deleted
-- 2. check_rate_limit now sets expires_at on each entry
-- 3. cleanup_expired_rate_limits() can be called periodically (e.g., via cron)
--    to remove old entries
--
-- To set up automatic cleanup, add a pg_cron job in Supabase Dashboard:
-- SELECT cron.schedule('cleanup-rate-limits', '0 * * * *', 'SELECT cleanup_expired_rate_limits()');
-- This runs hourly and removes expired entries.
