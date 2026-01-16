import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError } from "@/lib/api-auth";
import { addTimeEntry, getMilestoneById } from "@/lib/api-db";

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

      // Get milestone to check limits
      const milestone = await getMilestoneById(supabase, user.id, milestone_id);
      if (!milestone) {
        return apiError("Milestone not found or unauthorized", 404);
      }

      // Validate hours against hours_limit if set
      if (hours !== undefined && milestone.hours_limit && milestone.hours_limit > 0) {
        const existingHours = (milestone.time_entries || []).reduce(
          (sum, e) => sum + Number(e.hours || 0), 0
        );
        if (existingHours + hours > milestone.hours_limit) {
          const remaining = Math.max(0, milestone.hours_limit - existingHours);
          return apiError(`Would exceed hours limit. Remaining: ${remaining.toFixed(1)}h of ${milestone.hours_limit}h`);
        }
      }

      // Validate units against units_limit if set
      if (units !== undefined && milestone.units_limit && milestone.units_limit > 0) {
        const existingUnits = (milestone.time_entries || []).reduce(
          (sum, e) => sum + Number(e.units || 0), 0
        );
        if (existingUnits + units > milestone.units_limit) {
          const remaining = Math.max(0, milestone.units_limit - existingUnits);
          return apiError(`Would exceed units limit. Remaining: ${remaining} of ${milestone.units_limit}`);
        }
      }

      const entry = await addTimeEntry(supabase, user.id, milestone_id, {
        date,
        hours: hours || undefined,
        units: units || undefined,
        description,
        paid_amount,
      });

      if (!entry) {
        return apiError("Failed to create time entry", 500);
      }

      return apiSuccess(entry, 201);
    } catch {
      return apiError("Invalid request");
    }
  });
}
