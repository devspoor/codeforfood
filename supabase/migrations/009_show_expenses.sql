-- Add show_expenses column to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS show_expenses BOOLEAN NOT NULL DEFAULT false;
