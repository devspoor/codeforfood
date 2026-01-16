import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError, apiNotFound } from "@/lib/api-auth";
import { getPaymentHistory, addPaymentHistoryEntry, getMilestoneById, recordPaymentAtomically } from "@/lib/api-db";

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
 * Record payment - adds to payment history and updates milestone paid_amount atomically
 * Uses sum of all payment history entries to avoid race conditions
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

      if (!Number.isFinite(amount) || amount === 0) {
        return apiError("Amount must be a non-zero finite number");
      }

      // Record payment atomically (adds to history + recalculates paid_amount)
      const result = await recordPaymentAtomically(supabase, user.id, id, { amount, note });

      if (!result) {
        return apiNotFound("Milestone not found or payment failed");
      }

      return apiSuccess(result.milestone);
    } catch {
      return apiError("Invalid request");
    }
  });
}
