import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import type { User } from "@supabase/supabase-js";
import type { Organization, Project, Milestone, PaymentMethod, ProjectSummary, TimeEntry, Comment, Attachment, PaymentHistoryEntry } from "./types";

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

// Helper to normalize project data from DB
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeProjectData(data: any, isPublic = false): Project {
  const normalized = {
    ...data,
    status: data.status || "in_progress",
    hide_amounts: data.hide_amounts || false,
    hide_paid: data.hide_paid || false,
    show_payment_history: data.show_payment_history || false,
    milestones: ((data.milestones as Milestone[]) || [])
      .sort((a: Milestone, b: Milestone) => a.order - b.order)
      .map((m: Milestone & { time_entries?: TimeEntry[]; payment_history?: PaymentHistoryEntry[] }) => ({
        ...m,
        type: m.type || "fixed",
        time_entries: (m.time_entries || []).sort((a: TimeEntry, b: TimeEntry) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
        payment_history: (m.payment_history || []).sort((a: PaymentHistoryEntry, b: PaymentHistoryEntry) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      })),
    comments: ((data.comments as Comment[]) || []).sort((a: Comment, b: Comment) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    attachments: data.attachments || []
  };

  if (isPublic) {
    // Only indicate if public password is set, don't expose hash
    normalized.public_password_hash = data.public_password_hash ? "protected" : null;
    // Only indicate if note exists, don't expose encrypted data or hash
    normalized.secure_note_encrypted = data.secure_note_encrypted ? "exists" : null;
    normalized.secure_note_password_hash = undefined;
  }

  return normalized as Project;
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

  const { data } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("organization_id", orgId);

  return data || [];
}

export async function addPaymentMethod(orgId: string, data: Omit<PaymentMethod, "id" | "organization_id" | "created_at">): Promise<PaymentMethod | null> {
  const supabase = await createClient();

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

const PROJECT_SELECT_QUERY = "*, milestones(*, time_entries(*), payment_history(*)), comments(*), attachments(*)";

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

  return normalizeProjectData(data, true); // isPublic = true
}

export async function createProject(data: { organizationId: string; name: string; description?: string }): Promise<Project | null> {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      organization_id: data.organizationId,
      hash: generateHash(),
      name: data.name,
      description: data.description,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating project:", error.code || "unknown");
    return null;
  }

  return { ...project, milestones: [] };
}

export async function updateProject(id: string, data: Partial<Pick<Project, "name" | "description" | "status" | "hide_amounts" | "hide_paid" | "show_payment_history">>): Promise<Project | null> {
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

  // Get current milestone to check amount
  const { data: current } = await supabase
    .from("milestones")
    .select("amount")
    .eq("id", milestoneId)
    .single();

  if (!current) return null;

  const clampedPaidAmount = Math.min(Math.max(0, paidAmount), current.amount);
  const isPaid = clampedPaidAmount >= current.amount;

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

  const { error } = await supabase
    .from("milestones")
    .delete()
    .eq("id", milestoneId)
    .eq("project_id", projectId);

  return !error;
}

// Summary calculations
export function getProjectSummary(project: Project): ProjectSummary {
  const milestones = project.milestones || [];

  // Calculate totals for fixed milestones
  const fixedMilestones = milestones.filter(m => m.type === "fixed" || !m.type);
  const fixedTotal = fixedMilestones.reduce((sum, m) => sum + Number(m.amount), 0);
  const fixedPaid = fixedMilestones.reduce((sum, m) => sum + Number(m.paid_amount || 0), 0);

  // Calculate totals for hourly milestones
  const hourlyMilestones = milestones.filter(m => m.type === "hourly");
  let totalHours = 0;
  let hourlyAmount = 0;
  let hourlyPaid = 0;

  hourlyMilestones.forEach(m => {
    const entries = m.time_entries || [];
    const hours = entries.reduce((sum, e) => sum + Number(e.hours || 0), 0);
    totalHours += hours;
    const amount = hours * Number(m.hourly_rate || 0);
    hourlyAmount += amount;
    // Sum paid_amount from all time entries
    hourlyPaid += entries.reduce((sum, e) => sum + Number(e.paid_amount || 0), 0);
  });

  // Calculate totals for per-unit milestones
  const perUnitMilestones = milestones.filter(m => m.type === "per_unit");
  let totalUnits = 0;
  let unitAmount = 0;
  let unitPaid = 0;

  perUnitMilestones.forEach(m => {
    const entries = m.time_entries || [];
    const units = entries.reduce((sum, e) => sum + Number(e.units || 0), 0);
    totalUnits += units;
    const amount = units * Number(m.unit_rate || 0);
    unitAmount += amount;
    // Sum paid_amount from all entries
    unitPaid += entries.reduce((sum, e) => sum + Number(e.paid_amount || 0), 0);
  });

  const totalAmount = fixedTotal + hourlyAmount + unitAmount;
  const paidAmount = fixedPaid + hourlyPaid + unitPaid;
  const paidMilestones = milestones.filter((m) => m.is_paid).length;

  return {
    totalAmount,
    paidAmount,
    remainingAmount: totalAmount - paidAmount,
    paidMilestones,
    totalMilestones: milestones.length,
    percentPaid: totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0,
    totalHours,
    hourlyAmount,
    totalUnits,
    unitAmount,
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

  return bcrypt.compareSync(password, data.public_password_hash);
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
