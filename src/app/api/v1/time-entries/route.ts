import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError } from "@/lib/api-auth";
import { getMilestoneById } from "@/lib/api-db";

/**
 * POST /api/v1/time-entries
 * Create a new time entry
 * Uses atomic RPC function to prevent race conditions on hours/units limits
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

      // Validate date format (YYYY-MM-DD)
      if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return apiError("Date must be in YYYY-MM-DD format");
      }
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return apiError("Invalid date");
      }

      // Either hours or units must be provided
      if (hours === undefined && units === undefined) {
        return apiError("Either hours or units is required");
      }

      if (hours !== undefined && (typeof hours !== "number" || hours <= 0)) {
        return apiError("Hours must be a positive number");
      }

      if (units !== undefined && (typeof units !== "number" || !Number.isInteger(units) || units <= 0)) {
        return apiError("Units must be a positive integer");
      }

      // Validate paid_amount if provided
      if (paid_amount !== undefined && (typeof paid_amount !== "number" || paid_amount < 0)) {
        return apiError("paid_amount must be a non-negative number");
      }

      // Validate description length if provided
      if (description !== undefined && typeof description === "string" && description.length > 5000) {
        return apiError("Description is too long (max 5000 characters)");
      }

      // Verify milestone ownership before atomic operation
      const milestone = await getMilestoneById(supabase, user.id, milestone_id);
      if (!milestone) {
        return apiError("Milestone not found or unauthorized", 404);
      }

      // Use atomic RPC function to prevent race conditions on limits
      // This locks the milestone row and validates limits within a single transaction
      const { data: result, error } = await supabase.rpc("add_time_entry_atomic", {
        p_milestone_id: milestone_id,
        p_date: date,
        p_hours: hours || null,
        p_units: units || null,
        p_description: description || null,
        p_paid_amount: paid_amount || 0,
      });

      if (error) {
        console.error("Atomic time entry failed:", error.message);
        return apiError("Failed to create time entry", 500);
      }

      if (!result?.success) {
        // Handle limit exceeded errors from the RPC function
        if (result?.error === "Would exceed hours limit") {
          return apiError(`Would exceed hours limit. Remaining: ${result.remaining}h of ${result.limit}h`);
        }
        if (result?.error === "Would exceed units limit") {
          return apiError(`Would exceed units limit. Remaining: ${result.remaining} of ${result.limit}`);
        }
        return apiError(result?.error || "Failed to create time entry", 400);
      }

      // Fetch the created entry to return full data
      const { data: entry } = await supabase
        .from("time_entries")
        .select("*")
        .eq("id", result.entry_id)
        .single();

      return apiSuccess(entry, 201);
    } catch {
      return apiError("Invalid request");
    }
  });
}
