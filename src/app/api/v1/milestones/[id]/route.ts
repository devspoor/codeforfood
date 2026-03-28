import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiNotFound, apiError, handleApiError } from "@/lib/api-auth";
import { getMilestoneById, updateMilestone, updateMilestonePaidAmount, deleteMilestone } from "@/lib/api-db";

type Params = { params: Promise<{ id: string }> };

// Validation helpers (same as POST route)
function validatePositiveNumber(value: unknown, fieldName: string): { valid: boolean; error?: string } {
  if (value === undefined || value === null) {
    return { valid: true };
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }
  if (value < 0) {
    return { valid: false, error: `${fieldName} must be non-negative` };
  }
  if (value > 100_000_000) {
    return { valid: false, error: `${fieldName} exceeds maximum allowed value` };
  }
  return { valid: true };
}

function validateNonNegativeNumber(value: unknown, fieldName: string): { valid: boolean; error?: string } {
  if (value === undefined || value === null) {
    return { valid: true };
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }
  if (value < 0) {
    return { valid: false, error: `${fieldName} must be non-negative` };
  }
  if (value > 100_000_000) {
    return { valid: false, error: `${fieldName} exceeds maximum allowed value` };
  }
  return { valid: true };
}

/**
 * GET /api/v1/milestones/[id]
 * Get milestone by ID
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const milestone = await getMilestoneById(supabase, user.id, id);
    if (!milestone) {
      return apiNotFound("Milestone");
    }

    return apiSuccess(milestone);
  });
}

/**
 * PATCH /api/v1/milestones/[id]
 * Update milestone
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const body = await request.json();
      const {
        title,
        description,
        amount,
        paid_amount,
        hourly_rate,
        estimated_hours,
        hours_limit,
        order,
        due_date,
      } = body;

      // Validate all numeric fields before any update
      const amountValidation = validatePositiveNumber(amount, "Amount");
      if (!amountValidation.valid) return apiError(amountValidation.error!);

      const paidAmountValidation = validateNonNegativeNumber(paid_amount, "Paid amount");
      if (!paidAmountValidation.valid) return apiError(paidAmountValidation.error!);

      const hourlyRateValidation = validatePositiveNumber(hourly_rate, "Hourly rate");
      if (!hourlyRateValidation.valid) return apiError(hourlyRateValidation.error!);

      const estimatedHoursValidation = validatePositiveNumber(estimated_hours, "Estimated hours");
      if (!estimatedHoursValidation.valid) return apiError(estimatedHoursValidation.error!);

      const hoursLimitValidation = validatePositiveNumber(hours_limit, "Hours limit");
      if (!hoursLimitValidation.valid) return apiError(hoursLimitValidation.error!);

      // Validate order if provided
      if (order !== undefined && (typeof order !== "number" || !Number.isInteger(order) || order < 0)) {
        return apiError("Order must be a non-negative integer");
      }

      // Validate title length if provided
      if (title !== undefined && typeof title === "string" && title.length > 500) {
        return apiError("Title must be 500 characters or less");
      }

      // Handle paid_amount update - ALWAYS use special logic for paid_amount
      // This ensures proper clamping and is_paid calculation
      if (paid_amount !== undefined) {
        // First update other fields if any
        const otherFields: Record<string, unknown> = {};
        if (title !== undefined) otherFields.title = title;
        if (description !== undefined) otherFields.description = description;
        if (amount !== undefined) otherFields.amount = amount;
        if (hourly_rate !== undefined) otherFields.hourly_rate = hourly_rate;
        if (estimated_hours !== undefined) otherFields.estimated_hours = estimated_hours;
        if (hours_limit !== undefined) otherFields.hours_limit = hours_limit;
        if (order !== undefined) otherFields.order = order;
        if (due_date !== undefined) otherFields.due_date = due_date;

        // Update other fields first if any exist
        if (Object.keys(otherFields).length > 0) {
          const updated = await updateMilestone(supabase, user.id, id, otherFields);
          if (!updated) {
            return apiNotFound("Milestone");
          }
        }

        // Then update paid_amount with special logic (clamps to valid range)
        const milestone = await updateMilestonePaidAmount(supabase, user.id, id, paid_amount);
        if (!milestone) {
          return apiNotFound("Milestone");
        }
        return apiSuccess(milestone);
      }

      // No paid_amount - just update other fields
      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (amount !== undefined) updateData.amount = amount;
      if (hourly_rate !== undefined) updateData.hourly_rate = hourly_rate;
      if (estimated_hours !== undefined) updateData.estimated_hours = estimated_hours;
      if (hours_limit !== undefined) updateData.hours_limit = hours_limit;
      if (order !== undefined) updateData.order = order;
      if (due_date !== undefined) updateData.due_date = due_date;

      const milestone = await updateMilestone(supabase, user.id, id, updateData);
      if (!milestone) {
        return apiNotFound("Milestone");
      }

      return apiSuccess(milestone);
    } catch (error) {
      return handleApiError(error, "PATCH /api/v1/milestones/[id]");
    }
  });
}

/**
 * DELETE /api/v1/milestones/[id]
 * Delete milestone
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const deleted = await deleteMilestone(supabase, user.id, id);
    if (!deleted) {
      return apiNotFound("Milestone");
    }

    return apiSuccess({ success: true });
  });
}
