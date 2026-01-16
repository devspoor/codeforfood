-- Idempotency keys table for preventing duplicate payment operations
-- Keys expire after 24 hours to allow re-attempts after sufficient time

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on key + user_id combination
CREATE UNIQUE INDEX idx_idempotency_keys_key_user ON public.idempotency_keys(key, user_id);

-- Index for cleanup job
CREATE INDEX idx_idempotency_keys_created_at ON public.idempotency_keys(created_at);

-- Enable RLS
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own idempotency keys
CREATE POLICY "Users can only access their own idempotency keys"
  ON public.idempotency_keys
  FOR ALL
  USING (auth.uid() = user_id);

-- Function to check and store idempotency key
CREATE OR REPLACE FUNCTION public.check_idempotency_key(
  p_key TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing RECORD;
BEGIN
  -- Try to find existing key
  SELECT response, created_at INTO v_existing
  FROM public.idempotency_keys
  WHERE key = p_key AND user_id = p_user_id;

  IF FOUND THEN
    -- Check if key is still valid (less than 24 hours old)
    IF v_existing.created_at > NOW() - INTERVAL '24 hours' THEN
      RETURN jsonb_build_object(
        'exists', true,
        'response', v_existing.response
      );
    ELSE
      -- Key expired, delete it and allow new request
      DELETE FROM public.idempotency_keys
      WHERE key = p_key AND user_id = p_user_id;
    END IF;
  END IF;

  RETURN jsonb_build_object('exists', false);
END;
$$;

-- Function to store idempotency key result
CREATE OR REPLACE FUNCTION public.store_idempotency_key(
  p_key TEXT,
  p_user_id UUID,
  p_response JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.idempotency_keys (key, user_id, response)
  VALUES (p_key, p_user_id, p_response)
  ON CONFLICT (key, user_id) DO UPDATE
  SET response = p_response, created_at = NOW();
END;
$$;

-- Cleanup function for expired keys (run periodically via cron or pg_cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_idempotency_keys()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.idempotency_keys
  WHERE created_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_idempotency_key TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_idempotency_key TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_idempotency_keys TO authenticated;
