-- Migration: Add positive amount validation to payment functions
-- Issue: Negative amounts can be passed, allowing silent payment reversals
-- Solution: Validate amount > 0 in the atomic payment function

-- ============================================
-- UPDATE record_payment_atomic FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.record_payment_atomic(
  p_milestone_id UUID,
  p_amount DECIMAL(12,2),
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entry_id UUID;
  v_total_paid DECIMAL(12,2);
  v_milestone_amount DECIMAL(12,2);
  v_milestone_type TEXT;
  v_is_paid BOOLEAN;
  v_paid_at TIMESTAMPTZ;
BEGIN
  -- 1. Lock milestone row to prevent concurrent updates
  SELECT amount, type INTO v_milestone_amount, v_milestone_type
  FROM public.milestones
  WHERE id = p_milestone_id
  FOR UPDATE;

  IF v_milestone_amount IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Milestone not found'
    );
  END IF;

  -- 2. Validate amount is non-null, non-zero, and POSITIVE
  IF p_amount IS NULL OR p_amount = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Amount must be non-zero'
    );
  END IF;

  -- 3. NEW: Validate amount is positive (no negative payments)
  -- Negative amounts should use explicit refund/reversal operations
  IF p_amount < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Amount must be positive. Use delete_payment_atomic for reversals.'
    );
  END IF;

  -- 4. Insert payment history entry (within same transaction)
  INSERT INTO public.payment_history (milestone_id, amount, note)
  VALUES (p_milestone_id, p_amount, p_note)
  RETURNING id INTO v_entry_id;

  -- 5. Recalculate total from ALL payment history entries
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM public.payment_history
  WHERE milestone_id = p_milestone_id;

  -- 6. Determine new payment status
  v_is_paid := v_total_paid >= v_milestone_amount;
  v_paid_at := CASE
    WHEN v_is_paid THEN NOW()
    ELSE NULL
  END;

  -- 7. Update milestone with recalculated values (row is still locked)
  UPDATE public.milestones
  SET
    paid_amount = LEAST(v_total_paid, v_milestone_amount),
    is_paid = v_is_paid,
    paid_at = v_paid_at
  WHERE id = p_milestone_id;

  -- 8. Return success with all relevant data
  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'paid_amount', LEAST(v_total_paid, v_milestone_amount),
    'total_paid', v_total_paid,
    'is_paid', v_is_paid,
    'paid_at', v_paid_at
  );

EXCEPTION WHEN OTHERS THEN
  -- Transaction automatically rolls back on exception
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- ============================================
-- ADD CHECK CONSTRAINT TO payment_history TABLE
-- ============================================
-- This is a database-level safeguard in case validation is bypassed

-- First drop if exists (for idempotency)
ALTER TABLE public.payment_history DROP CONSTRAINT IF EXISTS payment_history_amount_positive;

-- Add constraint: amount must be positive
ALTER TABLE public.payment_history ADD CONSTRAINT payment_history_amount_positive
  CHECK (amount > 0);

-- ============================================
-- COMMENT
-- ============================================
-- This migration ensures financial integrity by:
-- 1. Validating positive amounts in the atomic function
-- 2. Adding a database constraint as a safety net
-- 3. Negative amounts (refunds) should use explicit delete_payment_atomic
