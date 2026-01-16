import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError } from "@/lib/api-auth";
import { getOrganizations, createOrganization } from "@/lib/api-db";
import { validateRequiredString, validateOptionalString, MAX_LENGTHS } from "@/lib/validation";

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

      const nameValidation = validateRequiredString(name, "Name", MAX_LENGTHS.name);
      if (!nameValidation.valid) {
        return apiError(nameValidation.error!);
      }

      const descValidation = validateOptionalString(description, "Description", MAX_LENGTHS.description);
      if (!descValidation.valid) {
        return apiError(descValidation.error!);
      }

      const org = await createOrganization(supabase, user.id, {
        name: name.trim(),
        description: description?.trim()
      });
      if (!org) {
        return apiError("Failed to create organization", 500);
      }

      return apiSuccess(org, 201);
    } catch {
      return apiError("Invalid request");
    }
  });
}
