/**
 * Unified Database Layer
 *
 * This module provides a unified interface for database operations.
 * It wraps both server-side (with session auth) and API-side (with explicit auth) functions.
 *
 * Usage in Server Components:
 *   import { getOrganizations } from "@/lib/db";
 *   const orgs = await getOrganizations();
 *
 * Usage in API Routes (with explicit auth):
 *   import { api } from "@/lib/db";
 *   const orgs = await api.getOrganizations(supabase, userId);
 *
 * Future: All functions will be migrated to this unified structure.
 * For now, this re-exports from the legacy files for backward compatibility.
 */

// Re-export types
export * from "./core/types";

// Re-export legacy functions for backward compatibility
// Server-side functions (with implicit auth via session)
export {
  getCurrentUser,
  getCurrentProfile,
  getOrganizations,
  getOrganizationById,
  getOrganizationByHash,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getProjects,
  getProjectById,
  getProjectByHash,
  createProject,
  updateProject,
  deleteProject,
  transferProject,
  addMilestone,
  updateMilestone,
  updateMilestonePaidAmount,
  deleteMilestone,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  addTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  addComment,
  updateComment,
  deleteComment,
  addAttachment,
  deleteAttachment,
  setProjectPassword,
  verifyProjectPassword,
  addPaymentHistoryEntry,
  getPaymentHistory,
  deletePaymentHistoryEntry,
  addOperatingExpense,
  updateOperatingExpense,
  deleteOperatingExpense,
  getProjectSummary,
  getOrganizationsWithProjects,
} from "../db";

// API functions namespace (require explicit supabase client and userId)
import * as apiDb from "../api-db";
export const api = apiDb;
