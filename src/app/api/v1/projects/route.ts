import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError } from "@/lib/api-auth";
import { getProjects, createProject, getProjectSummary } from "@/lib/api-db";
import { validateRequiredString, validateOptionalString, MAX_LENGTHS } from "@/lib/validation";
import { getSubscriptionWithClient, isSubscriptionActive, PLAN_LIMITS } from "@/lib/paddle/subscriptions";

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
      const { organization_id, name, description, currency } = await request.json();

      if (!organization_id) {
        return apiError("organization_id is required");
      }

      // Check subscription limits
      const subscription = await getSubscriptionWithClient(supabase, user.id);
      if (!subscription || !isSubscriptionActive(subscription.status)) {
        return apiError("Active subscription required to create projects", 403);
      }

      const { count } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization_id);

      const limit = subscription.plan ? PLAN_LIMITS[subscription.plan].projectsPerOrg : 0;
      if ((count || 0) >= limit) {
        return apiError("Project limit reached for this organization. Upgrade your plan to create more.", 403);
      }

      const nameValidation = validateRequiredString(name, "Name", MAX_LENGTHS.name);
      if (!nameValidation.valid) {
        return apiError(nameValidation.error!);
      }

      const descValidation = validateOptionalString(description, "Description", MAX_LENGTHS.description);
      if (!descValidation.valid) {
        return apiError(descValidation.error!);
      }

      if (currency !== undefined && (typeof currency !== "string" || currency.length !== 3)) {
        return apiError("Currency must be a 3-letter code");
      }

      const project = await createProject(supabase, user.id, {
        organizationId: organization_id,
        name: name.trim(),
        description: description?.trim(),
        currency,
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
