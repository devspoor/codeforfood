-- Atomic payment recording function
-- Uses row-level locking (FOR UPDATE) to prevent race conditions

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

  -- 2. Validate amount
  IF p_amount IS NULL OR p_amount = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Amount must be non-zero'
    );
  END IF;

  -- 3. Insert payment history entry (within same transaction)
  INSERT INTO public.payment_history (milestone_id, amount, note)
  VALUES (p_milestone_id, p_amount, p_note)
  RETURNING id INTO v_entry_id;

  -- 4. Recalculate total from ALL payment history entries
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM public.payment_history
  WHERE milestone_id = p_milestone_id;

  -- 5. Determine new payment status
  v_is_paid := v_total_paid >= v_milestone_amount;
  v_paid_at := CASE
    WHEN v_is_paid THEN NOW()
    ELSE NULL
  END;

  -- 6. Update milestone with recalculated values (row is still locked)
  UPDATE public.milestones
  SET
    paid_amount = LEAST(v_total_paid, v_milestone_amount),
    is_paid = v_is_paid,
    paid_at = v_paid_at
  WHERE id = p_milestone_id;

  -- 7. Return success with all relevant data
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

-- Function to delete payment and recalculate atomically
CREATE OR REPLACE FUNCTION public.delete_payment_atomic(
  p_entry_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_milestone_id UUID;
  v_milestone_amount DECIMAL(12,2);
  v_total_paid DECIMAL(12,2);
  v_is_paid BOOLEAN;
  v_paid_at TIMESTAMPTZ;
BEGIN
  -- 1. Get milestone_id from entry
  SELECT milestone_id INTO v_milestone_id
  FROM public.payment_history
  WHERE id = p_entry_id;

  IF v_milestone_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment entry not found'
    );
  END IF;

  -- 2. Lock milestone row
  SELECT amount INTO v_milestone_amount
  FROM public.milestones
  WHERE id = v_milestone_id
  FOR UPDATE;

  -- 3. Delete the payment entry
  DELETE FROM public.payment_history
  WHERE id = p_entry_id;

  -- 4. Recalculate total
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM public.payment_history
  WHERE milestone_id = v_milestone_id;

  -- 5. Determine new status
  v_is_paid := v_total_paid >= v_milestone_amount;
  v_paid_at := CASE
    WHEN v_is_paid THEN NOW()
    ELSE NULL
  END;

  -- 6. Update milestone
  UPDATE public.milestones
  SET
    paid_amount = LEAST(v_total_paid, v_milestone_amount),
    is_paid = v_is_paid,
    paid_at = v_paid_at
  WHERE id = v_milestone_id;

  RETURN jsonb_build_object(
    'success', true,
    'milestone_id', v_milestone_id,
    'paid_amount', LEAST(v_total_paid, v_milestone_amount),
    'is_paid', v_is_paid
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.record_payment_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_payment_atomic TO authenticated;

-- Function to delete milestone and reorder remaining milestones atomically
CREATE OR REPLACE FUNCTION public.delete_milestone_atomic(
  p_milestone_id UUID,
  p_project_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_milestone_order INTEGER;
BEGIN
  -- 1. Get milestone order and lock row
  SELECT "order" INTO v_milestone_order
  FROM public.milestones
  WHERE id = p_milestone_id AND project_id = p_project_id
  FOR UPDATE;

  IF v_milestone_order IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Milestone not found'
    );
  END IF;

  -- 2. Delete the milestone (cascades to time_entries and payment_history)
  DELETE FROM public.milestones
  WHERE id = p_milestone_id AND project_id = p_project_id;

  -- 3. Reorder remaining milestones atomically
  UPDATE public.milestones
  SET "order" = "order" - 1
  WHERE project_id = p_project_id AND "order" > v_milestone_order;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_order', v_milestone_order
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_milestone_atomic TO authenticated;
