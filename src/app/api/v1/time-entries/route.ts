import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError } from "@/lib/api-auth";
import { addTimeEntry } from "@/lib/api-db";

/**
 * POST /api/v1/time-entries
 * Create a new time entry
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const { milestone_id, date, hours, units, description, paid_amount } = await request.json();

      if (!milestone_id) {
        return apiError("milestone_id is required");
      }

      if (!date) {
        return apiError("Date is required");
      }

      // Either hours or units must be provided
      if (hours === undefined && units === undefined) {
        return apiError("Either hours or units is required");
      }

      if (hours !== undefined && (typeof hours !== "number" || hours <= 0)) {
        return apiError("Hours must be a positive number");
      }

      if (units !== undefined && (typeof units !== "number" || units <= 0)) {
        return apiError("Units must be a positive number");
      }

      const entry = await addTimeEntry(supabase, user.id, milestone_id, {
        date,
        hours: hours || undefined,
        units: units || undefined,
        description,
        paid_amount,
      });

      if (!entry) {
        return apiError("Failed to create time entry. Milestone not found or unauthorized.", 400);
      }

      return apiSuccess(entry, 201);
    } catch {
      return apiError("Invalid request");
    }
  });
}
