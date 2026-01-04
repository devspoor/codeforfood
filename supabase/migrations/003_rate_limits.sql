-- Rate limiting table for secure note password attempts
-- Persists across server restarts and works in distributed environments

CREATE TABLE public.rate_limits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  attempts INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMPTZ
);

-- Index for fast lookups
CREATE INDEX idx_rate_limits_key ON public.rate_limits(key);
CREATE INDEX idx_rate_limits_blocked_until ON public.rate_limits(blocked_until);

-- No RLS needed - this table is accessed via service role only
-- But we'll enable it and allow public access for the rate limit checks
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for rate limiting (public API)
CREATE POLICY "Anyone can check rate limits" ON public.rate_limits
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert rate limits" ON public.rate_limits
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update rate limits" ON public.rate_limits
  FOR UPDATE USING (true);

-- Function to check and update rate limit atomically
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_seconds INTEGER DEFAULT 900  -- 15 minutes
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining_attempts INTEGER,
  reset_in_seconds INTEGER,
  is_blocked BOOLEAN
) AS $$
DECLARE
  v_record public.rate_limits%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ := v_now - (p_window_seconds || ' seconds')::INTERVAL;
BEGIN
  -- Try to get existing record
  SELECT * INTO v_record FROM public.rate_limits WHERE key = p_key FOR UPDATE;

  IF v_record IS NULL THEN
    -- First attempt - create new record
    INSERT INTO public.rate_limits (key, attempts, first_attempt_at, last_attempt_at)
    VALUES (p_key, 1, v_now, v_now);

    RETURN QUERY SELECT
      TRUE::BOOLEAN,
      (p_max_attempts - 1)::INTEGER,
      p_window_seconds::INTEGER,
      FALSE::BOOLEAN;
    RETURN;
  END IF;

  -- Check if blocked
  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > v_now THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      0::INTEGER,
      EXTRACT(EPOCH FROM (v_record.blocked_until - v_now))::INTEGER,
      TRUE::BOOLEAN;
    RETURN;
  END IF;

  -- Check if window has expired - reset counter
  IF v_record.first_attempt_at < v_window_start THEN
    UPDATE public.rate_limits
    SET attempts = 1,
        first_attempt_at = v_now,
        last_attempt_at = v_now,
        blocked_until = NULL
    WHERE key = p_key;

    RETURN QUERY SELECT
      TRUE::BOOLEAN,
      (p_max_attempts - 1)::INTEGER,
      p_window_seconds::INTEGER,
      FALSE::BOOLEAN;
    RETURN;
  END IF;

  -- Check if max attempts reached
  IF v_record.attempts >= p_max_attempts THEN
    -- Block for the remaining window time
    UPDATE public.rate_limits
    SET blocked_until = v_record.first_attempt_at + (p_window_seconds || ' seconds')::INTERVAL,
        last_attempt_at = v_now
    WHERE key = p_key;

    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      0::INTEGER,
      EXTRACT(EPOCH FROM (v_record.first_attempt_at + (p_window_seconds || ' seconds')::INTERVAL - v_now))::INTEGER,
      TRUE::BOOLEAN;
    RETURN;
  END IF;

  -- Increment attempts
  UPDATE public.rate_limits
  SET attempts = attempts + 1,
      last_attempt_at = v_now
  WHERE key = p_key;

  RETURN QUERY SELECT
    TRUE::BOOLEAN,
    (p_max_attempts - v_record.attempts - 1)::INTEGER,
    EXTRACT(EPOCH FROM (v_record.first_attempt_at + (p_window_seconds || ' seconds')::INTERVAL - v_now))::INTEGER,
    FALSE::BOOLEAN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset rate limit (on successful auth)
CREATE OR REPLACE FUNCTION public.reset_rate_limit(p_key TEXT)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE key = p_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old records (run periodically via cron or manually)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits(p_older_than_hours INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.rate_limits
  WHERE last_attempt_at < NOW() - (p_older_than_hours || ' hours')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
