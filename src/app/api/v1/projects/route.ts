import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError } from "@/lib/api-auth";
import { getProjects, createProject, getProjectSummary } from "@/lib/api-db";
import { validateRequiredString, validateOptionalString, MAX_LENGTHS } from "@/lib/validation";

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

      const nameValidation = validateRequiredString(name, "Name", MAX_LENGTHS.name);
      if (!nameValidation.valid) {
        return apiError(nameValidation.error!);
      }

      const descValidation = validateOptionalString(description, "Description", MAX_LENGTHS.description);
      if (!descValidation.valid) {
        return apiError(descValidation.error!);
      }

      const project = await createProject(supabase, user.id, {
        organizationId: organization_id,
        name: name.trim(),
        description: description?.trim(),
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
