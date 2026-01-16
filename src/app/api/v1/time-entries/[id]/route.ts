import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError, apiNotFound } from "@/lib/api-auth";
import { getTimeEntryById, updateTimeEntryAtomic, deleteTimeEntry } from "@/lib/api-db";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/time-entries/[id]
 * Get time entry by ID
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const entry = await getTimeEntryById(supabase, user.id, id);
    if (!entry) {
      return apiNotFound("Time entry");
    }

    return apiSuccess(entry);
  });
}

/**
 * PATCH /api/v1/time-entries/[id]
 * Update time entry
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const { date, hours, units, description, paid_amount } = await request.json();

      const updateData: Record<string, unknown> = {};

      // Validate and add date if provided
      if (date !== undefined) {
        if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return apiError("Date must be in YYYY-MM-DD format");
        }
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          return apiError("Invalid date");
        }
        updateData.date = date;
      }

      // Validate hours if provided
      if (hours !== undefined) {
        if (typeof hours !== "number" || !Number.isFinite(hours) || hours <= 0) {
          return apiError("Hours must be a positive number");
        }
        if (hours > 24) {
          return apiError("Hours cannot exceed 24 per entry");
        }
        updateData.hours = hours;
      }

      // Validate units if provided
      if (units !== undefined) {
        if (typeof units !== "number" || !Number.isInteger(units) || units <= 0) {
          return apiError("Units must be a positive integer");
        }
        if (units > 1_000_000) {
          return apiError("Units exceeds maximum allowed value");
        }
        updateData.units = units;
      }

      // Validate paid_amount if provided
      if (paid_amount !== undefined) {
        if (typeof paid_amount !== "number" || !Number.isFinite(paid_amount) || paid_amount < 0) {
          return apiError("paid_amount must be a non-negative number");
        }
        updateData.paid_amount = paid_amount;
      }

      if (description !== undefined) {
        if (typeof description === "string" && description.length > 5000) {
          return apiError("Description is too long (max 5000 characters)");
        }
        updateData.description = description;
      }

      // Use atomic update to enforce hours/units limits
      const result = await updateTimeEntryAtomic(supabase, user.id, id, updateData);
      if (!result) {
        return apiNotFound("Time entry");
      }

      if (!result.success) {
        // Handle limit exceeded errors
        if (result.error === "Would exceed hours limit") {
          return apiError(`Would exceed hours limit. Remaining: ${result.remaining}h of ${result.limit}h`);
        }
        if (result.error === "Would exceed units limit") {
          return apiError(`Would exceed units limit. Remaining: ${result.remaining} of ${result.limit}`);
        }
        return apiError(result.error);
      }

      return apiSuccess(result.entry);
    } catch {
      return apiError("Invalid request");
    }
  });
}

/**
 * DELETE /api/v1/time-entries/[id]
 * Delete time entry
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const deleted = await deleteTimeEntry(supabase, user.id, id);
    if (!deleted) {
      return apiNotFound("Time entry");
    }

    return apiSuccess({ success: true });
  });
}
