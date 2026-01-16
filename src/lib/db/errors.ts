/**
 * Database error handling utilities
 * Provides consistent error handling and logging across db layers
 */

export type DbErrorCode =
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "DATABASE_ERROR"
  | "CONFLICT";

export interface DbError {
  code: DbErrorCode;
  message: string;
  details?: string;
}

export type DbResult<T> =
  | { success: true; data: T }
  | { success: false; error: DbError };

/**
 * Creates a successful result
 */
export function dbSuccess<T>(data: T): DbResult<T> {
  return { success: true, data };
}

/**
 * Creates an error result with logging
 */
export function dbError<T>(
  code: DbErrorCode,
  message: string,
  details?: string
): DbResult<T> {
  const error: DbError = { code, message, details };

  // Log database errors (but not not-found or validation errors)
  if (code === "DATABASE_ERROR") {
    console.error(`[DB Error] ${message}`, details ? `Details: ${details}` : "");
  }

  return { success: false, error };
}

/**
 * Handles Supabase errors consistently
 * @param error - Supabase error object
 * @param operation - Description of the operation for logging
 * @returns DbResult with appropriate error code
 */
export function handleSupabaseError<T>(
  error: { message: string; code?: string; details?: string } | null,
  operation: string
): DbResult<T> | null {
  if (!error) return null;

  // Map common Supabase error codes
  if (error.code === "PGRST116") {
    // Row not found (single query returned no results)
    return dbError("NOT_FOUND", `${operation}: Not found`);
  }

  if (error.code === "23505") {
    // Unique constraint violation
    return dbError("CONFLICT", `${operation}: Already exists`, error.details);
  }

  if (error.code === "23503") {
    // Foreign key violation
    return dbError("VALIDATION_ERROR", `${operation}: Invalid reference`, error.details);
  }

  // Generic database error
  return dbError("DATABASE_ERROR", `${operation} failed`, error.message);
}

/**
 * Helper to unwrap DbResult - returns data or null
 * Use this for backwards compatibility with existing code
 */
export function unwrapResult<T>(result: DbResult<T>): T | null {
  return result.success ? result.data : null;
}

/**
 * Helper to check if result is an error of specific type
 */
export function isDbError(result: DbResult<unknown>, code?: DbErrorCode): boolean {
  if (result.success) return false;
  if (code) return result.error.code === code;
  return true;
}
