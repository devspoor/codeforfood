import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError } from "@/lib/api-auth";
import { getProjects, createProject, getProjectSummary } from "@/lib/api-db";

/**
 * GET /api/v1/projects
 * Get all projects for current user with summaries
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async ({ user, supabase }) => {
    const projects = await getProjects(supabase, user.id);

    // Add summary to each project
    const projectsWithSummary = projects.map(project => ({
      ...project,
      summary: getProjectSummary(project),
    }));

    return apiSuccess(projectsWithSummary);
  });
}

/**
 * POST /api/v1/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const { organization_id, name, description } = await request.json();

      if (!organization_id) {
        return apiError("organization_id is required");
      }

      if (!name || typeof name !== "string") {
        return apiError("Name is required");
      }

      const project = await createProject(supabase, user.id, {
        organizationId: organization_id,
        name,
        description,
      });

      if (!project) {
        return apiError("Failed to create project. Organization not found or unauthorized.", 400);
      }

      return apiSuccess(project, 201);
    } catch {
      return apiError("Invalid request");
    }
  });
}
