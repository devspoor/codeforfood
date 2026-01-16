-- Migration: Add atomic time entry update function with limit validation
-- Issue: PATCH /api/v1/time-entries/[id] bypasses hours/units limits
-- Solution: Create atomic update function with proper limit checking

CREATE OR REPLACE FUNCTION public.update_time_entry_atomic(
  p_entry_id UUID,
  p_date DATE DEFAULT NULL,
  p_hours DECIMAL(10,2) DEFAULT NULL,
  p_units INTEGER DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_paid_amount DECIMAL(12,2) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_milestone_id UUID;
  v_milestone_type TEXT;
  v_hours_limit DECIMAL(10,2);
  v_units_limit INTEGER;
  v_existing_hours DECIMAL(10,2);
  v_existing_units INTEGER;
  v_current_hours DECIMAL(10,2);
  v_current_units INTEGER;
BEGIN
  -- 1. Get current entry and lock it
  SELECT milestone_id, hours, units
  INTO v_milestone_id, v_current_hours, v_current_units
  FROM public.time_entries
  WHERE id = p_entry_id
  FOR UPDATE;

  IF v_milestone_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Time entry not found'
    );
  END IF;

  -- 2. Lock milestone row and get limits
  SELECT type, hours_limit, units_limit
  INTO v_milestone_type, v_hours_limit, v_units_limit
  FROM public.milestones
  WHERE id = v_milestone_id
  FOR UPDATE;

  -- 3. Validate hours limit for hourly milestones (if hours is being updated)
  IF p_hours IS NOT NULL AND v_milestone_type = 'hourly' AND v_hours_limit IS NOT NULL AND v_hours_limit > 0 THEN
    -- Get total hours excluding current entry
    SELECT COALESCE(SUM(hours), 0) INTO v_existing_hours
    FROM public.time_entries
    WHERE milestone_id = v_milestone_id AND id != p_entry_id;

    IF v_existing_hours + p_hours > v_hours_limit THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Would exceed hours limit',
        'remaining', v_hours_limit - v_existing_hours,
        'limit', v_hours_limit
      );
    END IF;
  END IF;

  -- 4. Validate units limit for per_unit milestones (if units is being updated)
  IF p_units IS NOT NULL AND v_milestone_type = 'per_unit' AND v_units_limit IS NOT NULL AND v_units_limit > 0 THEN
    -- Get total units excluding current entry
    SELECT COALESCE(SUM(units), 0) INTO v_existing_units
    FROM public.time_entries
    WHERE milestone_id = v_milestone_id AND id != p_entry_id;

    IF v_existing_units + p_units > v_units_limit THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Would exceed units limit',
        'remaining', v_units_limit - v_existing_units,
        'limit', v_units_limit
      );
    END IF;
  END IF;

  -- 5. Update the entry (only non-null values)
  UPDATE public.time_entries
  SET
    date = COALESCE(p_date, date),
    hours = COALESCE(p_hours, hours),
    units = COALESCE(p_units, units),
    description = CASE WHEN p_description IS NOT NULL THEN p_description ELSE description END,
    paid_amount = COALESCE(p_paid_amount, paid_amount)
  WHERE id = p_entry_id;

  -- 6. Return success
  RETURN jsonb_build_object(
    'success', true,
    'entry_id', p_entry_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_time_entry_atomic TO authenticated;
