ALTER TABLE milestones ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE milestones ADD COLUMN recurrence_interval TEXT
  CHECK (recurrence_interval IS NULL OR recurrence_interval IN ('weekly', 'monthly', 'quarterly'));
ALTER TABLE milestones ADD COLUMN recurrence_next_date DATE;
ALTER TABLE milestones ADD COLUMN recurrence_end_date DATE;
ALTER TABLE milestones ADD COLUMN recurring_parent_id UUID REFERENCES milestones(id) ON DELETE SET NULL;

CREATE INDEX idx_milestones_recurring ON milestones(recurrence_next_date)
  WHERE is_recurring = true;
