import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError, apiNotFound } from "@/lib/api-auth";
import { updatePaymentMethod, deletePaymentMethod } from "@/lib/api-db";

type Params = { params: Promise<{ id: string; pmId: string }> };

/**
 * PATCH /api/v1/organizations/[id]/payment-methods/[pmId]
 * Update payment method
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id, pmId } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const { label, value, type } = await request.json();

      const pm = await updatePaymentMethod(supabase, user.id, id, pmId, { label, value, type });
      if (!pm) {
        return apiNotFound("Payment method");
      }

      return apiSuccess(pm);
    } catch {
      return apiError("Invalid request");
    }
  });
}

/**
 * DELETE /api/v1/organizations/[id]/payment-methods/[pmId]
 * Delete payment method
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id, pmId } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const deleted = await deletePaymentMethod(supabase, user.id, id, pmId);
    if (!deleted) {
      return apiNotFound("Payment method");
    }

    return apiSuccess({ success: true });
  });
}
