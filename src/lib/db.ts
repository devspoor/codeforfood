import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import type { User } from "@supabase/supabase-js";
import type { Organization, Project, Milestone, PaymentMethod, ProjectSummary, TimeEntry, Comment, Attachment, PaymentHistoryEntry, OperatingExpense, TaskColumn, Task, TaskBoardData, TaskPriority, TaskChecklist, TaskChecklistItem, TaskAttachment, TaskAttachmentType } from "./types";
import { normalizeProjectData } from "./db/normalize";
import { roundCurrency, calculateAmount, sumCurrency, calculatePercent } from "./format";
import { canUserCreateOrganization, canUserCreateProject } from "@/lib/paddle/access";

/**
 * Generates a cryptographically secure URL-safe hash
 * Uses 12 bytes = 96 bits of entropy, encoded as base64url (16 chars)
 * Much stronger than the previous 8 chars with Math.random() (~48 bits)
 */
function generateHash(): string {
  return randomBytes(12).toString("base64url");
}

// Auth helpers
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Verifies that the current user owns the project through their organization
 * Returns the project if authorized, null otherwise
 * @param projectId - The project ID to verify
 * @param existingUser - Optional user to avoid duplicate auth call
 */
export async function verifyProjectOwnership(projectId: string, existingUser?: User | null): Promise<Project | null> {
  const supabase = await createClient();
  const user = existingUser ?? await getCurrentUser();
  if (!user) return null;

  const { data: project } = await supabase
    .from("projects")
    .select("*, organizations!inner(user_id)")
    .eq("id", projectId)
    .eq("organizations.user_id", user.id)
    .single();

  if (!project) return null;

  return project;
}

/**
 * Verifies that the current user owns the milestone through project->organization chain
 * Returns the milestone if authorized, null otherwise
 */
export async function verifyMilestoneOwnership(milestoneId: string, existingUser?: User | null): Promise<Milestone | null> {
  const supabase = await createClient();
  const user = existingUser ?? await getCurrentUser();
  if (!user) return null;

  const { data: milestone } = await supabase
    .from("milestones")
    .select("*, projects!inner(organization_id, organizations!inner(user_id))")
    .eq("id", milestoneId)
    .eq("projects.organizations.user_id", user.id)
    .single();

  if (!milestone) return null;

  return milestone;
}

/**
 * Verifies that the current user owns the comment through project->organization chain
 * Returns the comment if authorized, null otherwise
 */
export async function verifyCommentOwnership(commentId: string, existingUser?: User | null): Promise<Comment | null> {
  const supabase = await createClient();
  const user = existingUser ?? await getCurrentUser();
  if (!user) return null;

  const { data: comment } = await supabase
    .from("comments")
    .select("*, projects!inner(organization_id, organizations!inner(user_id))")
    .eq("id", commentId)
    .eq("projects.organizations.user_id", user.id)
    .single();

  if (!comment) return null;

  return comment;
}

/**
 * Verifies that the current user owns the attachment through project->organization chain
 * Returns the attachment if authorized, null otherwise
 */
export async function verifyAttachmentOwnership(attachmentId: string, existingUser?: User | null): Promise<Attachment | null> {
  const supabase = await createClient();
  const user = existingUser ?? await getCurrentUser();
  if (!user) return null;

  const { data: attachment } = await supabase
    .from("attachments")
    .select("*, projects!inner(organization_id, organizations!inner(user_id))")
    .eq("id", attachmentId)
    .eq("projects.organizations.user_id", user.id)
    .single();

  if (!attachment) return null;

  return attachment;
}

/**
 * Verifies that the current user owns the time entry through milestone->project->organization chain
 * Returns the time entry if authorized, null otherwise
 */
export async function verifyTimeEntryOwnership(entryId: string, existingUser?: User | null): Promise<TimeEntry | null> {
  const supabase = await createClient();
  const user = existingUser ?? await getCurrentUser();
  if (!user) return null;

  const { data: entry } = await supabase
    .from("time_entries")
    .select("*, milestones!inner(project_id, projects!inner(organization_id, organizations!inner(user_id)))")
    .eq("id", entryId)
    .eq("milestones.projects.organizations.user_id", user.id)
    .single();

  if (!entry) return null;

  return entry;
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

// Organization CRUD
export async function getOrganizations(): Promise<Organization[]> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  const { data } = await supabase
    .from("organizations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data || [];
}

// Optimized: Get all organizations with their projects in one query
export async function getOrganizationsWithProjects(): Promise<(Organization & { projects: Project[] })[]> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  const { data } = await supabase
    .from("organizations")
    .select("*, payment_methods(*), projects(*, milestones(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map(org => ({
    ...org,
    projects: (org.projects || []).map((p: Project) => ({
      ...p,
      milestones: ((p.milestones as Milestone[]) || []).sort((a: Milestone, b: Milestone) => a.order - b.order)
    }))
  }));
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { data } = await supabase
    .from("organizations")
    .select("*, payment_methods(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return data;
}

export async function getOrganizationByHash(hash: string): Promise<Organization | null> {
  const supabase = await createClient();

  // Single query with join instead of 2 separate queries
  const { data: org } = await supabase
    .from("organizations")
    .select("*, payment_methods(*)")
    .eq("hash", hash)
    .single();

  return org;
}

export async function createOrganization(data: { name: string; description?: string }): Promise<Organization | null> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  // Check subscription limits
  const canCreate = await canUserCreateOrganization(user.id);
  if (!canCreate) {
    console.error("Subscription limit reached: cannot create organization");
    return null;
  }

  const { data: org, error } = await supabase
    .from("organizations")
    .insert({
      user_id: user.id,
      hash: generateHash(),
      name: data.name,
      description: data.description,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating organization:", error.code || "unknown");
    return null;
  }

  return org;
}

export async function updateOrganization(id: string, data: Partial<Pick<Organization, "name" | "description">>): Promise<Organization | null> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: org, error } = await supabase
    .from("organizations")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return null;
  return org;
}

export async function deleteOrganization(id: string): Promise<boolean> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return false;

  const { error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  return !error;
}

// Payment Methods
export async function getPaymentMethods(orgId: string): Promise<PaymentMethod[]> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  // Verify user owns the organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", orgId)
    .eq("user_id", user.id)
    .single();

  if (!org) return [];

  const { data } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("organization_id", orgId);

  return data || [];
}

export async function addPaymentMethod(orgId: string, data: Omit<PaymentMethod, "id" | "organization_id" | "created_at">): Promise<PaymentMethod | null> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  // Verify user owns the organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", orgId)
    .eq("user_id", user.id)
    .single();

  if (!org) return null;

  const { data: pm, error } = await supabase
    .from("payment_methods")
    .insert({
      organization_id: orgId,
      ...data,
    })
    .select()
    .single();

  if (error) return null;
  return pm;
}

export async function updatePaymentMethod(orgId: string, pmId: string, data: Partial<Omit<PaymentMethod, "id" | "organization_id" | "created_at">>): Promise<PaymentMethod | null> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  // Verify user owns the organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", orgId)
    .eq("user_id", user.id)
    .single();

  if (!org) return null;

  const { data: pm, error } = await supabase
    .from("payment_methods")
    .update(data)
    .eq("id", pmId)
    .eq("organization_id", orgId)
    .select()
    .single();

  if (error) return null;
  return pm;
}

export async function deletePaymentMethod(orgId: string, pmId: string): Promise<boolean> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return false;

  // Verify user owns the organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", orgId)
    .eq("user_id", user.id)
    .single();

  if (!org) return false;

  const { error } = await supabase
    .from("payment_methods")
    .delete()
    .eq("id", pmId)
    .eq("organization_id", orgId);

  return !error;
}

// Project CRUD
export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id")
    .eq("user_id", user.id);

  if (!orgs || orgs.length === 0) return [];

  const orgIds = orgs.map(o => o.id);

  const { data } = await supabase
    .from("projects")
    .select("*, milestones(*)")
    .in("organization_id", orgIds)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getProjectsByOrganization(orgId: string): Promise<Project[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("projects")
    .select("*, milestones(*)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  return (data || []).map(p => ({
    ...p,
    milestones: (p.milestones || []).sort((a: Milestone, b: Milestone) => a.order - b.order)
  }));
}

const PROJECT_SELECT_QUERY = "*, milestones(*, time_entries(*), payment_history(*)), comments(*), attachments(*), operating_expenses(*)";

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("projects")
    .select(PROJECT_SELECT_QUERY)
    .eq("id", id)
    .single();

  if (!data) return null;

  return normalizeProjectData(data);
}

export async function getProjectByHash(hash: string): Promise<Project | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("projects")
    .select(PROJECT_SELECT_QUERY)
    .eq("hash", hash)
    .single();

  if (!data) return null;

  return normalizeProjectData(data, { isPublic: true });
}

export async function createProject(data: { organizationId: string; name: string; description?: string; currency?: string }): Promise<Project | null> {
  const supabase = await createClient();

  // Get organization owner for subscription check
  const { data: org } = await supabase
    .from("organizations")
    .select("user_id")
    .eq("id", data.organizationId)
    .single();

  if (!org) return null;

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      organization_id: data.organizationId,
      hash: generateHash(),
      name: data.name,
      description: data.description,
      ...(data.currency ? { currency: data.currency } : {}),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating project:", error.code || "unknown");
    return null;
  }

  // Create default task columns for new project
  await createDefaultTaskColumns(project.id);

  return { ...project, milestones: [] };
}

export async function updateProject(id: string, data: Partial<Pick<Project, "name" | "description" | "status" | "hide_amounts" | "hide_paid" | "show_payment_history" | "show_expenses" | "tasks_board_public" | "tasks_board_editable" | "currency">>): Promise<Project | null> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  // Verify project belongs to user's organization
  const { data: project } = await supabase
    .from("projects")
    .select("id, organization_id, organizations!inner(user_id)")
    .eq("id", id)
    .eq("organizations.user_id", user.id)
    .single();

  if (!project) return null;

  const { data: updated, error } = await supabase
    .from("projects")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) return null;
  return updated;
}

export async function deleteProject(id: string): Promise<boolean> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return false;

  // Verify project belongs to user's organization
  const { data: project } = await supabase
    .from("projects")
    .select("id, organizations!inner(user_id)")
    .eq("id", id)
    .eq("organizations.user_id", user.id)
    .single();

  if (!project) return false;

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  return !error;
}

/**
 * Transfer a project to a different organization
 * Both the source and target organizations must belong to the current user
 */
export async function transferProject(projectId: string, targetOrganizationId: string): Promise<Project | null> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  // Verify project belongs to user's organization
  const { data: project } = await supabase
    .from("projects")
    .select("id, organization_id, organizations!inner(user_id)")
    .eq("id", projectId)
    .eq("organizations.user_id", user.id)
    .single();

  if (!project) return null;

  // Verify target organization belongs to user
  const { data: targetOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", targetOrganizationId)
    .eq("user_id", user.id)
    .single();

  if (!targetOrg) return null;

  // Don't transfer to the same organization
  if (project.organization_id === targetOrganizationId) return null;

  // Update the project's organization_id
  const { data: updated, error } = await supabase
    .from("projects")
    .update({ organization_id: targetOrganizationId })
    .eq("id", projectId)
    .select()
    .single();

  if (error) return null;
  return updated;
}

// Milestone CRUD
export async function addMilestone(projectId: string, data: {
  title: string;
  description?: string;
  type?: "fixed" | "hourly" | "per_unit";
  // Fixed milestone
  amount?: number;
  // Hourly milestone
  hourly_rate?: number;
  estimated_hours?: number;
  hours_limit?: number;
  // Per-unit milestone
  unit_rate?: number;
  unit_label?: string;
  estimated_units?: number;
  units_limit?: number;
  due_date?: string | null;
  // Recurring
  is_recurring?: boolean;
  recurrence_interval?: string | null;
  recurrence_next_date?: string | null;
  recurrence_end_date?: string | null;
}): Promise<Milestone | null> {
  const supabase = await createClient();

  // Get current max order
  const { data: existing } = await supabase
    .from("milestones")
    .select("order")
    .eq("project_id", projectId)
    .order("order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].order + 1 : 0;
  const milestoneType = data.type || "fixed";

  const insertData: Record<string, unknown> = {
    project_id: projectId,
    title: data.title,
    description: data.description,
    type: milestoneType,
    order: nextOrder,
    due_date: data.due_date || null,
    is_recurring: data.is_recurring || false,
    recurrence_interval: data.is_recurring ? data.recurrence_interval : null,
    recurrence_next_date: data.is_recurring ? data.recurrence_next_date : null,
    recurrence_end_date: data.is_recurring && data.recurrence_end_date ? data.recurrence_end_date : null,
  };

  if (milestoneType === "fixed") {
    insertData.amount = data.amount || 0;
    insertData.paid_amount = 0;
    insertData.is_paid = false;
  } else if (milestoneType === "hourly") {
    // Hourly milestone
    insertData.hourly_rate = data.hourly_rate || 0;
    insertData.estimated_hours = data.estimated_hours;
    insertData.hours_limit = data.hours_limit;
    insertData.amount = 0;
    insertData.paid_amount = 0;
    insertData.is_paid = false;
  } else {
    // Per-unit milestone
    insertData.unit_rate = data.unit_rate || 0;
    insertData.unit_label = data.unit_label || "unit";
    insertData.estimated_units = data.estimated_units;
    insertData.units_limit = data.units_limit;
    insertData.amount = 0;
    insertData.paid_amount = 0;
    insertData.is_paid = false;
  }

  const { data: milestone, error } = await supabase
    .from("milestones")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error creating milestone:", error.code || "unknown");
    return null;
  }

  return { ...milestone, time_entries: [] };
}

export async function updateMilestone(projectId: string, milestoneId: string, data: Partial<Omit<Milestone, "id" | "project_id" | "created_at">>): Promise<Milestone | null> {
  const supabase = await createClient();

  const { data: milestone, error } = await supabase
    .from("milestones")
    .update(data)
    .eq("id", milestoneId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return null;
  return milestone;
}

export async function updateMilestonePaidAmount(projectId: string, milestoneId: string, paidAmount: number): Promise<Milestone | null> {
  const supabase = await createClient();

  // Get current milestone with time entries to calculate total correctly
  const { data: current } = await supabase
    .from("milestones")
    .select("*, time_entries(*)")
    .eq("id", milestoneId)
    .single();

  if (!current) return null;

  // Calculate total based on milestone type
  let total: number;
  if (current.type === "hourly") {
    const entries = current.time_entries || [];
    const hours = entries.reduce((sum: number, e: TimeEntry) => sum + Number(e.hours || 0), 0);
    total = hours * Number(current.hourly_rate || 0);
  } else if (current.type === "per_unit") {
    const entries = current.time_entries || [];
    const units = entries.reduce((sum: number, e: TimeEntry) => sum + Number(e.units || 0), 0);
    total = units * Number(current.unit_rate || 0);
  } else {
    // Fixed milestone
    total = Number(current.amount || 0);
  }

  // Clamp to valid range (0 to total)
  const clampedPaidAmount = Math.max(0, total > 0 ? Math.min(paidAmount, total) : paidAmount);
  const isPaid = total > 0 && clampedPaidAmount >= total;

  const { data: milestone, error } = await supabase
    .from("milestones")
    .update({
      paid_amount: clampedPaidAmount,
      is_paid: isPaid,
      paid_at: isPaid ? new Date().toISOString() : null,
    })
    .eq("id", milestoneId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return null;
  return milestone;
}

export async function deleteMilestone(projectId: string, milestoneId: string): Promise<boolean> {
  const supabase = await createClient();

  // Use atomic RPC function to delete milestone and reorder remaining
  const { data: result, error } = await supabase.rpc("delete_milestone_atomic", {
    p_milestone_id: milestoneId,
    p_project_id: projectId,
  }) as { data: { success: boolean; error?: string } | null; error: Error | null };

  if (error || !result?.success) {
    console.error("Atomic milestone deletion failed:", error?.message || result?.error);
    return false;
  }

  return true;
}

// Summary calculations
export function getProjectSummary(project: Project): ProjectSummary {
  const milestones = project.milestones || [];

  // Calculate totals for fixed milestones (with proper currency rounding)
  const fixedMilestones = milestones.filter(m => m.type === "fixed" || !m.type);
  const fixedTotal = sumCurrency(fixedMilestones.map(m => Number(m.amount)));
  const fixedPaid = sumCurrency(fixedMilestones.map(m => Number(m.paid_amount || 0)));

  // Calculate totals for hourly milestones
  const hourlyMilestones = milestones.filter(m => m.type === "hourly");
  let totalHours = 0;
  let hourlyAmount = 0;
  let hourlyPaid = 0;

  hourlyMilestones.forEach(m => {
    const entries = m.time_entries || [];
    const hours = entries.reduce((sum, e) => sum + Number(e.hours || 0), 0);
    totalHours += hours;
    // Use calculateAmount for proper rounding: hours * hourly_rate
    const amount = calculateAmount(Number(m.hourly_rate || 0), hours);
    hourlyAmount += amount;
    // Sum paid_amount from all time entries
    hourlyPaid += sumCurrency(entries.map(e => Number(e.paid_amount || 0)));
  });

  // Round hourly totals
  hourlyAmount = roundCurrency(hourlyAmount);
  hourlyPaid = roundCurrency(hourlyPaid);

  // Calculate totals for per-unit milestones
  const perUnitMilestones = milestones.filter(m => m.type === "per_unit");
  let totalUnits = 0;
  let unitAmount = 0;
  let unitPaid = 0;

  perUnitMilestones.forEach(m => {
    const entries = m.time_entries || [];
    const units = entries.reduce((sum, e) => sum + Number(e.units || 0), 0);
    totalUnits += units;
    // Use calculateAmount for proper rounding: units * unit_rate
    const amount = calculateAmount(Number(m.unit_rate || 0), units);
    unitAmount += amount;
    // Sum paid_amount from all entries
    unitPaid += sumCurrency(entries.map(e => Number(e.paid_amount || 0)));
  });

  // Round per-unit totals
  unitAmount = roundCurrency(unitAmount);
  unitPaid = roundCurrency(unitPaid);

  // Calculate total operating expenses
  const expenses = project.operating_expenses || [];
  const totalExpenses = sumCurrency(expenses.map(e => Number(e.amount || 0)));

  const totalAmount = roundCurrency(fixedTotal + hourlyAmount + unitAmount);
  const paidAmount = roundCurrency(fixedPaid + hourlyPaid + unitPaid);
  const paidMilestones = milestones.filter((m) => m.is_paid).length;

  return {
    totalAmount,
    paidAmount,
    remainingAmount: roundCurrency(totalAmount - paidAmount),
    paidMilestones,
    totalMilestones: milestones.length,
    percentPaid: calculatePercent(paidAmount, totalAmount),
    totalHours,
    hourlyAmount,
    totalUnits,
    unitAmount,
    totalExpenses,
  };
}

// Time Entry CRUD (used for both hourly and per_unit milestones)
export async function addTimeEntry(milestoneId: string, data: { date: string; hours?: number; units?: number; description?: string; paid_amount?: number }): Promise<TimeEntry | null> {
  const supabase = await createClient();

  const { data: entry, error } = await supabase
    .from("time_entries")
    .insert({
      milestone_id: milestoneId,
      date: data.date,
      hours: data.hours || null,
      units: data.units || null,
      description: data.description,
      paid_amount: data.paid_amount || 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating time entry:", error.code || "unknown");
    return null;
  }

  return entry;
}

export async function updateTimeEntry(entryId: string, data: Partial<{ date: string; hours: number; units: number; description: string; paid_amount: number }>): Promise<TimeEntry | null> {
  const supabase = await createClient();

  const { data: entry, error } = await supabase
    .from("time_entries")
    .update(data)
    .eq("id", entryId)
    .select()
    .single();

  if (error) return null;
  return entry;
}

export async function deleteTimeEntry(entryId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", entryId);

  return !error;
}

// Comment CRUD
export async function addComment(projectId: string, data: { content: string; milestone_id?: string }): Promise<Comment | null> {
  const supabase = await createClient();

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      project_id: projectId,
      milestone_id: data.milestone_id,
      content: data.content,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating comment:", error.code || "unknown");
    return null;
  }

  return comment;
}

export async function updateComment(commentId: string, content: string): Promise<Comment | null> {
  const supabase = await createClient();

  const { data: comment, error } = await supabase
    .from("comments")
    .update({ content })
    .eq("id", commentId)
    .select()
    .single();

  if (error) return null;
  return comment;
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  return !error;
}

// Attachment CRUD
export async function addAttachment(projectId: string, data: {
  label: string;
  url: string;
  type: "figma" | "github" | "demo" | "document" | "link";
  milestone_id?: string;
}): Promise<Attachment | null> {
  const supabase = await createClient();

  const { data: attachment, error } = await supabase
    .from("attachments")
    .insert({
      project_id: projectId,
      milestone_id: data.milestone_id,
      label: data.label,
      url: data.url,
      type: data.type,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating attachment:", error.code || "unknown");
    return null;
  }

  return attachment;
}

export async function deleteAttachment(attachmentId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("attachments")
    .delete()
    .eq("id", attachmentId);

  return !error;
}

// Project password protection
export async function setProjectPassword(projectId: string, passwordHash: string | null): Promise<boolean> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return false;

  // Verify project ownership before setting password
  const project = await verifyProjectOwnership(projectId, user);
  if (!project) return false;

  const { error } = await supabase
    .from("projects")
    .update({ public_password_hash: passwordHash })
    .eq("id", projectId);

  return !error;
}

export async function verifyProjectPassword(hash: string, password: string): Promise<boolean> {
  const supabase = await createClient();
  const bcrypt = await import("bcryptjs");

  const { data } = await supabase
    .from("projects")
    .select("public_password_hash")
    .eq("hash", hash)
    .single();

  if (!data || !data.public_password_hash) return true; // No password set

  // Use async compare instead of blocking compareSync
  return bcrypt.compare(password, data.public_password_hash);
}

// Payment History CRUD
export async function addPaymentHistoryEntry(milestoneId: string, data: { amount: number; note?: string }): Promise<PaymentHistoryEntry | null> {
  const supabase = await createClient();

  const { data: entry, error } = await supabase
    .from("payment_history")
    .insert({
      milestone_id: milestoneId,
      amount: data.amount,
      note: data.note,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating payment history entry:", error.code || "unknown");
    return null;
  }

  return entry;
}

export async function getPaymentHistory(milestoneId: string): Promise<PaymentHistoryEntry[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("payment_history")
    .select("*")
    .eq("milestone_id", milestoneId)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function deletePaymentHistoryEntry(entryId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("payment_history")
    .delete()
    .eq("id", entryId);

  return !error;
}

// Type for RPC response
interface AtomicPaymentResult {
  success: boolean;
  error?: string;
  entry_id?: string;
  paid_amount?: number;
  total_paid?: number;
  is_paid?: boolean;
  paid_at?: string | null;
}

/**
 * Records a payment atomically using database-level transaction
 * Uses RPC function with FOR UPDATE lock to prevent race conditions
 * @returns Updated milestone and payment entry, or null if failed
 */
export async function recordPaymentAtomically(
  milestoneId: string,
  data: { amount: number; note?: string },
  existingUser?: User | null
): Promise<{ milestone: Milestone; entry: PaymentHistoryEntry } | null> {
  const supabase = await createClient();
  const user = existingUser ?? await getCurrentUser();
  if (!user) return null;

  // 1. Verify ownership first
  const milestone = await verifyMilestoneOwnership(milestoneId, user);
  if (!milestone) return null;

  // 2. Validate amount
  if (typeof data.amount !== "number" || !Number.isFinite(data.amount) || data.amount === 0) {
    return null;
  }

  // 3. Call atomic RPC function
  const { data: result, error } = await supabase.rpc("record_payment_atomic", {
    p_milestone_id: milestoneId,
    p_amount: data.amount,
    p_note: data.note || null,
  }) as { data: AtomicPaymentResult | null; error: Error | null };

  if (error || !result?.success) {
    console.error("Atomic payment failed:", error?.message || result?.error);
    return null;
  }

  // 4. Return result
  const updatedMilestone: Milestone = {
    ...milestone,
    paid_amount: result.paid_amount ?? milestone.paid_amount,
    is_paid: result.is_paid ?? milestone.is_paid,
    paid_at: result.paid_at ?? milestone.paid_at,
  };

  return {
    milestone: updatedMilestone,
    entry: {
      id: result.entry_id!,
      milestone_id: milestoneId,
      amount: data.amount,
      note: data.note || undefined,
      created_at: new Date().toISOString(),
    } as PaymentHistoryEntry,
  };
}

/**
 * Deletes a payment entry and atomically recalculates milestone paid_amount
 * Uses RPC function with FOR UPDATE lock to prevent race conditions
 */
export async function deletePaymentAtomically(entryId: string, existingUser?: User | null): Promise<boolean> {
  const supabase = await createClient();
  const user = existingUser ?? await getCurrentUser();
  if (!user) return false;

  // Verify ownership through payment_history -> milestone -> project -> org chain
  const { data: entry } = await supabase
    .from("payment_history")
    .select("*, milestones!inner(project_id, projects!inner(organization_id, organizations!inner(user_id)))")
    .eq("id", entryId)
    .eq("milestones.projects.organizations.user_id", user.id)
    .single();

  if (!entry) return false;

  const { data: result, error } = await supabase.rpc("delete_payment_atomic", {
    p_entry_id: entryId,
  }) as { data: { success: boolean; error?: string } | null; error: Error | null };

  if (error || !result?.success) {
    console.error("Atomic payment deletion failed:", error?.message || result?.error);
    return false;
  }

  return true;
}

// Operating Expense CRUD
export async function addOperatingExpense(projectId: string, data: {
  name: string;
  amount: number;
  date: string;
  description?: string;
}): Promise<OperatingExpense | null> {
  const supabase = await createClient();

  const { data: expense, error } = await supabase
    .from("operating_expenses")
    .insert({
      project_id: projectId,
      name: data.name,
      amount: data.amount,
      date: data.date,
      description: data.description,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating operating expense:", error.code || "unknown");
    return null;
  }

  return expense;
}

export async function updateOperatingExpense(expenseId: string, data: Partial<{
  name: string;
  amount: number;
  date: string;
  description: string;
}>): Promise<OperatingExpense | null> {
  const supabase = await createClient();

  const { data: expense, error } = await supabase
    .from("operating_expenses")
    .update(data)
    .eq("id", expenseId)
    .select()
    .single();

  if (error) return null;
  return expense;
}

export async function deleteOperatingExpense(expenseId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("operating_expenses")
    .delete()
    .eq("id", expenseId);

  return !error;
}

/**
 * Verifies that the current user owns the operating expense through project->organization chain
 * Returns the expense if authorized, null otherwise
 */
export async function verifyOperatingExpenseOwnership(expenseId: string, existingUser?: User | null): Promise<OperatingExpense | null> {
  const supabase = await createClient();
  const user = existingUser ?? await getCurrentUser();
  if (!user) return null;

  const { data: expense } = await supabase
    .from("operating_expenses")
    .select("*, projects!inner(organization_id, organizations!inner(user_id))")
    .eq("id", expenseId)
    .eq("projects.organizations.user_id", user.id)
    .single();

  if (!expense) return null;

  return expense;
}

// ============================================
// Task Columns
// ============================================

const DEFAULT_COLUMNS = [
  { name: "To Do", position: 0, is_system: true, is_done_column: false },
  { name: "In Progress", position: 1, is_system: true, is_done_column: false },
  { name: "Done", position: 2, is_system: true, is_done_column: true },
];

export async function createDefaultTaskColumns(projectId: string): Promise<TaskColumn[]> {
  const supabase = await createClient();

  const columnsToInsert = DEFAULT_COLUMNS.map((col) => ({
    project_id: projectId,
    ...col,
  }));

  const { data, error } = await supabase
    .from("task_columns")
    .insert(columnsToInsert)
    .select();

  if (error) {
    console.error("Error creating default columns:", error.message);
    return [];
  }

  return data || [];
}

export async function getTaskColumns(projectId: string): Promise<TaskColumn[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("task_columns")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching task columns:", error.message);
    return [];
  }

  return data || [];
}

export async function addTaskColumn(projectId: string, data: { name: string }): Promise<TaskColumn | null> {
  const supabase = await createClient();

  // Get max position (excluding done column)
  const { data: existing } = await supabase
    .from("task_columns")
    .select("position")
    .eq("project_id", projectId)
    .eq("is_done_column", false)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  // Move done column to the right
  await supabase
    .from("task_columns")
    .update({ position: nextPosition + 1 })
    .eq("project_id", projectId)
    .eq("is_done_column", true);

  const { data: column, error } = await supabase
    .from("task_columns")
    .insert({
      project_id: projectId,
      name: data.name,
      position: nextPosition,
      is_system: false,
      is_done_column: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating task column:", error.message);
    return null;
  }

  return column;
}

export async function updateTaskColumn(columnId: string, data: { name?: string; position?: number }): Promise<TaskColumn | null> {
  const supabase = await createClient();

  const { data: column, error } = await supabase
    .from("task_columns")
    .update(data)
    .eq("id", columnId)
    .select()
    .single();

  if (error) {
    console.error("Error updating task column:", error.message);
    return null;
  }

  return column;
}

export async function deleteTaskColumn(columnId: string, projectId: string): Promise<boolean> {
  const supabase = await createClient();

  // Get first column (To Do) to move tasks to
  const { data: columns } = await supabase
    .from("task_columns")
    .select("id")
    .eq("project_id", projectId)
    .eq("is_system", true)
    .eq("is_done_column", false)
    .order("position", { ascending: true })
    .limit(1);

  if (!columns || columns.length === 0) {
    console.error("No default column found");
    return false;
  }

  const defaultColumnId = columns[0].id;

  // Move tasks to default column
  await supabase
    .from("tasks")
    .update({ column_id: defaultColumnId })
    .eq("column_id", columnId);

  // Delete the column
  const { error } = await supabase
    .from("task_columns")
    .delete()
    .eq("id", columnId)
    .eq("is_system", false); // Can't delete system columns

  if (error) {
    console.error("Error deleting task column:", error.message);
    return false;
  }

  return true;
}

export async function reorderTaskColumns(projectId: string, columnIds: string[]): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Update positions based on array order
    const updates = columnIds.map((id, index) =>
      supabase
        .from("task_columns")
        .update({ position: index })
        .eq("id", id)
        .eq("project_id", projectId)
    );

    const results = await Promise.all(updates);
    const hasError = results.some((r) => r.error);

    if (hasError) {
      console.error("Error reordering columns");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in reorderTaskColumns:", error);
    return false;
  }
}

export async function verifyTaskColumnOwnership(columnId: string, existingUser?: User | null): Promise<TaskColumn | null> {
  const supabase = await createClient();
  const user = existingUser ?? await getCurrentUser();
  if (!user) return null;

  const { data: column } = await supabase
    .from("task_columns")
    .select("*, projects!inner(organization_id, organizations!inner(user_id))")
    .eq("id", columnId)
    .eq("projects.organizations.user_id", user.id)
    .single();

  if (!column) return null;
  return column;
}

// ============================================
// Tasks
// ============================================

export async function getTaskBoardData(projectId: string, includeArchived = true): Promise<TaskBoardData> {
  const supabase = await createClient();

  // First fetch columns and tasks
  let tasksQuery = supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (!includeArchived) {
    tasksQuery = tasksQuery.eq("is_archived", false);
  }

  const [columnsResult, tasksResult] = await Promise.all([
    supabase
      .from("task_columns")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true }),
    tasksQuery,
  ]);

  const tasks = tasksResult.data || [];
  const taskIds = tasks.map(t => t.id);

  if (taskIds.length === 0) {
    return {
      columns: columnsResult.data || [],
      tasks: [],
    };
  }

  // Fetch checklists with items and attachments for all tasks
  const [checklistsResult, attachmentsResult] = await Promise.all([
    supabase
      .from("task_checklists")
      .select("*, items:task_checklist_items(*)")
      .in("task_id", taskIds)
      .order("position", { ascending: true }),
    supabase
      .from("task_attachments")
      .select("*")
      .in("task_id", taskIds)
      .order("created_at", { ascending: true }),
  ]);

  const checklists = checklistsResult.data || [];
  const attachments = attachmentsResult.data || [];

  // Merge checklists and attachments into tasks
  const tasksWithData = tasks.map(task => ({
    ...task,
    checklists: checklists
      .filter(c => c.task_id === task.id)
      .map(c => ({
        ...c,
        items: (c.items || []).sort((a: TaskChecklistItem, b: TaskChecklistItem) => (a.position ?? 0) - (b.position ?? 0)),
      })),
    attachments: attachments.filter(a => a.task_id === task.id),
  }));

  return {
    columns: columnsResult.data || [],
    tasks: tasksWithData,
  };
}

export async function getTasks(projectId: string, includeArchived = false): Promise<Task[]> {
  const supabase = await createClient();

  let query = supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching tasks:", error.message);
    return [];
  }

  return data || [];
}

export async function addTask(projectId: string, columnId: string, data: {
  title: string;
  description?: string;
  priority?: TaskPriority;
  deadline?: string;
  milestone_id?: string;
}): Promise<Task | null> {
  const supabase = await createClient();

  // Get max position in column
  const { data: existing } = await supabase
    .from("tasks")
    .select("position")
    .eq("column_id", columnId)
    .eq("is_archived", false)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      column_id: columnId,
      title: data.title,
      description: data.description || null,
      priority: data.priority || "medium",
      deadline: data.deadline || null,
      milestone_id: data.milestone_id || null,
      position: nextPosition,
      is_archived: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating task:", error.message);
    return null;
  }

  return task;
}

export async function updateTask(taskId: string, data: Partial<{
  title: string;
  description: string | null;
  priority: TaskPriority;
  deadline: string | null;
  milestone_id: string | null;
  column_id: string;
  position: number;
  is_archived: boolean;
}>): Promise<Task | null> {
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    console.error("Error updating task:", error.message);
    return null;
  }

  return task;
}

export async function moveTask(taskId: string, columnId: string, position: number): Promise<Task | null> {
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .update({
      column_id: columnId,
      position: position,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    console.error("Error moving task:", error.message);
    return null;
  }

  return task;
}

export async function deleteTask(taskId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    console.error("Error deleting task:", error.message);
    return false;
  }

  return true;
}

export async function archiveTask(taskId: string): Promise<Task | null> {
  return updateTask(taskId, { is_archived: true });
}

export async function restoreTask(taskId: string): Promise<Task | null> {
  return updateTask(taskId, { is_archived: false });
}

export async function verifyTaskOwnership(taskId: string, existingUser?: User | null): Promise<Task | null> {
  const supabase = await createClient();
  const user = existingUser ?? await getCurrentUser();
  if (!user) return null;

  const { data: task } = await supabase
    .from("tasks")
    .select("*, projects!inner(organization_id, organizations!inner(user_id))")
    .eq("id", taskId)
    .eq("projects.organizations.user_id", user.id)
    .single();

  if (!task) return null;
  return task;
}

export async function getUpcomingDeadlines(days = 7): Promise<Task[]> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];

  const future = new Date();
  future.setDate(future.getDate() + days);

  const { data, error } = await supabase
    .from("tasks")
    .select("*, projects!inner(name, organization_id, organizations!inner(user_id))")
    .eq("projects.organizations.user_id", user.id)
    .eq("is_archived", false)
    .not("deadline", "is", null)
    .lte("deadline", future.toISOString())
    .order("deadline", { ascending: true });

  if (error) {
    console.error("Error fetching upcoming deadlines:", error.message);
    return [];
  }

  return data || [];
}

// ============================================
// Task Checklists
// ============================================

export async function getTaskChecklists(taskId: string): Promise<TaskChecklist[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("task_checklists")
    .select("*, items:task_checklist_items(*)")
    .eq("task_id", taskId)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching task checklists:", error.message);
    return [];
  }

  // Sort items within each checklist
  return (data || []).map(checklist => ({
    ...checklist,
    items: (checklist.items || []).sort((a: TaskChecklistItem, b: TaskChecklistItem) => a.position - b.position),
  }));
}

export async function addTaskChecklist(taskId: string, name: string): Promise<TaskChecklist | null> {
  const supabase = await createClient();

  // Get max position
  const { data: existing } = await supabase
    .from("task_checklists")
    .select("position")
    .eq("task_id", taskId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data: checklist, error } = await supabase
    .from("task_checklists")
    .insert({
      task_id: taskId,
      name,
      position: nextPosition,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating task checklist:", error.message);
    return null;
  }

  return { ...checklist, items: [] };
}

export async function updateTaskChecklist(checklistId: string, data: { name?: string; position?: number }): Promise<TaskChecklist | null> {
  const supabase = await createClient();

  const { data: checklist, error } = await supabase
    .from("task_checklists")
    .update(data)
    .eq("id", checklistId)
    .select("*, items:task_checklist_items(*)")
    .single();

  if (error) {
    console.error("Error updating task checklist:", error.message);
    return null;
  }

  return checklist;
}

export async function deleteTaskChecklist(checklistId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("task_checklists")
    .delete()
    .eq("id", checklistId);

  if (error) {
    console.error("Error deleting task checklist:", error.message);
    return false;
  }

  return true;
}

export async function verifyChecklistOwnership(checklistId: string, existingUser?: User | null): Promise<TaskChecklist | null> {
  const supabase = await createClient();
  const user = existingUser ?? await getCurrentUser();
  if (!user) return null;

  const { data: checklist } = await supabase
    .from("task_checklists")
    .select("*, tasks!inner(project_id, projects!inner(organization_id, organizations!inner(user_id)))")
    .eq("id", checklistId)
    .eq("tasks.projects.organizations.user_id", user.id)
    .single();

  if (!checklist) return null;
  return checklist;
}

// ============================================
// Checklist Items
// ============================================

export async function addChecklistItem(checklistId: string, text: string): Promise<TaskChecklistItem | null> {
  const supabase = await createClient();

  // Get max position
  const { data: existing } = await supabase
    .from("task_checklist_items")
    .select("position")
    .eq("checklist_id", checklistId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data: item, error } = await supabase
    .from("task_checklist_items")
    .insert({
      checklist_id: checklistId,
      text,
      position: nextPosition,
      is_completed: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating checklist item:", error.message);
    return null;
  }

  return item;
}

export async function updateChecklistItem(itemId: string, data: { text?: string; is_completed?: boolean; position?: number }): Promise<TaskChecklistItem | null> {
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from("task_checklist_items")
    .update(data)
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    console.error("Error updating checklist item:", error.message);
    return null;
  }

  return item;
}

export async function deleteChecklistItem(itemId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("task_checklist_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("Error deleting checklist item:", error.message);
    return false;
  }

  return true;
}

export async function verifyChecklistItemOwnership(itemId: string, existingUser?: User | null): Promise<TaskChecklistItem | null> {
  const supabase = await createClient();
  const user = existingUser ?? await getCurrentUser();
  if (!user) return null;

  const { data: item } = await supabase
    .from("task_checklist_items")
    .select("*, task_checklists!inner(task_id, tasks!inner(project_id, projects!inner(organization_id, organizations!inner(user_id))))")
    .eq("id", itemId)
    .eq("task_checklists.tasks.projects.organizations.user_id", user.id)
    .single();

  if (!item) return null;
  return item;
}

// ============================================
// Task Attachments
// ============================================

export async function getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("task_attachments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching task attachments:", error.message);
    return [];
  }

  return data || [];
}

export async function addTaskAttachment(taskId: string, data: {
  type: TaskAttachmentType;
  name: string;
  url: string;
  file_size?: number;
  mime_type?: string;
}): Promise<TaskAttachment | null> {
  const supabase = await createClient();

  const { data: attachment, error } = await supabase
    .from("task_attachments")
    .insert({
      task_id: taskId,
      type: data.type,
      name: data.name,
      url: data.url,
      file_size: data.file_size || null,
      mime_type: data.mime_type || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating task attachment:", error.message);
    return null;
  }

  return attachment;
}

export async function deleteTaskAttachment(attachmentId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("task_attachments")
    .delete()
    .eq("id", attachmentId);

  if (error) {
    console.error("Error deleting task attachment:", error.message);
    return false;
  }

  return true;
}

export async function verifyTaskAttachmentOwnership(attachmentId: string, existingUser?: User | null): Promise<TaskAttachment | null> {
  const supabase = await createClient();
  const user = existingUser ?? await getCurrentUser();
  if (!user) return null;

  const { data: attachment } = await supabase
    .from("task_attachments")
    .select("*, tasks!inner(project_id, projects!inner(organization_id, organizations!inner(user_id)))")
    .eq("id", attachmentId)
    .eq("tasks.projects.organizations.user_id", user.id)
    .single();

  if (!attachment) return null;
  return attachment;
}
