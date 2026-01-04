import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError, apiNotFound } from "@/lib/api-auth";
import { getOrganizationById, updateOrganization, deleteOrganization, getProjectsByOrganization } from "@/lib/api-db";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/organizations/[id]
 * Get organization by ID with projects
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const org = await getOrganizationById(supabase, user.id, id);
    if (!org) {
      return apiNotFound("Organization");
    }

    const projects = await getProjectsByOrganization(supabase, user.id, id);

    return apiSuccess({ ...org, projects });
  });
}

/**
 * PATCH /api/v1/organizations/[id]
 * Update organization
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const { name, description } = await request.json();

      const org = await updateOrganization(supabase, user.id, id, { name, description });
      if (!org) {
        return apiNotFound("Organization");
      }

      return apiSuccess(org);
    } catch {
      return apiError("Invalid request");
    }
  });
}

/**
 * DELETE /api/v1/organizations/[id]
 * Delete organization
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const deleted = await deleteOrganization(supabase, user.id, id);
    if (!deleted) {
      return apiNotFound("Organization");
    }

    return apiSuccess({ success: true });
  });
}
