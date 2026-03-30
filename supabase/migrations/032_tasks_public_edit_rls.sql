-- ===========================================
-- RLS: Allow public visitors to edit tasks on editable boards
-- ===========================================

-- INSERT: public can create tasks in editable boards
CREATE POLICY "Public can insert tasks on editable boards" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id
      AND p.tasks_board_public = true
      AND p.tasks_board_editable = true
      AND p.hash IS NOT NULL
    )
  );

-- UPDATE: public can update tasks on editable boards
CREATE POLICY "Public can update tasks on editable boards" ON public.tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id
      AND p.tasks_board_public = true
      AND p.tasks_board_editable = true
      AND p.hash IS NOT NULL
    )
  );

-- DELETE: public can delete tasks on editable boards
CREATE POLICY "Public can delete tasks on editable boards" ON public.tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id
      AND p.tasks_board_public = true
      AND p.tasks_board_editable = true
      AND p.hash IS NOT NULL
    )
  );
