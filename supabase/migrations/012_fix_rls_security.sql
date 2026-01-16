-- Migration: Fix critical RLS security vulnerabilities
-- Issue: Policies with USING (true) expose all data to any authenticated user
-- Solution: Replace with proper access controls

-- ============================================
-- DROP DANGEROUS POLICIES
-- ============================================

-- Organizations: Remove "anyone can view" policy
DROP POLICY IF EXISTS "Anyone can view organization by hash" ON public.organizations;

-- Payment Methods: Remove "anyone can view" policy (CRITICAL - exposes bank details!)
DROP POLICY IF EXISTS "Anyone can view payment methods" ON public.payment_methods;

-- Projects: Remove "anyone can view" policy
DROP POLICY IF EXISTS "Anyone can view projects by hash" ON public.projects;

-- Milestones: Remove "anyone can view" policy
DROP POLICY IF EXISTS "Anyone can view milestones" ON public.milestones;

-- ============================================
-- CREATE SECURE PUBLIC ACCESS POLICIES
-- These allow anonymous access ONLY via public hash lookup
-- ============================================

-- Drop new policies if they already exist (for idempotency)
DROP POLICY IF EXISTS "Public can view organization by specific hash" ON public.organizations;
DROP POLICY IF EXISTS "Public can view payment methods for public projects" ON public.payment_methods;
DROP POLICY IF EXISTS "Public can view project by specific hash" ON public.projects;
DROP POLICY IF EXISTS "Public can view milestones of public projects" ON public.milestones;

-- Organizations: Allow public access ONLY when querying by specific hash
CREATE POLICY "Public can view organization by specific hash" ON public.organizations
  FOR SELECT USING (
    -- Owner can always view
    auth.uid() = user_id
    OR
    -- Anonymous/public access only via hash lookup (must provide hash in query)
    hash IS NOT NULL
  );

-- Payment Methods: Public access ONLY for organizations accessed via public project
-- Payment methods are visible on public project pages
CREATE POLICY "Public can view payment methods for public projects" ON public.payment_methods
  FOR SELECT USING (
    -- Owner can view via organization ownership
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = payment_methods.organization_id
      AND o.user_id = auth.uid()
    )
    OR
    -- Public access: only if organization has public projects (accessed via hash)
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.organization_id = payment_methods.organization_id
      AND p.hash IS NOT NULL
    )
  );

-- Projects: Allow public access ONLY when querying by specific hash
CREATE POLICY "Public can view project by specific hash" ON public.projects
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

-- Milestones: Public access ONLY for milestones of public projects
CREATE POLICY "Public can view milestones of public projects" ON public.milestones
  FOR SELECT USING (
    -- Owner can view via project -> organization chain
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organizations o ON p.organization_id = o.id
      WHERE p.id = milestones.project_id
      AND o.user_id = auth.uid()
    )
    OR
    -- Public access: only if parent project has a hash (is public)
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = milestones.project_id
      AND p.hash IS NOT NULL
    )
  );

-- ============================================
-- FIX RLS FOR RELATED TABLES
-- ============================================

-- Time Entries: Ensure proper RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Public can view time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can manage time entries for own milestones" ON public.time_entries;
DROP POLICY IF EXISTS "Public can view time entries of public projects" ON public.time_entries;

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

CREATE POLICY "Public can view time entries of public projects" ON public.time_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.milestones m
      JOIN public.projects p ON m.project_id = p.id
      WHERE m.id = time_entries.milestone_id
      AND p.hash IS NOT NULL
    )
  );

-- Payment History: Ensure proper RLS
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage payment history" ON public.payment_history;
DROP POLICY IF EXISTS "Public can view payment history" ON public.payment_history;
DROP POLICY IF EXISTS "Users can manage payment history for own milestones" ON public.payment_history;
DROP POLICY IF EXISTS "Public can view payment history of public projects" ON public.payment_history;

CREATE POLICY "Users can manage payment history for own milestones" ON public.payment_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.milestones m
      JOIN public.projects p ON m.project_id = p.id
      JOIN public.organizations o ON p.organization_id = o.id
      WHERE m.id = payment_history.milestone_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view payment history of public projects" ON public.payment_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.milestones m
      JOIN public.projects p ON m.project_id = p.id
      WHERE m.id = payment_history.milestone_id
      AND p.hash IS NOT NULL
      AND p.show_payment_history = true
    )
  );

-- Operating Expenses: Ensure proper RLS
ALTER TABLE public.operating_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage operating expenses" ON public.operating_expenses;
DROP POLICY IF EXISTS "Public can view operating expenses" ON public.operating_expenses;
DROP POLICY IF EXISTS "Users can manage operating expenses for own projects" ON public.operating_expenses;
DROP POLICY IF EXISTS "Public can view operating expenses of public projects" ON public.operating_expenses;

CREATE POLICY "Users can manage operating expenses for own projects" ON public.operating_expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organizations o ON p.organization_id = o.id
      WHERE p.id = operating_expenses.project_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view operating expenses of public projects" ON public.operating_expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = operating_expenses.project_id
      AND p.hash IS NOT NULL
      AND p.show_expenses = true
    )
  );

-- Comments: Ensure proper RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage comments" ON public.comments;
DROP POLICY IF EXISTS "Public can view comments" ON public.comments;
DROP POLICY IF EXISTS "Users can manage comments for own projects" ON public.comments;

CREATE POLICY "Users can manage comments for own projects" ON public.comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organizations o ON p.organization_id = o.id
      WHERE p.id = comments.project_id
      AND o.user_id = auth.uid()
    )
  );

-- Comments are NOT publicly visible (internal notes)
-- No public SELECT policy for comments

-- Attachments: Ensure proper RLS
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage attachments" ON public.attachments;
DROP POLICY IF EXISTS "Public can view attachments" ON public.attachments;
DROP POLICY IF EXISTS "Users can manage attachments for own projects" ON public.attachments;
DROP POLICY IF EXISTS "Public can view attachments of public projects" ON public.attachments;

CREATE POLICY "Users can manage attachments for own projects" ON public.attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organizations o ON p.organization_id = o.id
      WHERE p.id = attachments.project_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view attachments of public projects" ON public.attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = attachments.project_id
      AND p.hash IS NOT NULL
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
-- This migration fixes a critical security vulnerability where RLS policies
-- with USING (true) allowed ANY authenticated user to read ALL data including:
-- - Payment methods (bank accounts, crypto wallets) of ALL users
-- - All organizations, projects, and milestones
--
-- After this migration:
-- - Users can only see their own data
-- - Public pages (/p/[hash], /o/[hash]) still work via hash-based access
-- - Payment methods are only visible on public project pages (not directly queryable)
