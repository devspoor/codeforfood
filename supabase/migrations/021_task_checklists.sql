-- Task Checklists
CREATE TABLE IF NOT EXISTS public.task_checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Checklist Items
CREATE TABLE IF NOT EXISTS public.task_checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.task_checklists(id) ON DELETE CASCADE,
  text VARCHAR(500) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_checklists_task_id ON public.task_checklists(task_id);
CREATE INDEX IF NOT EXISTS idx_task_checklist_items_checklist_id ON public.task_checklist_items(checklist_id);

-- RLS
ALTER TABLE public.task_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;

-- Checklists: owner access via task -> project -> organization
CREATE POLICY "task_checklists_owner" ON public.task_checklists
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.projects p ON t.project_id = p.id
    JOIN public.organizations o ON p.organization_id = o.id
    WHERE t.id = task_checklists.task_id AND o.user_id = auth.uid()
  )
);

-- Checklist items: owner access via checklist -> task -> project -> organization
CREATE POLICY "task_checklist_items_owner" ON public.task_checklist_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.task_checklists c
    JOIN public.tasks t ON c.task_id = t.id
    JOIN public.projects p ON t.project_id = p.id
    JOIN public.organizations o ON p.organization_id = o.id
    WHERE c.id = task_checklist_items.checklist_id AND o.user_id = auth.uid()
  )
);

-- Public read for checklists (when board is public)
CREATE POLICY "task_checklists_public_read" ON public.task_checklists
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.projects p ON t.project_id = p.id
    WHERE t.id = task_checklists.task_id AND p.tasks_board_public = true
  )
);

CREATE POLICY "task_checklist_items_public_read" ON public.task_checklist_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.task_checklists c
    JOIN public.tasks t ON c.task_id = t.id
    JOIN public.projects p ON t.project_id = p.id
    WHERE c.id = task_checklist_items.checklist_id AND p.tasks_board_public = true
  )
);
