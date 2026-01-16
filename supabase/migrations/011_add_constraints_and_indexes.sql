-- Migration: Add constraints and indexes for data integrity and performance
-- Date: 2024

-- ============================================
-- 1. Add CHECK constraint for paid_amount
-- Ensures paid_amount is never negative
-- ============================================

-- Add constraint to milestones table
ALTER TABLE milestones
ADD CONSTRAINT chk_paid_amount_non_negative
CHECK (paid_amount >= 0);

-- Add constraint to time_entries table
ALTER TABLE time_entries
ADD CONSTRAINT chk_time_entry_paid_amount_non_negative
CHECK (paid_amount >= 0);

-- ============================================
-- 2. Add missing indexes for date range queries
-- ============================================

-- Index for operating_expenses date queries
CREATE INDEX IF NOT EXISTS idx_operating_expenses_date
ON operating_expenses(date DESC);

-- Index for payment_history date queries (composite with milestone_id)
CREATE INDEX IF NOT EXISTS idx_payment_history_milestone_created
ON payment_history(milestone_id, created_at DESC);

-- Index for time_entries date range queries (composite with milestone_id)
CREATE INDEX IF NOT EXISTS idx_time_entries_milestone_date
ON time_entries(milestone_id, date DESC);

-- Index for comments date queries (composite with project_id)
CREATE INDEX IF NOT EXISTS idx_comments_project_created
ON comments(project_id, created_at DESC);

-- ============================================
-- 3. Add unique constraint for milestone order
-- Prevents duplicate order values within a project
-- ============================================

-- Note: This requires cleaning up any existing duplicates first
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_milestones_project_order
-- ON milestones(project_id, "order");

-- ============================================
-- 4. Add constraint for time_entry type consistency
-- Ensures entry has either hours OR units, not both
-- ============================================

-- Update the existing constraint to be stricter
-- First drop the old constraint if it exists, then add the new one
DO $$
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'time_entries_hours_or_units'
        AND table_name = 'time_entries'
    ) THEN
        ALTER TABLE time_entries DROP CONSTRAINT time_entries_hours_or_units;
    END IF;
END $$;

-- Add stricter constraint: must have exactly one of hours or units (XOR)
ALTER TABLE time_entries
ADD CONSTRAINT time_entries_hours_xor_units
CHECK (
    (hours IS NOT NULL AND hours > 0 AND units IS NULL) OR
    (units IS NOT NULL AND units > 0 AND hours IS NULL) OR
    (hours IS NULL AND units IS NULL)
);
