import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError } from "@/lib/api-auth";
import { getProfile, updateProfile } from "@/lib/api-db";

/**
 * GET /api/v1/profile
 * Get current user profile
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async ({ user, supabase }) => {
    const profile = await getProfile(supabase, user.id);

    return apiSuccess({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      ...profile,
    });
  });
}

/**
 * PATCH /api/v1/profile
 * Update current user profile
 */
export async function PATCH(request: NextRequest) {
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const { name, avatar_url } = await request.json();

      const profile = await updateProfile(supabase, user.id, { name, avatar_url });
      if (!profile) {
        return apiError("Failed to update profile", 500);
      }

      return apiSuccess({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        ...profile,
      });
    } catch {
      return apiError("Invalid request");
    }
  });
}
