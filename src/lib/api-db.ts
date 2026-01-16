import { SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import type { Organization, Project, Milestone, PaymentMethod, ProjectSummary, TimeEntry, Comment, Attachment, PaymentHistoryEntry, PaginationParams, PaginatedResult } from "./types";
import { normalizeProjectData } from "./db/normalize";

// Error logging helper for database operations
function logDbError(operation: string, error: { message: string; code?: string } | null): void {
  if (error) {
    console.error(`[DB] ${operation} failed:`, error.message, error.code ? `(code: ${error.code})` : "");
  }
}

function generateHash(): string {
  return randomBytes(12).toString("base64url");
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
  if (error) {
    logDbError("updateProfile", error);
    return null;
  }
  return profile;
}

// ============== ORGANIZATIONS ==============

export async function getOrganizations(supabase: SupabaseClientType, userId: string): Promise<Organization[]> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*, payment_methods(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    logDbError("getOrganizations", error);
  }
  return data || [];
}

export async function getOrganizationById(supabase: SupabaseClientType, userId: string, id: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*, payment_methods(*)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned (not found)
    logDbError("getOrganizationById", error);
  }
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
  if (error) {
    logDbError("createOrganization", error);
    return null;
  }
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
  if (error) {
    logDbError("updateOrganization", error);
    return null;
  }
  return org;
}

export async function deleteOrganization(supabase: SupabaseClientType, userId: string, id: string): Promise<boolean> {
  const { error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    logDbError("deleteOrganization", error);
    return false;
  }
  return true;
}

// ============== PAYMENT METHODS ==============

export async function addPaymentMethod(supabase: SupabaseClientType, userId: string, orgId: string, data: Omit<PaymentMethod, "id" | "organization_id" | "created_at">): Promise<PaymentMethod | null> {
  // Verify org ownership
  const org = await getOrganizationById(supabase, userId, orgId);
  if (!org) return null; // Not found - intentionally silent

  const { data: pm, error } = await supabase
    .from("payment_methods")
    .insert({
      organization_id: orgId,
      ...data,
    })
    .select()
    .single();
  if (error) {
    logDbError("addPaymentMethod", error);
    return null;
  }
  return pm;
}

export async function updatePaymentMethod(supabase: SupabaseClientType, userId: string, orgId: string, pmId: string, data: Partial<Omit<PaymentMethod, "id" | "organization_id" | "created_at">>): Promise<PaymentMethod | null> {
  const org = await getOrganizationById(supabase, userId, orgId);
  if (!org) return null; // Not found - intentionally silent

  const { data: pm, error } = await supabase
    .from("payment_methods")
    .update(data)
    .eq("id", pmId)
    .eq("organization_id", orgId)
    .select()
    .single();
  if (error) {
    logDbError("updatePaymentMethod", error);
    return null;
  }
  return pm;
}

export async function deletePaymentMethod(supabase: SupabaseClientType, userId: string, orgId: string, pmId: string): Promise<boolean> {
  const org = await getOrganizationById(supabase, userId, orgId);
  if (!org) return false; // Not found - intentionally silent

  const { error } = await supabase
    .from("payment_methods")
    .delete()
    .eq("id", pmId)
    .eq("organization_id", orgId);
  if (error) {
    logDbError("deletePaymentMethod", error);
    return false;
  }
  return true;
}

// ============== PROJECTS ==============

const DEFAULT_PAGE_LIMIT = 50;

/**
 * Get all projects (legacy - no pagination)
 * @deprecated Use getProjectsPaginated for better performance
 */
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

/**
 * Get projects with pagination support
 */
export async function getProjectsPaginated(
  supabase: SupabaseClientType,
  userId: string,
  pagination: PaginationParams = {}
): Promise<PaginatedResult<Project>> {
  const { limit = DEFAULT_PAGE_LIMIT, offset = 0 } = pagination;

  // Get user's organization IDs
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id")
    .eq("user_id", userId);

  if (!orgs || orgs.length === 0) {
    return { data: [], total: 0, limit, offset, hasMore: false };
  }

  const orgIds = orgs.map(o => o.id);

  // Get total count
  const { count } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .in("organization_id", orgIds);

  // Get paginated data
  const { data } = await supabase
    .from("projects")
    .select("*, milestones(*, time_entries(*))")
    .in("organization_id", orgIds)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const total = count || 0;
  return {
    data: (data || []).map(p => normalizeProjectData(p)),
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
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

const PROJECT_SELECT_QUERY = `*, milestones(*, time_entries(*), payment_history(*)), comments(*), attachments(*)`;

export async function getProjectById(supabase: SupabaseClientType, userId: string, id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT_QUERY + ", organizations!inner(user_id)")
    .eq("id", id)
    .eq("organizations.user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    logDbError("getProjectById", error);
  }
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

  if (error) {
    logDbError("createProject", error);
    return null;
  }
  return { ...project, milestones: [], comments: [], attachments: [], has_password: false, has_secure_note: false };
}

export async function updateProject(supabase: SupabaseClientType, userId: string, id: string, data: Partial<Pick<Project, "name" | "description" | "status" | "hide_amounts" | "hide_paid" | "show_payment_history" | "show_expenses">>): Promise<Project | null> {
  const { data: project } = await supabase
    .from("projects")
    .select("id, organizations!inner(user_id)")
    .eq("id", id)
    .eq("organizations.user_id", userId)
    .single();

  if (!project) return null; // Not found or unauthorized - intentionally silent

  const { data: updated, error } = await supabase
    .from("projects")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    logDbError("updateProject", error);
    return null;
  }
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

  if (!project) return false; // Not found or unauthorized - intentionally silent

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) {
    logDbError("deleteProject", error);
    return false;
  }
  return true;
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

  if (error) {
    logDbError("transferProject", error);
    return null;
  }
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

  if (error) {
    logDbError("addMilestone", error);
    return null;
  }
  return { ...milestone, time_entries: [], payment_history: [] };
}

export async function getMilestoneById(supabase: SupabaseClientType, userId: string, milestoneId: string): Promise<Milestone | null> {
  const { data, error } = await supabase
    .from("milestones")
    .select("*, time_entries(*), payment_history(*), projects!inner(organization_id, organizations!inner(user_id))")
    .eq("id", milestoneId)
    .eq("projects.organizations.user_id", userId)
    .single();
  if (error && error.code !== "PGRST116") {
    logDbError("getMilestoneById", error);
  }
  return data;
}

export async function updateMilestone(supabase: SupabaseClientType, userId: string, milestoneId: string, data: Partial<Omit<Milestone, "id" | "project_id" | "created_at">>): Promise<Milestone | null> {
  const milestone = await getMilestoneById(supabase, userId, milestoneId);
  if (!milestone) return null; // Not found or unauthorized - intentionally silent

  const { data: updated, error } = await supabase
    .from("milestones")
    .update(data)
    .eq("id", milestoneId)
    .select()
    .single();

  if (error) {
    logDbError("updateMilestone", error);
    return null;
  }
  return updated;
}

export async function updateMilestonePaidAmount(supabase: SupabaseClientType, userId: string, milestoneId: string, paidAmount: number): Promise<Milestone | null> {
  const milestone = await getMilestoneById(supabase, userId, milestoneId);
  if (!milestone) return null;

  // Calculate total based on milestone type
  let total: number;
  if (milestone.type === "hourly") {
    const entries = milestone.time_entries || [];
    const hours = entries.reduce((sum: number, e) => sum + Number(e.hours || 0), 0);
    total = hours * Number(milestone.hourly_rate || 0);
  } else if (milestone.type === "per_unit") {
    const entries = milestone.time_entries || [];
    const units = entries.reduce((sum: number, e) => sum + Number(e.units || 0), 0);
    total = units * Number(milestone.unit_rate || 0);
  } else {
    // Fixed milestone
    total = Number(milestone.amount || 0);
  }

  // Clamp to valid range (0 to total)
  const clampedPaidAmount = Math.max(0, total > 0 ? Math.min(paidAmount, total) : paidAmount);
  const isPaid = total > 0 && clampedPaidAmount >= total;

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

  if (error) {
    logDbError("updateMilestonePaidAmount", error);
    return null;
  }
  return updated;
}

export async function deleteMilestone(supabase: SupabaseClientType, userId: string, milestoneId: string): Promise<boolean> {
  const milestone = await getMilestoneById(supabase, userId, milestoneId);
  if (!milestone) return false; // Not found or unauthorized - intentionally silent

  const { error } = await supabase
    .from("milestones")
    .delete()
    .eq("id", milestoneId);

  if (error) {
    logDbError("deleteMilestone", error);
    return false;
  }
  return true;
}

// ============== TIME ENTRIES ==============

export async function addTimeEntry(supabase: SupabaseClientType, userId: string, milestoneId: string, data: { date: string; hours?: number; units?: number; description?: string; paid_amount?: number }): Promise<TimeEntry | null> {
  const milestone = await getMilestoneById(supabase, userId, milestoneId);
  if (!milestone) return null; // Not found or unauthorized - intentionally silent

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
    logDbError("addTimeEntry", error);
    return null;
  }
  return entry;
}

export async function getTimeEntryById(supabase: SupabaseClientType, userId: string, entryId: string): Promise<TimeEntry | null> {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*, milestones!inner(project_id, projects!inner(organization_id, organizations!inner(user_id)))")
    .eq("id", entryId)
    .eq("milestones.projects.organizations.user_id", userId)
    .single();
  if (error && error.code !== "PGRST116") {
    logDbError("getTimeEntryById", error);
  }
  return data;
}

export async function updateTimeEntry(supabase: SupabaseClientType, userId: string, entryId: string, data: Partial<{ date: string; hours: number; units: number; description: string; paid_amount: number }>): Promise<TimeEntry | null> {
  const entry = await getTimeEntryById(supabase, userId, entryId);
  if (!entry) return null; // Not found or unauthorized - intentionally silent

  const { data: updated, error } = await supabase
    .from("time_entries")
    .update(data)
    .eq("id", entryId)
    .select()
    .single();

  if (error) {
    logDbError("updateTimeEntry", error);
    return null;
  }
  return updated;
}

/**
 * Updates a time entry atomically with limit validation
 * Uses RPC function with FOR UPDATE lock to prevent race conditions on hours/units limits
 * @returns Object with success status, updated entry or error details
 */
export async function updateTimeEntryAtomic(
  supabase: SupabaseClientType,
  userId: string,
  entryId: string,
  data: Partial<{ date: string; hours: number; units: number; description: string; paid_amount: number }>
): Promise<{ success: true; entry: TimeEntry } | { success: false; error: string; remaining?: number; limit?: number } | null> {
  // 1. Verify ownership first
  const entry = await getTimeEntryById(supabase, userId, entryId);
  if (!entry) return null; // Not found or unauthorized

  // 2. Call atomic RPC function
  const { data: result, error } = await supabase.rpc("update_time_entry_atomic", {
    p_entry_id: entryId,
    p_date: data.date || null,
    p_hours: data.hours || null,
    p_units: data.units || null,
    p_description: data.description !== undefined ? data.description : null,
    p_paid_amount: data.paid_amount !== undefined ? data.paid_amount : null,
  });

  if (error) {
    console.error("Atomic time entry update failed:", error.message);
    return { success: false, error: "Failed to update time entry" };
  }

  if (!result?.success) {
    return {
      success: false,
      error: result?.error || "Update failed",
      remaining: result?.remaining,
      limit: result?.limit,
    };
  }

  // 3. Fetch updated entry to return full data
  const updated = await getTimeEntryById(supabase, userId, entryId);
  if (!updated) {
    return { success: false, error: "Failed to fetch updated entry" };
  }

  return { success: true, entry: updated };
}

export async function deleteTimeEntry(supabase: SupabaseClientType, userId: string, entryId: string): Promise<boolean> {
  const entry = await getTimeEntryById(supabase, userId, entryId);
  if (!entry) return false; // Not found or unauthorized - intentionally silent

  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", entryId);

  if (error) {
    logDbError("deleteTimeEntry", error);
    return false;
  }
  return true;
}

// ============== COMMENTS ==============

export async function addComment(supabase: SupabaseClientType, userId: string, projectId: string, data: { content: string; milestone_id?: string }): Promise<Comment | null> {
  const project = await verifyProjectOwnership(supabase, userId, projectId);
  if (!project) return null; // Not found or unauthorized - intentionally silent

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
    logDbError("addComment", error);
    return null;
  }
  return comment;
}

export async function getCommentById(supabase: SupabaseClientType, userId: string, commentId: string): Promise<Comment | null> {
  const { data, error } = await supabase
    .from("comments")
    .select("*, projects!inner(organization_id, organizations!inner(user_id))")
    .eq("id", commentId)
    .eq("projects.organizations.user_id", userId)
    .single();
  if (error && error.code !== "PGRST116") {
    logDbError("getCommentById", error);
  }
  return data;
}

export async function updateComment(supabase: SupabaseClientType, userId: string, commentId: string, content: string): Promise<Comment | null> {
  const comment = await getCommentById(supabase, userId, commentId);
  if (!comment) return null; // Not found or unauthorized - intentionally silent

  const { data: updated, error } = await supabase
    .from("comments")
    .update({ content })
    .eq("id", commentId)
    .select()
    .single();

  if (error) {
    logDbError("updateComment", error);
    return null;
  }
  return updated;
}

export async function deleteComment(supabase: SupabaseClientType, userId: string, commentId: string): Promise<boolean> {
  const comment = await getCommentById(supabase, userId, commentId);
  if (!comment) return false; // Not found or unauthorized - intentionally silent

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    logDbError("deleteComment", error);
    return false;
  }
  return true;
}

// ============== ATTACHMENTS ==============

export async function addAttachment(supabase: SupabaseClientType, userId: string, projectId: string, data: {
  label: string;
  url: string;
  type: "figma" | "github" | "demo" | "document" | "link";
  milestone_id?: string;
}): Promise<Attachment | null> {
  const project = await verifyProjectOwnership(supabase, userId, projectId);
  if (!project) return null; // Not found or unauthorized - intentionally silent

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
    logDbError("addAttachment", error);
    return null;
  }
  return attachment;
}

export async function getAttachmentById(supabase: SupabaseClientType, userId: string, attachmentId: string): Promise<Attachment | null> {
  const { data, error } = await supabase
    .from("attachments")
    .select("*, projects!inner(organization_id, organizations!inner(user_id))")
    .eq("id", attachmentId)
    .eq("projects.organizations.user_id", userId)
    .single();
  if (error && error.code !== "PGRST116") {
    logDbError("getAttachmentById", error);
  }
  return data;
}

export async function deleteAttachment(supabase: SupabaseClientType, userId: string, attachmentId: string): Promise<boolean> {
  const attachment = await getAttachmentById(supabase, userId, attachmentId);
  if (!attachment) return false; // Not found or unauthorized - intentionally silent

  const { error } = await supabase
    .from("attachments")
    .delete()
    .eq("id", attachmentId);

  if (error) {
    logDbError("deleteAttachment", error);
    return false;
  }
  return true;
}

// ============== SECURE NOTES ==============

export async function setSecureNote(supabase: SupabaseClientType, userId: string, projectId: string, encryptedNote: string, passwordHash: string): Promise<boolean> {
  const project = await verifyProjectOwnership(supabase, userId, projectId);
  if (!project) return false; // Not found or unauthorized - intentionally silent

  const { error } = await supabase
    .from("projects")
    .update({
      secure_note_encrypted: encryptedNote,
      secure_note_password_hash: passwordHash,
    })
    .eq("id", projectId);

  if (error) {
    logDbError("setSecureNote", error);
    return false;
  }
  return true;
}

export async function deleteSecureNote(supabase: SupabaseClientType, userId: string, projectId: string): Promise<boolean> {
  const project = await verifyProjectOwnership(supabase, userId, projectId);
  if (!project) return false; // Not found or unauthorized - intentionally silent

  const { error } = await supabase
    .from("projects")
    .update({
      secure_note_encrypted: null,
      secure_note_password_hash: null,
    })
    .eq("id", projectId);

  if (error) {
    logDbError("deleteSecureNote", error);
    return false;
  }
  return true;
}

// ============== PROJECT PASSWORD ==============

export async function setProjectPassword(supabase: SupabaseClientType, userId: string, projectId: string, passwordHash: string | null): Promise<boolean> {
  const project = await verifyProjectOwnership(supabase, userId, projectId);
  if (!project) return false; // Not found or unauthorized - intentionally silent

  const { error } = await supabase
    .from("projects")
    .update({ public_password_hash: passwordHash })
    .eq("id", projectId);

  if (error) {
    logDbError("setProjectPassword", error);
    return false;
  }
  return true;
}

// ============== PAYMENT HISTORY ==============

export async function addPaymentHistoryEntry(supabase: SupabaseClientType, userId: string, milestoneId: string, data: { amount: number; note?: string }): Promise<PaymentHistoryEntry | null> {
  const milestone = await getMilestoneById(supabase, userId, milestoneId);
  if (!milestone) return null; // Not found or unauthorized - intentionally silent

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
    logDbError("addPaymentHistoryEntry", error);
    return null;
  }
  return entry;
}

/**
 * Get payment history (legacy - no pagination)
 * @deprecated Use getPaymentHistoryPaginated for better performance
 */
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

/**
 * Get payment history with pagination support
 */
export async function getPaymentHistoryPaginated(
  supabase: SupabaseClientType,
  userId: string,
  milestoneId: string,
  pagination: PaginationParams = {}
): Promise<PaginatedResult<PaymentHistoryEntry>> {
  const { limit = DEFAULT_PAGE_LIMIT, offset = 0 } = pagination;

  // Verify ownership
  const milestone = await getMilestoneById(supabase, userId, milestoneId);
  if (!milestone) {
    return { data: [], total: 0, limit, offset, hasMore: false };
  }

  // Get total count
  const { count } = await supabase
    .from("payment_history")
    .select("*", { count: "exact", head: true })
    .eq("milestone_id", milestoneId);

  // Get paginated data
  const { data } = await supabase
    .from("payment_history")
    .select("*")
    .eq("milestone_id", milestoneId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const total = count || 0;
  return {
    data: data || [],
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

/**
 * Deletes a payment entry and atomically recalculates milestone paid_amount
 * Uses RPC function with FOR UPDATE lock to prevent race conditions
 */
export async function deletePaymentHistoryEntry(supabase: SupabaseClientType, userId: string, entryId: string): Promise<boolean> {
  // 1. Verify ownership first
  const { data: entry } = await supabase
    .from("payment_history")
    .select("*, milestones!inner(project_id, projects!inner(organization_id, organizations!inner(user_id)))")
    .eq("id", entryId)
    .eq("milestones.projects.organizations.user_id", userId)
    .single();

  if (!entry) return false;

  // 2. Use atomic RPC function to delete and recalculate
  const { data: result, error } = await supabase.rpc("delete_payment_atomic", {
    p_entry_id: entryId,
  });

  if (error || !result?.success) {
    console.error("Atomic payment deletion failed:", error?.message || result?.error);
    return false;
  }

  return true;
}

/**
 * Records a payment atomically using database-level transaction
 * Uses RPC function with FOR UPDATE lock to prevent race conditions
 * @returns Updated milestone and payment entry, or null if failed
 */
export async function recordPaymentAtomically(
  supabase: SupabaseClientType,
  userId: string,
  milestoneId: string,
  data: { amount: number; note?: string }
): Promise<{ milestone: Milestone; entry: PaymentHistoryEntry } | null> {
  // 1. Verify ownership first (before calling RPC)
  const milestone = await getMilestoneById(supabase, userId, milestoneId);
  if (!milestone) return null;

  // 2. Validate amount
  if (typeof data.amount !== "number" || !Number.isFinite(data.amount) || data.amount === 0) {
    return null;
  }

  // 3. Call atomic RPC function (uses FOR UPDATE lock in database)
  const { data: result, error } = await supabase.rpc("record_payment_atomic", {
    p_milestone_id: milestoneId,
    p_amount: data.amount,
    p_note: data.note || null,
  });

  if (error || !result?.success) {
    console.error("Atomic payment failed:", error?.message || result?.error);
    return null;
  }

  // 4. Return result with data from RPC response (avoid redundant fetch)
  // The RPC already returns updated values, so we update the milestone in-place
  const updatedMilestone: Milestone = {
    ...milestone,
    paid_amount: result.paid_amount,
    is_paid: result.is_paid,
    paid_at: result.paid_at,
    payment_history: [
      {
        id: result.entry_id,
        milestone_id: milestoneId,
        amount: data.amount,
        note: data.note || null,
        created_at: new Date().toISOString(),
      } as PaymentHistoryEntry,
      ...(milestone.payment_history || []),
    ],
  };

  return {
    milestone: updatedMilestone,
    entry: {
      id: result.entry_id,
      milestone_id: milestoneId,
      amount: data.amount,
      note: data.note || null,
      created_at: new Date().toISOString(),
    } as PaymentHistoryEntry,
  };
}

// ============== DASHBOARD ==============

export async function getDashboardStats(supabase: SupabaseClientType, userId: string) {
  const emptyStats = {
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

  // Get organization count and IDs in one query
  const { data: orgs, count: orgCount } = await supabase
    .from("organizations")
    .select("id", { count: "exact" })
    .eq("user_id", userId);

  if (!orgs || orgs.length === 0) {
    return emptyStats;
  }

  const orgIds = orgs.map(o => o.id);

  // Run all queries in parallel for better performance
  const [projectsResult, milestonesResult] = await Promise.all([
    // Get projects with status
    supabase
      .from("projects")
      .select("status")
      .in("organization_id", orgIds),
    // Get all milestones with time entries in one query
    supabase
      .from("milestones")
      .select("type, amount, paid_amount, hourly_rate, unit_rate, time_entries(hours, units, paid_amount), projects!inner(organization_id)")
      .in("projects.organization_id", orgIds),
  ]);

  // Process project counts by status
  const projectsByStatus = {
    in_progress: 0,
    awaiting_payment: 0,
    completed: 0,
    on_hold: 0,
  };

  const projectCounts = projectsResult.data || [];
  projectCounts.forEach(p => {
    const status = p.status || "in_progress";
    if (status in projectsByStatus) {
      projectsByStatus[status as keyof typeof projectsByStatus]++;
    }
  });

  // Process milestones - single pass through data
  let fixedTotal = 0;
  let fixedPaid = 0;
  let totalHours = 0;
  let hourlyAmount = 0;
  let hourlyPaid = 0;
  let totalUnits = 0;
  let unitAmount = 0;
  let unitPaid = 0;

  const milestones = milestonesResult.data || [];
  milestones.forEach(m => {
    const milestoneType = m.type || "fixed";
    const entries = m.time_entries || [];

    if (milestoneType === "fixed" || !m.type) {
      fixedTotal += Number(m.amount || 0);
      fixedPaid += Number(m.paid_amount || 0);
    } else if (milestoneType === "hourly") {
      const rate = Number(m.hourly_rate || 0);
      entries.forEach((e: { hours?: number; paid_amount?: number }) => {
        const hours = Number(e.hours || 0);
        totalHours += hours;
        hourlyAmount += hours * rate;
        hourlyPaid += Number(e.paid_amount || 0);
      });
    } else if (milestoneType === "per_unit") {
      const rate = Number(m.unit_rate || 0);
      entries.forEach((e: { units?: number; paid_amount?: number }) => {
        const units = Number(e.units || 0);
        totalUnits += units;
        unitAmount += units * rate;
        unitPaid += Number(e.paid_amount || 0);
      });
    }
  });

  const totalAmount = fixedTotal + hourlyAmount + unitAmount;
  const paidAmount = fixedPaid + hourlyPaid + unitPaid;

  return {
    totalOrganizations: orgCount || orgs.length,
    totalProjects: projectCounts.length,
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
