-- Atomic time entry creation with limit validation
-- Uses row-level locking (FOR UPDATE) to prevent race conditions on hours/units limits

CREATE OR REPLACE FUNCTION public.add_time_entry_atomic(
  p_milestone_id UUID,
  p_date DATE,
  p_hours DECIMAL(10,2) DEFAULT NULL,
  p_units INTEGER DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_paid_amount DECIMAL(12,2) DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entry_id UUID;
  v_milestone_type TEXT;
  v_hours_limit DECIMAL(10,2);
  v_units_limit INTEGER;
  v_existing_hours DECIMAL(10,2);
  v_existing_units INTEGER;
BEGIN
  -- 1. Lock milestone row to prevent concurrent updates
  SELECT type, hours_limit, units_limit
  INTO v_milestone_type, v_hours_limit, v_units_limit
  FROM public.milestones
  WHERE id = p_milestone_id
  FOR UPDATE;

  IF v_milestone_type IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Milestone not found'
    );
  END IF;

  -- 2. Validate hours limit for hourly milestones
  IF v_milestone_type = 'hourly' AND v_hours_limit IS NOT NULL AND v_hours_limit > 0 THEN
    SELECT COALESCE(SUM(hours), 0) INTO v_existing_hours
    FROM public.time_entries
    WHERE milestone_id = p_milestone_id;

    IF v_existing_hours + COALESCE(p_hours, 0) > v_hours_limit THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Would exceed hours limit',
        'remaining', v_hours_limit - v_existing_hours,
        'limit', v_hours_limit
      );
    END IF;
  END IF;

  -- 3. Validate units limit for per_unit milestones
  IF v_milestone_type = 'per_unit' AND v_units_limit IS NOT NULL AND v_units_limit > 0 THEN
    SELECT COALESCE(SUM(units), 0) INTO v_existing_units
    FROM public.time_entries
    WHERE milestone_id = p_milestone_id;

    IF v_existing_units + COALESCE(p_units, 0) > v_units_limit THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Would exceed units limit',
        'remaining', v_units_limit - v_existing_units,
        'limit', v_units_limit
      );
    END IF;
  END IF;

  -- 4. Insert time entry (within same transaction, milestone is still locked)
  INSERT INTO public.time_entries (milestone_id, date, hours, units, description, paid_amount)
  VALUES (p_milestone_id, p_date, p_hours, p_units, p_description, p_paid_amount)
  RETURNING id INTO v_entry_id;

  -- 5. Return success with entry data
  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'milestone_id', p_milestone_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Atomic milestone creation with proper ordering
-- Uses row-level locking to prevent duplicate order values

CREATE OR REPLACE FUNCTION public.add_milestone_atomic(
  p_project_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_type TEXT DEFAULT 'fixed',
  p_amount DECIMAL(12,2) DEFAULT 0,
  p_hourly_rate DECIMAL(12,2) DEFAULT NULL,
  p_estimated_hours DECIMAL(10,2) DEFAULT NULL,
  p_hours_limit DECIMAL(10,2) DEFAULT NULL,
  p_unit_rate DECIMAL(12,2) DEFAULT NULL,
  p_unit_label TEXT DEFAULT 'unit',
  p_estimated_units INTEGER DEFAULT NULL,
  p_units_limit INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_milestone_id UUID;
  v_next_order INTEGER;
BEGIN
  -- 1. Lock all milestones for this project to prevent concurrent inserts getting same order
  -- This is a table-level lock on the subset of rows for this project
  PERFORM 1 FROM public.milestones
  WHERE project_id = p_project_id
  FOR UPDATE;

  -- 2. Get next order value
  SELECT COALESCE(MAX("order"), -1) + 1 INTO v_next_order
  FROM public.milestones
  WHERE project_id = p_project_id;

  -- 3. Insert milestone
  INSERT INTO public.milestones (
    project_id,
    title,
    description,
    type,
    "order",
    amount,
    paid_amount,
    is_paid,
    hourly_rate,
    estimated_hours,
    hours_limit,
    unit_rate,
    unit_label,
    estimated_units,
    units_limit
  )
  VALUES (
    p_project_id,
    p_title,
    p_description,
    p_type,
    v_next_order,
    CASE WHEN p_type = 'fixed' THEN p_amount ELSE 0 END,
    0,
    false,
    CASE WHEN p_type = 'hourly' THEN p_hourly_rate ELSE NULL END,
    CASE WHEN p_type = 'hourly' THEN p_estimated_hours ELSE NULL END,
    CASE WHEN p_type = 'hourly' THEN p_hours_limit ELSE NULL END,
    CASE WHEN p_type = 'per_unit' THEN p_unit_rate ELSE NULL END,
    CASE WHEN p_type = 'per_unit' THEN p_unit_label ELSE NULL END,
    CASE WHEN p_type = 'per_unit' THEN p_estimated_units ELSE NULL END,
    CASE WHEN p_type = 'per_unit' THEN p_units_limit ELSE NULL END
  )
  RETURNING id INTO v_milestone_id;

  -- 4. Return success
  RETURN jsonb_build_object(
    'success', true,
    'milestone_id', v_milestone_id,
    'order', v_next_order
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Atomic project transfer with transaction safety
CREATE OR REPLACE FUNCTION public.transfer_project_atomic(
  p_project_id UUID,
  p_target_org_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_source_org_id UUID;
  v_project_exists BOOLEAN;
  v_target_org_exists BOOLEAN;
BEGIN
  -- 1. Lock and verify project belongs to user
  SELECT p.organization_id INTO v_source_org_id
  FROM public.projects p
  JOIN public.organizations o ON p.organization_id = o.id
  WHERE p.id = p_project_id AND o.user_id = p_user_id
  FOR UPDATE OF p;

  IF v_source_org_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Project not found or unauthorized'
    );
  END IF;

  -- 2. Verify target organization belongs to user (with lock)
  SELECT EXISTS(
    SELECT 1 FROM public.organizations
    WHERE id = p_target_org_id AND user_id = p_user_id
    FOR UPDATE
  ) INTO v_target_org_exists;

  IF NOT v_target_org_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Target organization not found or unauthorized'
    );
  END IF;

  -- 3. Don't transfer to same org
  IF v_source_org_id = p_target_org_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Project is already in this organization'
    );
  END IF;

  -- 4. Transfer project
  UPDATE public.projects
  SET organization_id = p_target_org_id
  WHERE id = p_project_id;

  RETURN jsonb_build_object(
    'success', true,
    'project_id', p_project_id,
    'from_org', v_source_org_id,
    'to_org', p_target_org_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_time_entry_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_milestone_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_project_atomic TO authenticated;
