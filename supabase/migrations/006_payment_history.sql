-- Migration: Add payment history tracking
-- Tracks all payment additions to milestones

-- ===========================================
-- 1. Payment history table
-- ===========================================
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_milestone_id ON public.payment_history(milestone_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON public.payment_history(created_at);

-- ===========================================
-- 2. Add show_payment_history to projects
-- ===========================================
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS show_payment_history BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.projects.show_payment_history IS 'Whether to show payment history on the public project page';

-- ===========================================
-- 3. RLS Policies for payment_history
-- ===========================================
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage payment history for their projects
CREATE POLICY "Users can manage payment history for their projects" ON public.payment_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.milestones m
      JOIN public.projects p ON m.project_id = p.id
      JOIN public.organizations o ON p.organization_id = o.id
      WHERE m.id = payment_history.milestone_id
      AND o.user_id = auth.uid()
    )
  );

-- Allow public read access for projects with show_payment_history enabled
CREATE POLICY "Public can view payment history if enabled" ON public.payment_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.milestones m
      JOIN public.projects p ON m.project_id = p.id
      WHERE m.id = payment_history.milestone_id
      AND p.show_payment_history = true
    )
  );
