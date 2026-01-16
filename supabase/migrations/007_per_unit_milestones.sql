-- Migration: Add per_unit milestone type (pay per item/unit)
-- Run this in Supabase SQL Editor

-- ===========================================
-- 1. Update milestones type constraint to include per_unit
-- ===========================================

-- Drop existing constraint
ALTER TABLE public.milestones DROP CONSTRAINT IF EXISTS milestones_type_check;

-- Add new constraint with per_unit
ALTER TABLE public.milestones
ADD CONSTRAINT milestones_type_check
CHECK (type IN ('fixed', 'hourly', 'per_unit'));

-- ===========================================
-- 2. Add per_unit specific fields to milestones
-- ===========================================

-- Rate per unit (e.g. $30 per app)
ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS unit_rate DECIMAL(12,2);

-- Custom label for units (e.g. "app", "integration", "widget", "screen")
ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS unit_label TEXT DEFAULT 'unit';

-- Estimated number of units (optional)
ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS estimated_units DECIMAL(8,2);

-- Maximum units limit (optional)
ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS units_limit DECIMAL(8,2);

-- ===========================================
-- 3. Add units field to time_entries for per_unit tracking
--    (reusing time_entries table for unit entries)
-- ===========================================

-- Add units column (for per_unit milestones, use this instead of hours)
ALTER TABLE public.time_entries
ADD COLUMN IF NOT EXISTS units DECIMAL(8,2);

-- Drop existing constraint on hours
ALTER TABLE public.time_entries DROP CONSTRAINT IF EXISTS time_entries_hours_check;

-- Allow hours to be NULL when units is set (and vice versa)
-- At least one of hours or units must be positive
ALTER TABLE public.time_entries
ADD CONSTRAINT time_entries_quantity_check
CHECK (
  (hours > 0 AND units IS NULL) OR
  (units > 0 AND hours IS NULL) OR
  (hours > 0 AND units > 0)
);

-- Make hours nullable (was required before)
ALTER TABLE public.time_entries
ALTER COLUMN hours DROP NOT NULL;

-- Add index for units
CREATE INDEX IF NOT EXISTS idx_time_entries_units ON public.time_entries(units) WHERE units IS NOT NULL;
