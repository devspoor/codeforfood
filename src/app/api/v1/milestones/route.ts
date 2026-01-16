import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError } from "@/lib/api-auth";
import { addMilestone } from "@/lib/api-db";

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
      } = await request.json();

      if (!project_id) {
        return apiError("project_id is required");
      }

      if (!title || typeof title !== "string") {
        return apiError("Title is required");
      }

      const milestone = await addMilestone(supabase, user.id, project_id, {
        title,
        description,
        type: type || "fixed",
        amount,
        hourly_rate,
        estimated_hours,
        hours_limit,
        unit_rate,
        unit_label,
        estimated_units,
        units_limit,
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
