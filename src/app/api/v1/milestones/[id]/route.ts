import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiNotFound, handleApiError } from "@/lib/api-auth";
import { getMilestoneById, updateMilestone, updateMilestonePaidAmount, deleteMilestone } from "@/lib/api-db";

type Params = { params: Promise<{ id: string }> };

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
      } = body;

      // Handle paid_amount update separately (it has special logic)
      if (paid_amount !== undefined && Object.keys(body).length === 1) {
        const milestone = await updateMilestonePaidAmount(supabase, user.id, id, paid_amount);
        if (!milestone) {
          return apiNotFound("Milestone");
        }
        return apiSuccess(milestone);
      }

      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (amount !== undefined) updateData.amount = amount;
      if (paid_amount !== undefined) updateData.paid_amount = paid_amount;
      if (hourly_rate !== undefined) updateData.hourly_rate = hourly_rate;
      if (estimated_hours !== undefined) updateData.estimated_hours = estimated_hours;
      if (hours_limit !== undefined) updateData.hours_limit = hours_limit;
      if (order !== undefined) updateData.order = order;

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
