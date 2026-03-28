import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError } from "@/lib/api-auth";
import { addMilestone } from "@/lib/api-db";

// Helper to validate positive number
function validatePositiveNumber(value: unknown, fieldName: string): { valid: boolean; error?: string } {
  if (value === undefined || value === null) {
    return { valid: true }; // Optional field
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }
  if (value < 0) {
    return { valid: false, error: `${fieldName} must be non-negative` };
  }
  // Prevent unreasonably large values (max $100M or 100K hours)
  if (value > 100_000_000) {
    return { valid: false, error: `${fieldName} exceeds maximum allowed value` };
  }
  return { valid: true };
}

// Helper to validate positive integer
function validatePositiveInteger(value: unknown, fieldName: string): { valid: boolean; error?: string } {
  if (value === undefined || value === null) {
    return { valid: true }; // Optional field
  }
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return { valid: false, error: `${fieldName} must be an integer` };
  }
  if (value < 0) {
    return { valid: false, error: `${fieldName} must be non-negative` };
  }
  if (value > 1_000_000) {
    return { valid: false, error: `${fieldName} exceeds maximum allowed value` };
  }
  return { valid: true };
}

/**
 * POST /api/v1/milestones
 * Create a new milestone
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const {
        project_id,
        title,
        description,
        type,
        amount,
        hourly_rate,
        estimated_hours,
        hours_limit,
        unit_rate,
        unit_label,
        estimated_units,
        units_limit,
        due_date,
      } = await request.json();

      if (!project_id) {
        return apiError("project_id is required");
      }

      if (!title || typeof title !== "string") {
        return apiError("Title is required");
      }

      // Validate title length
      if (title.length > 500) {
        return apiError("Title must be 500 characters or less");
      }

      // Validate type
      const validTypes = ["fixed", "hourly", "per_unit"];
      const milestoneType = type || "fixed";
      if (!validTypes.includes(milestoneType)) {
        return apiError("Type must be one of: fixed, hourly, per_unit");
      }

      // Validate numeric fields based on type
      if (milestoneType === "fixed") {
        const amountValidation = validatePositiveNumber(amount, "Amount");
        if (!amountValidation.valid) return apiError(amountValidation.error!);
      }

      if (milestoneType === "hourly") {
        const rateValidation = validatePositiveNumber(hourly_rate, "Hourly rate");
        if (!rateValidation.valid) return apiError(rateValidation.error!);

        const estHoursValidation = validatePositiveNumber(estimated_hours, "Estimated hours");
        if (!estHoursValidation.valid) return apiError(estHoursValidation.error!);

        const limitValidation = validatePositiveNumber(hours_limit, "Hours limit");
        if (!limitValidation.valid) return apiError(limitValidation.error!);
      }

      if (milestoneType === "per_unit") {
        const unitRateValidation = validatePositiveNumber(unit_rate, "Unit rate");
        if (!unitRateValidation.valid) return apiError(unitRateValidation.error!);

        const estUnitsValidation = validatePositiveInteger(estimated_units, "Estimated units");
        if (!estUnitsValidation.valid) return apiError(estUnitsValidation.error!);

        const unitsLimitValidation = validatePositiveInteger(units_limit, "Units limit");
        if (!unitsLimitValidation.valid) return apiError(unitsLimitValidation.error!);

        // Validate unit_label
        if (unit_label !== undefined && (typeof unit_label !== "string" || unit_label.length > 50)) {
          return apiError("Unit label must be a string of 50 characters or less");
        }
      }

      const milestone = await addMilestone(supabase, user.id, project_id, {
        title,
        description,
        type: milestoneType,
        amount,
        hourly_rate,
        estimated_hours,
        hours_limit,
        unit_rate,
        unit_label,
        estimated_units,
        units_limit,
        due_date: due_date || null,
      });

      if (!milestone) {
        return apiError("Failed to create milestone. Project not found or unauthorized.", 400);
      }

      return apiSuccess(milestone, 201);
    } catch {
      return apiError("Invalid request");
    }
  });
}
