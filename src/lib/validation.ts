/**
 * Input validation utilities for API routes
 */

// Maximum lengths for text fields
export const MAX_LENGTHS = {
  name: 200,
  title: 200,
  description: 5000,
  content: 10000,
  label: 200,
  url: 2000,
  note: 50000,
} as const;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a required string field
 */
export function validateRequiredString(
  value: unknown,
  fieldName: string,
  maxLength: number = MAX_LENGTHS.name
): ValidationResult {
  if (!value || typeof value !== "string") {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} is too long (max ${maxLength} characters)` };
  }

  return { valid: true };
}

/**
 * Validates an optional string field
 */
export function validateOptionalString(
  value: unknown,
  fieldName: string,
  maxLength: number = MAX_LENGTHS.description
): ValidationResult {
  if (value === undefined || value === null || value === "") {
    return { valid: true };
  }

  if (typeof value !== "string") {
    return { valid: false, error: `${fieldName} must be a string` };
  }

  if (value.length > maxLength) {
    return { valid: false, error: `${fieldName} is too long (max ${maxLength} characters)` };
  }

  return { valid: true };
}

/**
 * Validates a URL string
 */
export function validateUrl(value: unknown, fieldName: string = "URL"): ValidationResult {
  if (!value || typeof value !== "string") {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmed = value.trim();
  if (trimmed.length > MAX_LENGTHS.url) {
    return { valid: false, error: `${fieldName} is too long (max ${MAX_LENGTHS.url} characters)` };
  }

  try {
    const parsedUrl = new URL(trimmed);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return { valid: false, error: `${fieldName} must use http or https protocol` };
    }
  } catch {
    return { valid: false, error: `Invalid ${fieldName} format` };
  }

  return { valid: true };
}

/**
 * Validates a positive number
 */
export function validatePositiveNumber(
  value: unknown,
  fieldName: string,
  maxValue: number = 999999999999
): ValidationResult {
  if (value === undefined || value === null) {
    return { valid: false, error: `${fieldName} is required` };
  }

  const num = Number(value);
  if (!Number.isFinite(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  if (num <= 0) {
    return { valid: false, error: `${fieldName} must be a positive number` };
  }

  if (num > maxValue) {
    return { valid: false, error: `${fieldName} exceeds maximum allowed value` };
  }

  return { valid: true };
}

/**
 * Validates a non-negative number (0 or positive)
 */
export function validateNonNegativeNumber(
  value: unknown,
  fieldName: string,
  maxValue: number = 999999999999
): ValidationResult {
  if (value === undefined || value === null) {
    return { valid: true }; // Optional by default
  }

  const num = Number(value);
  if (!Number.isFinite(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  if (num < 0) {
    return { valid: false, error: `${fieldName} cannot be negative` };
  }

  if (num > maxValue) {
    return { valid: false, error: `${fieldName} exceeds maximum allowed value` };
  }

  return { valid: true };
}
