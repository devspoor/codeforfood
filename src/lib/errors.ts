/**
 * User-friendly error messages
 * Provides consistent, helpful error messages across the application
 */

// Common error messages for various scenarios
export const ERROR_MESSAGES = {
  // Authentication
  UNAUTHORIZED: "Please sign in to continue",
  SESSION_EXPIRED: "Your session has expired. Please sign in again",
  INVALID_CREDENTIALS: "Invalid email or password",

  // Permissions
  FORBIDDEN: "You don't have permission to perform this action",
  NOT_OWNER: "You can only modify your own resources",

  // Resources
  NOT_FOUND: "The requested item could not be found",
  PROJECT_NOT_FOUND: "Project not found or you don't have access to it",
  ORGANIZATION_NOT_FOUND: "Organization not found or you don't have access to it",
  MILESTONE_NOT_FOUND: "Milestone not found",
  ENTRY_NOT_FOUND: "Entry not found",

  // Validation
  INVALID_REQUEST: "Invalid request. Please check your input",
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_FORMAT: (field: string) => `Invalid format for ${field}`,
  TOO_LONG: (field: string, max: number) => `${field} must be ${max} characters or less`,
  TOO_SHORT: (field: string, min: number) => `${field} must be at least ${min} characters`,
  INVALID_EMAIL: "Please enter a valid email address",
  INVALID_URL: "Please enter a valid URL",
  INVALID_NUMBER: "Please enter a valid number",
  NEGATIVE_NOT_ALLOWED: "Value must be positive",
  ZERO_NOT_ALLOWED: "Value must be greater than zero",

  // Operations
  CREATE_FAILED: "Failed to create. Please try again",
  UPDATE_FAILED: "Failed to update. Please try again",
  DELETE_FAILED: "Failed to delete. Please try again",
  SAVE_FAILED: "Failed to save changes. Please try again",
  LOAD_FAILED: "Failed to load data. Please refresh the page",

  // Network
  NETWORK_ERROR: "Network error. Please check your connection",
  SERVER_ERROR: "Something went wrong. Please try again later",
  TIMEOUT: "Request timed out. Please try again",

  // Rate limiting
  TOO_MANY_REQUESTS: "Too many requests. Please wait a moment before trying again",
  TOO_MANY_LOGIN_ATTEMPTS: "Too many login attempts. Please try again in 15 minutes",

  // Payments
  INVALID_AMOUNT: "Please enter a valid payment amount",
  PAYMENT_EXCEEDS_REMAINING: "Payment amount exceeds remaining balance",
  PAYMENT_FAILED: "Payment recording failed. Please try again",

  // File operations
  FILE_TOO_LARGE: "File is too large. Maximum size is 5MB",
  INVALID_FILE_TYPE: "This file type is not supported",

  // General
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again",
  TRY_AGAIN: "Something went wrong. Please try again",
} as const;

/**
 * Maps HTTP status codes to user-friendly messages
 */
export function getErrorMessageFromStatus(status: number): string {
  switch (status) {
    case 400:
      return ERROR_MESSAGES.INVALID_REQUEST;
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 403:
      return ERROR_MESSAGES.FORBIDDEN;
    case 404:
      return ERROR_MESSAGES.NOT_FOUND;
    case 408:
      return ERROR_MESSAGES.TIMEOUT;
    case 429:
      return ERROR_MESSAGES.TOO_MANY_REQUESTS;
    case 500:
    case 502:
    case 503:
    case 504:
      return ERROR_MESSAGES.SERVER_ERROR;
    default:
      return ERROR_MESSAGES.UNKNOWN_ERROR;
  }
}

/**
 * Extracts a user-friendly error message from various error formats
 */
export function getUserFriendlyError(error: unknown): string {
  // Handle null/undefined
  if (!error) {
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  // Handle Error objects
  if (error instanceof Error) {
    // Check for network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    // Don't expose internal error messages
    return ERROR_MESSAGES.TRY_AGAIN;
  }

  // Handle API response errors (with error.message or error.error)
  if (typeof error === "object") {
    const errorObj = error as Record<string, unknown>;

    // Common API error formats
    if (typeof errorObj.error === "string") {
      return errorObj.error;
    }
    if (typeof errorObj.message === "string") {
      return errorObj.message;
    }
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Creates a consistent error response for API routes
 */
export function createApiErrorResponse(
  code: keyof typeof ERROR_MESSAGES | string,
  details?: string
): { error: string; details?: string } {
  const message = typeof code === "string" && code in ERROR_MESSAGES
    ? ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES]
    : code;

  return {
    error: typeof message === "function" ? details || "Validation error" : message as string,
    ...(details && typeof message !== "function" ? { details } : {}),
  };
}
