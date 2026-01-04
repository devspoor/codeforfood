import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError, apiNotFound } from "@/lib/api-auth";
import { getProjectById, updateProject, deleteProject, getProjectSummary } from "@/lib/api-db";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/projects/[id]
 * Get project by ID with all details
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const project = await getProjectById(supabase, user.id, id);
    if (!project) {
      return apiNotFound("Project");
    }

    return apiSuccess({
      ...project,
      summary: getProjectSummary(project),
    });
  });
}

/**
 * PATCH /api/v1/projects/[id]
 * Update project
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const { name, description, status, hide_amounts, hide_paid, show_payment_history } = await request.json();

      const project = await updateProject(supabase, user.id, id, {
        name,
        description,
        status,
        hide_amounts,
        hide_paid,
        show_payment_history,
      });

      if (!project) {
        return apiNotFound("Project");
      }

      return apiSuccess(project);
    } catch {
      return apiError("Invalid request");
    }
  });
}

/**
 * DELETE /api/v1/projects/[id]
 * Delete project
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const deleted = await deleteProject(supabase, user.id, id);
    if (!deleted) {
      return apiNotFound("Project");
    }

    return apiSuccess({ success: true });
  });
}
