import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError } from "@/lib/api-auth";
import { transferProject } from "@/lib/api-db";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/projects/[id]/transfer
 * Transfer project to a different organization
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const { targetOrganizationId } = await request.json();

      if (!targetOrganizationId || typeof targetOrganizationId !== "string") {
        return apiError("targetOrganizationId is required");
      }

      const project = await transferProject(supabase, user.id, id, targetOrganizationId);
      if (!project) {
        return apiError("Transfer failed. Make sure both organizations belong to you and are different.");
      }

      return apiSuccess(project);
    } catch {
      return apiError("Invalid request");
    }
  });
}
