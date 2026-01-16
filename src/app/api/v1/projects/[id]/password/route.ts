import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { withAuth, apiSuccess, apiError, apiNotFound } from "@/lib/api-auth";
import { setProjectPassword, verifyProjectOwnership } from "@/lib/api-db";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/projects/[id]/password
 * Set project password protection
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const project = await verifyProjectOwnership(supabase, user.id, id);
      if (!project) {
        return apiNotFound("Project");
      }

      const { password } = await request.json();

      if (!password || typeof password !== "string" || password.length < 12) {
        return apiError("Password must be at least 12 characters");
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const success = await setProjectPassword(supabase, user.id, id, passwordHash);

      if (!success) {
        return apiError("Failed to set password", 500);
      }

      return apiSuccess({ success: true });
    } catch {
      return apiError("Invalid request");
    }
  });
}

/**
 * DELETE /api/v1/projects/[id]/password
 * Remove project password protection
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const project = await verifyProjectOwnership(supabase, user.id, id);
    if (!project) {
      return apiNotFound("Project");
    }

    const success = await setProjectPassword(supabase, user.id, id, null);
    if (!success) {
      return apiError("Failed to remove password", 500);
    }

    return apiSuccess({ success: true });
  });
}
