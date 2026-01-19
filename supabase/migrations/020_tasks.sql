-- ===========================================
-- Task Columns Table
-- ===========================================
CREATE TABLE IF NOT EXISTS public.task_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_done_column BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_columns_project_id ON public.task_columns(project_id);
CREATE INDEX IF NOT EXISTS idx_task_columns_position ON public.task_columns(project_id, position);

-- ===========================================
-- Tasks Table
-- ===========================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  column_id UUID NOT NULL REFERENCES public.task_columns(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  deadline TIMESTAMPTZ,
  position INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON public.tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone_id ON public.tasks(milestone_id);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON public.tasks(column_id, position);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_archived ON public.tasks(project_id, is_archived);

-- ===========================================
-- Add tasks_board_public to projects
-- ===========================================
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tasks_board_public BOOLEAN NOT NULL DEFAULT false;

-- ===========================================
-- Enable RLS
-- ===========================================
ALTER TABLE public.task_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS Policies for task_columns
-- ===========================================
CREATE POLICY "Users can manage task_columns for own projects" ON public.task_columns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organizations o ON p.organization_id = o.id
      WHERE p.id = task_columns.project_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view task_columns of public boards" ON public.task_columns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = task_columns.project_id
      AND p.tasks_board_public = true
      AND p.hash IS NOT NULL
    )
  );

-- ===========================================
-- RLS Policies for tasks
-- ===========================================
CREATE POLICY "Users can manage tasks for own projects" ON public.tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organizations o ON p.organization_id = o.id
      WHERE p.id = tasks.project_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view tasks of public boards" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id
      AND p.tasks_board_public = true
      AND p.hash IS NOT NULL
    )
  );

-- ===========================================
-- Trigger for updated_at
-- ===========================================
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
