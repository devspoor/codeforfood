-- Operating Expenses table
CREATE TABLE public.operating_expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_operating_expenses_project_id ON public.operating_expenses(project_id);

-- Enable RLS
ALTER TABLE public.operating_expenses ENABLE ROW LEVEL SECURITY;

-- Users can manage operating expenses for own projects
CREATE POLICY "Users can manage operating expenses for own projects" ON public.operating_expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organizations o ON p.organization_id = o.id
      WHERE p.id = operating_expenses.project_id
      AND o.user_id = auth.uid()
    )
  );

-- Anyone can view operating expenses (for public project pages)
CREATE POLICY "Anyone can view operating expenses" ON public.operating_expenses
  FOR SELECT USING (true);
