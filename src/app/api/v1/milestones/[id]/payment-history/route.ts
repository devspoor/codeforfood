import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError, apiNotFound } from "@/lib/api-auth";
import { getPaymentHistory, addPaymentHistoryEntry, getMilestoneById, updateMilestonePaidAmount } from "@/lib/api-db";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/milestones/[id]/payment-history
 * Get payment history for milestone
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const milestone = await getMilestoneById(supabase, user.id, id);
    if (!milestone) {
      return apiNotFound("Milestone");
    }

    const history = await getPaymentHistory(supabase, user.id, id);
    return apiSuccess(history);
  });
}

/**
 * POST /api/v1/milestones/[id]/payment-history
 * Add payment history entry
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const { amount, note } = await request.json();

      if (amount === undefined || typeof amount !== "number") {
        return apiError("Amount is required and must be a number");
      }

      const entry = await addPaymentHistoryEntry(supabase, user.id, id, { amount, note });
      if (!entry) {
        return apiNotFound("Milestone");
      }

      return apiSuccess(entry, 201);
    } catch {
      return apiError("Invalid request");
    }
  });
}

/**
 * PATCH /api/v1/milestones/[id]/payment-history
 * Record payment - adds to payment history and updates milestone paid_amount
 * Used by iOS app - returns updated milestone
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const { amount, note } = await request.json();

      if (amount === undefined || typeof amount !== "number") {
        return apiError("Amount is required and must be a number");
      }

      // Get current milestone to calculate new paid_amount
      const milestone = await getMilestoneById(supabase, user.id, id);
      if (!milestone) {
        return apiNotFound("Milestone");
      }

      // Add payment history entry
      await addPaymentHistoryEntry(supabase, user.id, id, { amount, note });

      // Update milestone paid_amount
      const newPaidAmount = Number(milestone.paid_amount || 0) + amount;
      const updated = await updateMilestonePaidAmount(supabase, user.id, id, newPaidAmount);

      if (!updated) {
        return apiError("Failed to update milestone");
      }

      return apiSuccess(updated);
    } catch {
      return apiError("Invalid request");
    }
  });
}
