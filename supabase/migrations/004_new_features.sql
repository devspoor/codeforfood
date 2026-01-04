-- Migration: Add hourly milestones, comments, attachments, project status/visibility
-- Run this in Supabase SQL Editor

-- ===========================================
-- 1. Add type column to milestones (fixed vs hourly)
-- ===========================================
ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'fixed' CHECK (type IN ('fixed', 'hourly'));

-- For hourly milestones: hourly rate
ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(12,2);

-- For hourly milestones: estimated hours (optional)
ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(8,2);

-- For hourly milestones: hours limit (optional max)
ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS hours_limit DECIMAL(8,2);

-- ===========================================
-- 2. Time entries table (for hourly milestones)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  hours DECIMAL(5,2) NOT NULL CHECK (hours > 0),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_milestone_id ON public.time_entries(milestone_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON public.time_entries(date);

-- RLS for time_entries
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage time entries for own milestones" ON public.time_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.milestones m
      JOIN public.projects p ON m.project_id = p.id
      JOIN public.organizations o ON p.organization_id = o.id
      WHERE m.id = time_entries.milestone_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view time entries" ON public.time_entries
  FOR SELECT USING (true);

-- ===========================================
-- 3. Comments table
-- ===========================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_project_id ON public.comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_milestone_id ON public.comments(milestone_id);

-- RLS for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage comments for own projects" ON public.comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organizations o ON p.organization_id = o.id
      WHERE p.id = comments.project_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===========================================
-- 4. Attachments table (external links)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'link' CHECK (type IN ('figma', 'github', 'demo', 'document', 'link')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_project_id ON public.attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_attachments_milestone_id ON public.attachments(milestone_id);

-- RLS for attachments
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage attachments for own projects" ON public.attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organizations o ON p.organization_id = o.id
      WHERE p.id = attachments.project_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view attachments" ON public.attachments
  FOR SELECT USING (true);

-- ===========================================
-- 5. Project status and visibility settings
-- ===========================================
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'in_progress'
CHECK (status IN ('in_progress', 'awaiting_payment', 'completed', 'on_hold'));

-- Visibility settings (what to show on public page)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS hide_amounts BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS hide_paid BOOLEAN NOT NULL DEFAULT FALSE;

-- Password protection for public page
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS public_password_hash TEXT;
