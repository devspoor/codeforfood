/**
 * Shared data normalization utilities
 * Used by both server-side (db.ts) and API (api-db.ts) database layers
 */

import type { Project, Milestone, TimeEntry, PaymentHistoryEntry, Comment, OperatingExpense } from "../types";

// Maximum items for nested collections to prevent memory issues
const MAX_NESTED_ITEMS = 100;

/**
 * Safely parses a date string and returns timestamp for sorting
 * Returns 0 for invalid dates to prevent sort errors
 */
function safeGetTime(dateString: string | undefined | null): number {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

/**
 * Normalizes project data from database response
 * - Sorts milestones by order
 * - Sorts time entries and payment history by date (descending)
 * - Limits nested collections to MAX_NESTED_ITEMS
 * - Masks sensitive fields for public responses
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeProjectData(data: any, options: { isPublic?: boolean; includeExpenses?: boolean } = {}): Project {
  const { isPublic = false, includeExpenses = true } = options;

  const normalized = {
    ...data,
    status: data.status || "in_progress",
    hide_amounts: data.hide_amounts || false,
    hide_paid: data.hide_paid || false,
    show_payment_history: data.show_payment_history || false,
    show_expenses: data.show_expenses || false,
    has_password: !!data.public_password_hash,
    has_secure_note: !!data.secure_note_encrypted,
    milestones: ((data.milestones as Milestone[]) || [])
      .sort((a, b) => a.order - b.order)
      .slice(0, MAX_NESTED_ITEMS)
      .map((m: Milestone & { time_entries?: TimeEntry[]; payment_history?: PaymentHistoryEntry[] }) => ({
        ...m,
        type: m.type || "fixed",
        time_entries: (m.time_entries || [])
          .sort((a, b) => safeGetTime(b.date) - safeGetTime(a.date))
          .slice(0, MAX_NESTED_ITEMS),
        payment_history: (m.payment_history || [])
          .sort((a, b) => safeGetTime(b.created_at) - safeGetTime(a.created_at))
          .slice(0, MAX_NESTED_ITEMS)
      })),
    comments: ((data.comments as Comment[]) || [])
      .sort((a, b) => safeGetTime(b.created_at) - safeGetTime(a.created_at))
      .slice(0, MAX_NESTED_ITEMS),
    attachments: (data.attachments || []).slice(0, MAX_NESTED_ITEMS),
  };

  // Add operating expenses if requested
  if (includeExpenses && data.operating_expenses) {
    normalized.operating_expenses = ((data.operating_expenses as OperatingExpense[]) || [])
      .sort((a, b) => safeGetTime(b.date) - safeGetTime(a.date))
      .slice(0, MAX_NESTED_ITEMS);
  }

  // Mask sensitive fields for public responses
  if (isPublic) {
    normalized.public_password_hash = data.public_password_hash ? "protected" : null;
    normalized.secure_note_encrypted = data.secure_note_encrypted ? "exists" : null;
    normalized.secure_note_password_hash = undefined;
  }

  return normalized as Project;
}
