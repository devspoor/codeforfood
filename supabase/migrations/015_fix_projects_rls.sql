-- Migration: Add missing RLS policies for projects table
-- Issue: projects table only had SELECT policy, missing UPDATE/DELETE/INSERT protection

-- Ensure RLS is enabled on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies for projects to recreate them properly
DROP POLICY IF EXISTS "Public can view project by specific hash" ON public.projects;
DROP POLICY IF EXISTS "Users can manage own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view own projects or public by hash" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects in own organizations" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

-- SELECT: Users can view their own projects OR public projects by hash
CREATE POLICY "Users can view own projects or public by hash" ON public.projects
  FOR SELECT USING (
    -- Owner can always view via organization
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = projects.organization_id
      AND o.user_id = auth.uid()
    )
    OR
    -- Public access only via hash lookup
    hash IS NOT NULL
  );

-- INSERT: Users can only create projects in their own organizations
CREATE POLICY "Users can create projects in own organizations" ON public.projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id
      AND o.user_id = auth.uid()
    )
  );

-- UPDATE: Users can only update projects in their own organizations
CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = projects.organization_id
      AND o.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id
      AND o.user_id = auth.uid()
    )
  );

-- DELETE: Users can only delete projects in their own organizations
CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = projects.organization_id
      AND o.user_id = auth.uid()
    )
  );

-- ============================================
-- ORGANIZATIONS
-- ============================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies for organizations
DROP POLICY IF EXISTS "Public can view organization by specific hash" ON public.organizations;
DROP POLICY IF EXISTS "Users can manage own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view own organizations or public by hash" ON public.organizations;
DROP POLICY IF EXISTS "Users can create own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can update own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can delete own organizations" ON public.organizations;

-- SELECT: Users can view their own orgs OR public orgs by hash
CREATE POLICY "Users can view own organizations or public by hash" ON public.organizations
  FOR SELECT USING (
    auth.uid() = user_id
    OR
    hash IS NOT NULL
  );

-- INSERT: Users can only create organizations for themselves
CREATE POLICY "Users can create own organizations" ON public.organizations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- UPDATE: Users can only update their own organizations
CREATE POLICY "Users can update own organizations" ON public.organizations
  FOR UPDATE USING (
    auth.uid() = user_id
  ) WITH CHECK (
    auth.uid() = user_id
  );

-- DELETE: Users can only delete their own organizations
CREATE POLICY "Users can delete own organizations" ON public.organizations
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- ============================================
-- MILESTONES
-- ============================================
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies for milestones
DROP POLICY IF EXISTS "Public can view milestones of public projects" ON public.milestones;
DROP POLICY IF EXISTS "Users can manage own milestones" ON public.milestones;
DROP POLICY IF EXISTS "Users can view own milestones or public" ON public.milestones;

-- SELECT: Users can view their own milestones OR public milestones
CREATE POLICY "Users can view own milestones or public" ON public.milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organizations o ON p.organization_id = o.id
      WHERE p.id = milestones.project_id
      AND o.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = milestones.project_id
      AND p.hash IS NOT NULL
    )
  );

-- INSERT/UPDATE/DELETE: Only for own milestones
CREATE POLICY "Users can manage own milestones" ON public.milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organizations o ON p.organization_id = o.id
      WHERE p.id = milestones.project_id
      AND o.user_id = auth.uid()
    )
  );
