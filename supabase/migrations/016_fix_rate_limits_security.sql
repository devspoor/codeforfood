-- Migration: Fix critical rate_limits table security vulnerability
-- Issue: RLS policies allow ANY user to INSERT/UPDATE rate limits, completely bypassing rate limiting
-- Solution: Remove direct table access, all operations go through SECURITY DEFINER functions

-- ============================================
-- DROP DANGEROUS POLICIES
-- ============================================

-- These policies allow anyone to manipulate rate limit records
DROP POLICY IF EXISTS "Anyone can check rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Anyone can insert rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Anyone can update rate limits" ON public.rate_limits;

-- ============================================
-- CREATE RESTRICTIVE POLICIES
-- ============================================

-- No direct access to rate_limits table
-- All operations MUST go through SECURITY DEFINER functions:
--   - check_rate_limit()
--   - reset_rate_limit()
--   - cleanup_rate_limits()

-- Only allow SELECT for debugging purposes (optional, can be removed for stricter security)
-- This only shows records, cannot be used to bypass rate limiting
CREATE POLICY "Rate limits are read-only via direct access" ON public.rate_limits
  FOR SELECT USING (false);  -- Nobody can SELECT directly, use functions

-- Explicitly deny INSERT/UPDATE/DELETE via RLS
-- (Already denied by default when no policy exists, but being explicit)

-- ============================================
-- VERIFY FUNCTIONS USE SECURITY DEFINER
-- ============================================
-- The existing functions already use SECURITY DEFINER which bypasses RLS
-- This is correct - only functions can modify rate_limits, not direct table access

-- Grant USAGE on the table to anon role so functions can operate
-- But without INSERT/UPDATE/DELETE policies, direct access is blocked
GRANT SELECT ON public.rate_limits TO anon;
GRANT SELECT ON public.rate_limits TO authenticated;

-- Revoke direct INSERT/UPDATE/DELETE from all roles
REVOKE INSERT, UPDATE, DELETE ON public.rate_limits FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.rate_limits FROM authenticated;

-- Functions retain access via SECURITY DEFINER (runs as table owner)
