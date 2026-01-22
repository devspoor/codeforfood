-- Task Attachments (links and files)
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('link', 'file')),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON public.task_attachments(task_id);

-- RLS
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- Owner access via task -> project -> organization
CREATE POLICY "task_attachments_owner" ON public.task_attachments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.projects p ON t.project_id = p.id
    JOIN public.organizations o ON p.organization_id = o.id
    WHERE t.id = task_attachments.task_id AND o.user_id = auth.uid()
  )
);

-- Public read (when board is public)
CREATE POLICY "task_attachments_public_read" ON public.task_attachments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.projects p ON t.project_id = p.id
    WHERE t.id = task_attachments.task_id AND p.tasks_board_public = true
  )
);
