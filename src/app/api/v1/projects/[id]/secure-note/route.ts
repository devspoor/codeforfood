import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { withAuth, apiSuccess, apiError, apiNotFound } from "@/lib/api-auth";
import { setSecureNote, deleteSecureNote, verifyProjectOwnership } from "@/lib/api-db";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/projects/[id]/secure-note
 * Check if secure note exists
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const { data: project } = await supabase
      .from("projects")
      .select("secure_note_encrypted, organizations!inner(user_id)")
      .eq("id", id)
      .eq("organizations.user_id", user.id)
      .single();

    if (!project) {
      return apiNotFound("Project");
    }

    return apiSuccess({
      has_secure_note: !!project.secure_note_encrypted,
    });
  });
}

/**
 * POST /api/v1/projects/[id]/secure-note
 * Create or update secure note
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const project = await verifyProjectOwnership(supabase, user.id, id);
      if (!project) {
        return apiNotFound("Project");
      }

      const { encrypted_note, password } = await request.json();

      if (!encrypted_note || !password) {
        return apiError("encrypted_note and password are required");
      }

      if (password.length < 4) {
        return apiError("Password must be at least 4 characters");
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const success = await setSecureNote(supabase, user.id, id, encrypted_note, passwordHash);

      if (!success) {
        return apiError("Failed to save secure note", 500);
      }

      return apiSuccess({ success: true });
    } catch {
      return apiError("Invalid request");
    }
  });
}

/**
 * DELETE /api/v1/projects/[id]/secure-note
 * Delete secure note
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const project = await verifyProjectOwnership(supabase, user.id, id);
    if (!project) {
      return apiNotFound("Project");
    }

    const success = await deleteSecureNote(supabase, user.id, id);
    if (!success) {
      return apiError("Failed to delete secure note", 500);
    }

    return apiSuccess({ success: true });
  });
}
