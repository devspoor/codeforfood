/**
 * Database layer types and shared utilities
 * This module provides a unified interface for database operations
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// Re-export all types from main types file
export type {
  Organization,
  Project,
  Milestone,
  PaymentMethod,
  TimeEntry,
  Comment,
  Attachment,
  PaymentHistoryEntry,
  OperatingExpense,
  Profile,
  ProjectSummary,
  PaginationParams,
  PaginatedResult,
} from "@/lib/types";

// Database client type
export type DbClient = SupabaseClient;

// Common query options
export interface QueryOptions {
  /** Include soft-deleted records */
  includeDeleted?: boolean;
}

// Error types for better error handling
export class DbError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "DbError";
  }
}

export class NotFoundError extends DbError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends DbError {
  constructor(message = "Unauthorized access") {
    super(message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

// Default pagination values
export const DEFAULT_PAGE_LIMIT = 50;
export const MAX_PAGE_LIMIT = 100;

// Common SELECT queries
export const QUERIES = {
  PROJECT_WITH_RELATIONS: "*, milestones(*, time_entries(*), payment_history(*)), comments(*), attachments(*)",
  PROJECT_BASIC: "*, milestones(*, time_entries(*))",
  MILESTONE_WITH_ENTRIES: "*, time_entries(*), payment_history(*)",
} as const;
