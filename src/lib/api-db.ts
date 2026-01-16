import { SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import type { Organization, Project, Milestone, PaymentMethod, ProjectSummary, TimeEntry, Comment, Attachment, PaymentHistoryEntry } from "./types";

function generateHash(): string {
  return randomBytes(12).toString("base64url");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeProjectData(data: any, isPublic = false): Project & { has_password: boolean; has_secure_note: boolean } {
  const normalized = {
    ...data,
    status: data.status || "in_progress",
    hide_amounts: data.hide_amounts || false,
    hide_paid: data.hide_paid || false,
    show_payment_history: data.show_payment_history || false,
    // Add boolean flags for iOS compatibility
    has_password: !!data.public_password_hash,
    has_secure_note: !!data.secure_note_encrypted,
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
    normalized.public_password_hash = data.public_password_hash ? "protected" : null;
    normalized.secure_note_encrypted = data.secure_note_encrypted ? "exists" : null;
    normalized.secure_note_password_hash = undefined;
  }

  return normalized as Project & { has_password: boolean; has_secure_note: boolean };
}

type SupabaseClientType = SupabaseClient;

// ============== PROFILE ==============

export async function getProfile(supabase: SupabaseClientType, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export async function updateProfile(supabase: SupabaseClientType, userId: string, data: { name?: string; avatar_url?: string }) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", userId)
    .select()
    .single();
  if (error) return null;
  return profile;
}

// ============== ORGANIZATIONS ==============

export async function getOrganizations(supabase: SupabaseClientType, userId: string): Promise<Organization[]> {
  const { data } = await supabase
    .from("organizations")
    .select("*, payment_methods(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getOrganizationById(supabase: SupabaseClientType, userId: string, id: string): Promise<Organization | null> {
  const { data } = await supabase
    .from("organizations")
    .select("*, payment_methods(*)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  return data;
}

export async function createOrganization(supabase: SupabaseClientType, userId: string, data: { name: string; description?: string }): Promise<Organization | null> {
  const { data: org, error } = await supabase
    .from("organizations")
    .insert({
      user_id: userId,
      hash: generateHash(),
      name: data.name,
      description: data.description,
    })
    .select()
    .single();
  if (error) return null;
  return org;
}

export async function updateOrganization(supabase: SupabaseClientType, userId: string, id: string, data: Partial<Pick<Organization, "name" | "description">>): Promise<Organization | null> {
  const { data: org, error } = await supabase
    .from("organizations")
    .update(data)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) return null;
  return org;
}

export async function deleteOrganization(supabase: SupabaseClientType, userId: string, id: string): Promise<boolean> {
  const { error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}

// ============== PAYMENT METHODS ==============

export async function addPaymentMethod(supabase: SupabaseClientType, userId: string, orgId: string, data: Omit<PaymentMethod, "id" | "organization_id" | "created_at">): Promise<PaymentMethod | null> {
  // Verify org ownership
  const org = await getOrganizationById(supabase, userId, orgId);
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

export async function updatePaymentMethod(supabase: SupabaseClientType, userId: string, orgId: string, pmId: string, data: Partial<Omit<PaymentMethod, "id" | "organization_id" | "created_at">>): Promise<PaymentMethod | null> {
  const org = await getOrganizationById(supabase, userId, orgId);
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

export async function deletePaymentMethod(supabase: SupabaseClientType, userId: string, orgId: string, pmId: string): Promise<boolean> {
  const org = await getOrganizationById(supabase, userId, orgId);
  if (!org) return false;

  const { error } = await supabase
    .from("payment_methods")
    .delete()
    .eq("id", pmId)
    .eq("organization_id", orgId);
  return !error;
}

// ============== PROJECTS ==============

export async function getProjects(supabase: SupabaseClientType, userId: string): Promise<Project[]> {
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id")
    .eq("user_id", userId);

  if (!orgs || orgs.length === 0) return [];

  const orgIds = orgs.map(o => o.id);

  const { data } = await supabase
    .from("projects")
    .select("*, milestones(*, time_entries(*))")
    .in("organization_id", orgIds)
    .order("created_at", { ascending: false });

  return (data || []).map(p => normalizeProjectData(p));
}

export async function getProjectsByOrganization(supabase: SupabaseClientType, userId: string, orgId: string): Promise<Project[]> {
  const org = await getOrganizationById(supabase, userId, orgId);
  if (!org) return [];

  const { data } = await supabase
    .from("projects")
    .select("*, milestones(*, time_entries(*))")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  return (data || []).map(p => normalizeProjectData(p));
}

const PROJECT_SELECT_QUERY = "*, milestones(*, time_entries(*), payment_history(*)), comments(*), attachments(*)";

export async function getProjectById(supabase: SupabaseClientType, userId: string, id: string): Promise<Project | null> {
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_SELECT_QUERY + ", organizations!inner(user_id)")
    .eq("id", id)
    .eq("organizations.user_id", userId)
    .single();

  if (!data) return null;
  return normalizeProjectData(data);
}

export async function createProject(supabase: SupabaseClientType, userId: string, data: { organizationId: string; name: string; description?: string }): Promise<Project | null> {
  const org = await getOrganizationById(supabase, userId, data.organizationId);
  if (!org) return null;

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

  if (error) return null;
  return { ...project, milestones: [], comments: [], attachments: [], has_password: false, has_secure_note: false };
}

export async function updateProject(supabase: SupabaseClientType, userId: string, id: string, data: Partial<Pick<Project, "name" | "description" | "status" | "hide_amounts" | "hide_paid" | "show_payment_history" | "show_expenses">>): Promise<Project | null> {
  const { data: project } = await supabase
    .from("projects")
    .select("id, organizations!inner(user_id)")
    .eq("id", id)
    .eq("organizations.user_id", userId)
    .single();

  if (!project) return null;

  const { data: updated, error } = await supabase
    .from("projects")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) return null;
  return {
    ...updated,
    has_password: !!updated.public_password_hash,
    has_secure_note: !!updated.secure_note_encrypted,
  };
}

export async function deleteProject(supabase: SupabaseClientType, userId: string, id: string): Promise<boolean> {
  const { data: project } = await supabase
    .from("projects")
    .select("id, organizations!inner(user_id)")
    .eq("id", id)
    .eq("organizations.user_id", userId)
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
export async function transferProject(supabase: SupabaseClientType, userId: string, projectId: string, targetOrganizationId: string): Promise<Project | null> {
  // Verify project belongs to user's organization
  const { data: project } = await supabase
    .from("projects")
    .select("id, organization_id, organizations!inner(user_id)")
    .eq("id", projectId)
    .eq("organizations.user_id", userId)
    .single();

  if (!project) return null;

  // Verify target organization belongs to user
  const { data: targetOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", targetOrganizationId)
    .eq("user_id", userId)
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
  return {
    ...updated,
    has_password: !!updated.public_password_hash,
    has_secure_note: !!updated.secure_note_encrypted,
  };
}

// ============== MILESTONES ==============

export async function verifyProjectOwnership(supabase: SupabaseClientType, userId: string, projectId: string): Promise<Project | null> {
  const { data } = await supabase
    .from("projects")
    .select("*, organizations!inner(user_id)")
    .eq("id", projectId)
    .eq("organizations.user_id", userId)
    .single();
  return data;
}

export async function addMilestone(supabase: SupabaseClientType, userId: string, projectId: string, data: {
  title: string;
  description?: string;
  type?: "fixed" | "hourly" | "per_unit";
  amount?: number;
  hourly_rate?: number;
  estimated_hours?: number;
  hours_limit?: number;
  unit_rate?: number;
  unit_label?: string;
  estimated_units?: number;
  units_limit?: number;
}): Promise<Milestone | null> {
  const project = await verifyProjectOwnership(supabase, userId, projectId);
  if (!project) return null;

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
    insertData.hourly_rate = data.hourly_rate || 0;
    insertData.estimated_hours = data.estimated_hours;
    insertData.hours_limit = data.hours_limit;
    insertData.amount = 0;
    insertData.paid_amount = 0;
    insertData.is_paid = false;
  } else {
    // per_unit
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

  if (error) return null;
  return { ...milestone, time_entries: [], payment_history: [] };
}

export async function getMilestoneById(supabase: SupabaseClientType, userId: string, milestoneId: string): Promise<Milestone | null> {
  const { data } = await supabase
    .from("milestones")
    .select("*, time_entries(*), payment_history(*), projects!inner(organization_id, organizations!inner(user_id))")
    .eq("id", milestoneId)
    .eq("projects.organizations.user_id", userId)
    .single();
  return data;
}

export async function updateMilestone(supabase: SupabaseClientType, userId: string, milestoneId: string, data: Partial<Omit<Milestone, "id" | "project_id" | "created_at">>): Promise<Milestone | null> {
  const milestone = await getMilestoneById(supabase, userId, milestoneId);
  if (!milestone) return null;

  const { data: updated, error } = await supabase
    .from("milestones")
    .update(data)
    .eq("id", milestoneId)
    .select()
    .single();

  if (error) return null;
  return updated;
}

export async function updateMilestonePaidAmount(supabase: SupabaseClientType, userId: string, milestoneId: string, paidAmount: number): Promise<Milestone | null> {
  const milestone = await getMilestoneById(supabase, userId, milestoneId);
  if (!milestone) return null;

  const clampedPaidAmount = Math.min(Math.max(0, paidAmount), Number(milestone.amount));
  const isPaid = clampedPaidAmount >= Number(milestone.amount);

  const { data: updated, error } = await supabase
    .from("milestones")
    .update({
      paid_amount: clampedPaidAmount,
      is_paid: isPaid,
      paid_at: isPaid ? new Date().toISOString() : null,
    })
    .eq("id", milestoneId)
    .select()
    .single();

  if (error) return null;
  return updated;
}

export async function deleteMilestone(supabase: SupabaseClientType, userId: string, milestoneId: string): Promise<boolean> {
  const milestone = await getMilestoneById(supabase, userId, milestoneId);
  if (!milestone) return false;

  const { error } = await supabase
    .from("milestones")
    .delete()
    .eq("id", milestoneId);

  return !error;
}

// ============== TIME ENTRIES ==============

export async function addTimeEntry(supabase: SupabaseClientType, userId: string, milestoneId: string, data: { date: string; hours?: number; units?: number; description?: string; paid_amount?: number }): Promise<TimeEntry | null> {
  const milestone = await getMilestoneById(supabase, userId, milestoneId);
  if (!milestone) return null;

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

  if (error) return null;
  return entry;
}

export async function getTimeEntryById(supabase: SupabaseClientType, userId: string, entryId: string): Promise<TimeEntry | null> {
  const { data } = await supabase
    .from("time_entries")
    .select("*, milestones!inner(project_id, projects!inner(organization_id, organizations!inner(user_id)))")
    .eq("id", entryId)
    .eq("milestones.projects.organizations.user_id", userId)
    .single();
  return data;
}

export async function updateTimeEntry(supabase: SupabaseClientType, userId: string, entryId: string, data: Partial<{ date: string; hours: number; units: number; description: string; paid_amount: number }>): Promise<TimeEntry | null> {
  const entry = await getTimeEntryById(supabase, userId, entryId);
  if (!entry) return null;

  const { data: updated, error } = await supabase
    .from("time_entries")
    .update(data)
    .eq("id", entryId)
    .select()
    .single();

  if (error) return null;
  return updated;
}

export async function deleteTimeEntry(supabase: SupabaseClientType, userId: string, entryId: string): Promise<boolean> {
  const entry = await getTimeEntryById(supabase, userId, entryId);
  if (!entry) return false;

  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", entryId);

  return !error;
}

// ============== COMMENTS ==============

export async function addComment(supabase: SupabaseClientType, userId: string, projectId: string, data: { content: string; milestone_id?: string }): Promise<Comment | null> {
  const project = await verifyProjectOwnership(supabase, userId, projectId);
  if (!project) return null;

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      project_id: projectId,
      milestone_id: data.milestone_id,
      content: data.content,
    })
    .select()
    .single();

  if (error) return null;
  return comment;
}

export async function getCommentById(supabase: SupabaseClientType, userId: string, commentId: string): Promise<Comment | null> {
  const { data } = await supabase
    .from("comments")
    .select("*, projects!inner(organization_id, organizations!inner(user_id))")
    .eq("id", commentId)
    .eq("projects.organizations.user_id", userId)
    .single();
  return data;
}

export async function updateComment(supabase: SupabaseClientType, userId: string, commentId: string, content: string): Promise<Comment | null> {
  const comment = await getCommentById(supabase, userId, commentId);
  if (!comment) return null;

  const { data: updated, error } = await supabase
    .from("comments")
    .update({ content })
    .eq("id", commentId)
    .select()
    .single();

  if (error) return null;
  return updated;
}

export async function deleteComment(supabase: SupabaseClientType, userId: string, commentId: string): Promise<boolean> {
  const comment = await getCommentById(supabase, userId, commentId);
  if (!comment) return false;

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  return !error;
}

// ============== ATTACHMENTS ==============

export async function addAttachment(supabase: SupabaseClientType, userId: string, projectId: string, data: {
  label: string;
  url: string;
  type: "figma" | "github" | "demo" | "document" | "link";
  milestone_id?: string;
}): Promise<Attachment | null> {
  const project = await verifyProjectOwnership(supabase, userId, projectId);
  if (!project) return null;

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

  if (error) return null;
  return attachment;
}

export async function getAttachmentById(supabase: SupabaseClientType, userId: string, attachmentId: string): Promise<Attachment | null> {
  const { data } = await supabase
    .from("attachments")
    .select("*, projects!inner(organization_id, organizations!inner(user_id))")
    .eq("id", attachmentId)
    .eq("projects.organizations.user_id", userId)
    .single();
  return data;
}

export async function deleteAttachment(supabase: SupabaseClientType, userId: string, attachmentId: string): Promise<boolean> {
  const attachment = await getAttachmentById(supabase, userId, attachmentId);
  if (!attachment) return false;

  const { error } = await supabase
    .from("attachments")
    .delete()
    .eq("id", attachmentId);

  return !error;
}

// ============== SECURE NOTES ==============

export async function setSecureNote(supabase: SupabaseClientType, userId: string, projectId: string, encryptedNote: string, passwordHash: string): Promise<boolean> {
  const project = await verifyProjectOwnership(supabase, userId, projectId);
  if (!project) return false;

  const { error } = await supabase
    .from("projects")
    .update({
      secure_note_encrypted: encryptedNote,
      secure_note_password_hash: passwordHash,
    })
    .eq("id", projectId);

  return !error;
}

export async function deleteSecureNote(supabase: SupabaseClientType, userId: string, projectId: string): Promise<boolean> {
  const project = await verifyProjectOwnership(supabase, userId, projectId);
  if (!project) return false;

  const { error } = await supabase
    .from("projects")
    .update({
      secure_note_encrypted: null,
      secure_note_password_hash: null,
    })
    .eq("id", projectId);

  return !error;
}

// ============== PROJECT PASSWORD ==============

export async function setProjectPassword(supabase: SupabaseClientType, userId: string, projectId: string, passwordHash: string | null): Promise<boolean> {
  const project = await verifyProjectOwnership(supabase, userId, projectId);
  if (!project) return false;

  const { error } = await supabase
    .from("projects")
    .update({ public_password_hash: passwordHash })
    .eq("id", projectId);

  return !error;
}

// ============== PAYMENT HISTORY ==============

export async function addPaymentHistoryEntry(supabase: SupabaseClientType, userId: string, milestoneId: string, data: { amount: number; note?: string }): Promise<PaymentHistoryEntry | null> {
  const milestone = await getMilestoneById(supabase, userId, milestoneId);
  if (!milestone) return null;

  const { data: entry, error } = await supabase
    .from("payment_history")
    .insert({
      milestone_id: milestoneId,
      amount: data.amount,
      note: data.note,
    })
    .select()
    .single();

  if (error) return null;
  return entry;
}

export async function getPaymentHistory(supabase: SupabaseClientType, userId: string, milestoneId: string): Promise<PaymentHistoryEntry[]> {
  const milestone = await getMilestoneById(supabase, userId, milestoneId);
  if (!milestone) return [];

  const { data } = await supabase
    .from("payment_history")
    .select("*")
    .eq("milestone_id", milestoneId)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function deletePaymentHistoryEntry(supabase: SupabaseClientType, userId: string, entryId: string): Promise<boolean> {
  const { data: entry } = await supabase
    .from("payment_history")
    .select("*, milestones!inner(project_id, projects!inner(organization_id, organizations!inner(user_id)))")
    .eq("id", entryId)
    .eq("milestones.projects.organizations.user_id", userId)
    .single();

  if (!entry) return false;

  const { error } = await supabase
    .from("payment_history")
    .delete()
    .eq("id", entryId);

  return !error;
}

// ============== DASHBOARD ==============

export async function getDashboardStats(supabase: SupabaseClientType, userId: string) {
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id")
    .eq("user_id", userId);

  if (!orgs || orgs.length === 0) {
    return {
      totalOrganizations: 0,
      totalProjects: 0,
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      percentPaid: 0,
      totalHours: 0,
      hourlyAmount: 0,
      totalUnits: 0,
      unitAmount: 0,
      projectsByStatus: {
        in_progress: 0,
        awaiting_payment: 0,
        completed: 0,
        on_hold: 0,
      },
    };
  }

  const orgIds = orgs.map(o => o.id);

  const { data: projects } = await supabase
    .from("projects")
    .select("*, milestones(*, time_entries(*))")
    .in("organization_id", orgIds);

  if (!projects) {
    return {
      totalOrganizations: orgs.length,
      totalProjects: 0,
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      percentPaid: 0,
      totalHours: 0,
      hourlyAmount: 0,
      totalUnits: 0,
      unitAmount: 0,
      projectsByStatus: {
        in_progress: 0,
        awaiting_payment: 0,
        completed: 0,
        on_hold: 0,
      },
    };
  }

  let totalAmount = 0;
  let paidAmount = 0;
  let totalHours = 0;
  let hourlyAmount = 0;
  let totalUnits = 0;
  let unitAmount = 0;

  const projectsByStatus = {
    in_progress: 0,
    awaiting_payment: 0,
    completed: 0,
    on_hold: 0,
  };

  projects.forEach(project => {
    const status = project.status || "in_progress";
    projectsByStatus[status as keyof typeof projectsByStatus]++;

    const milestones = project.milestones || [];
    milestones.forEach((m: Milestone) => {
      if (m.type === "hourly") {
        const entries = (m.time_entries || []) as TimeEntry[];
        const hours = entries.reduce((sum, e) => sum + Number(e.hours || 0), 0);
        totalHours += hours;
        const amount = hours * Number(m.hourly_rate || 0);
        hourlyAmount += amount;
        totalAmount += amount;
        paidAmount += entries.reduce((sum, e) => sum + Number(e.paid_amount || 0), 0);
      } else if (m.type === "per_unit") {
        const entries = (m.time_entries || []) as TimeEntry[];
        const units = entries.reduce((sum, e) => sum + Number(e.units || 0), 0);
        totalUnits += units;
        const amount = units * Number(m.unit_rate || 0);
        unitAmount += amount;
        totalAmount += amount;
        paidAmount += entries.reduce((sum, e) => sum + Number(e.paid_amount || 0), 0);
      } else {
        totalAmount += Number(m.amount || 0);
        paidAmount += Number(m.paid_amount || 0);
      }
    });
  });

  return {
    totalOrganizations: orgs.length,
    totalProjects: projects.length,
    totalAmount,
    paidAmount,
    remainingAmount: totalAmount - paidAmount,
    percentPaid: totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0,
    totalHours,
    hourlyAmount,
    totalUnits,
    unitAmount,
    projectsByStatus,
  };
}

// Re-export helper
export function getProjectSummary(project: Project): ProjectSummary {
  const milestones = project.milestones || [];

  const fixedMilestones = milestones.filter(m => m.type === "fixed" || !m.type);
  const fixedTotal = fixedMilestones.reduce((sum, m) => sum + Number(m.amount), 0);
  const fixedPaid = fixedMilestones.reduce((sum, m) => sum + Number(m.paid_amount || 0), 0);

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
    unitPaid += entries.reduce((sum, e) => sum + Number(e.paid_amount || 0), 0);
  });

  // Calculate total operating expenses
  const expenses = project.operating_expenses || [];
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalAmount = fixedTotal + hourlyAmount + unitAmount;
  const paidAmountTotal = fixedPaid + hourlyPaid + unitPaid;
  const paidMilestones = milestones.filter((m) => m.is_paid).length;

  return {
    totalAmount,
    paidAmount: paidAmountTotal,
    remainingAmount: totalAmount - paidAmountTotal,
    paidMilestones,
    totalMilestones: milestones.length,
    percentPaid: totalAmount > 0 ? Math.round((paidAmountTotal / totalAmount) * 100) : 0,
    totalHours,
    hourlyAmount,
    totalUnits,
    unitAmount,
    totalExpenses,
  };
}
