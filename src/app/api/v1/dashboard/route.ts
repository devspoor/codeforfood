import { NextRequest } from "next/server";
import { withAuth, apiSuccess } from "@/lib/api-auth";
import { getDashboardStats, getProjects, getProjectSummary } from "@/lib/api-db";

/**
 * GET /api/v1/dashboard
 * Get dashboard statistics and recent projects
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async ({ user, supabase }) => {
    const [stats, projects] = await Promise.all([
      getDashboardStats(supabase, user.id),
      getProjects(supabase, user.id),
    ]);

    // Get recent projects (last 10) with summaries
    const recentProjects = projects.slice(0, 10).map(project => ({
      id: project.id,
      name: project.name,
      hash: project.hash,
      status: project.status,
      organization_id: project.organization_id,
      created_at: project.created_at,
      summary: getProjectSummary(project),
    }));

    return apiSuccess({
      stats,
      recent_projects: recentProjects,
    });
  });
}
