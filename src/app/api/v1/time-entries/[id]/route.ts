import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError, apiNotFound } from "@/lib/api-auth";
import { getTimeEntryById, updateTimeEntry, deleteTimeEntry } from "@/lib/api-db";

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
      const { date, hours, description, paid_amount } = await request.json();

      const updateData: Record<string, unknown> = {};
      if (date !== undefined) updateData.date = date;
      if (hours !== undefined) updateData.hours = hours;
      if (description !== undefined) updateData.description = description;
      if (paid_amount !== undefined) updateData.paid_amount = paid_amount;

      const entry = await updateTimeEntry(supabase, user.id, id, updateData);
      if (!entry) {
        return apiNotFound("Time entry");
      }

      return apiSuccess(entry);
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
