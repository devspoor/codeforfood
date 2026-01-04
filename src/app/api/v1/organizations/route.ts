import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError } from "@/lib/api-auth";
import { getOrganizations, createOrganization } from "@/lib/api-db";

/**
 * GET /api/v1/organizations
 * Get all organizations for current user
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async ({ user, supabase }) => {
    const orgs = await getOrganizations(supabase, user.id);
    return apiSuccess(orgs);
  });
}

/**
 * POST /api/v1/organizations
 * Create a new organization
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const { name, description } = await request.json();

      if (!name || typeof name !== "string") {
        return apiError("Name is required");
      }

      const org = await createOrganization(supabase, user.id, { name, description });
      if (!org) {
        return apiError("Failed to create organization", 500);
      }

      return apiSuccess(org, 201);
    } catch {
      return apiError("Invalid request");
    }
  });
}
