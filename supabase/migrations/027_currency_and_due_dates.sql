-- Add currency to projects (default USD for existing data)
ALTER TABLE projects ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD';

-- Add due_date to milestones
ALTER TABLE milestones ADD COLUMN due_date DATE;
