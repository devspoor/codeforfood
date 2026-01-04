import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError, apiNotFound } from "@/lib/api-auth";
import { addPaymentMethod, getOrganizationById } from "@/lib/api-db";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/organizations/[id]/payment-methods
 * Add payment method to organization
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const org = await getOrganizationById(supabase, user.id, id);
      if (!org) {
        return apiNotFound("Organization");
      }

      const { label, value, type } = await request.json();

      if (!label || !value) {
        return apiError("Label and value are required");
      }

      const pm = await addPaymentMethod(supabase, user.id, id, {
        label,
        value,
        type: type || "other",
      });

      if (!pm) {
        return apiError("Failed to add payment method", 500);
      }

      return apiSuccess(pm, 201);
    } catch {
      return apiError("Invalid request");
    }
  });
}
