import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError, apiNotFound } from "@/lib/api-auth";
import { getCommentById, updateComment, deleteComment } from "@/lib/api-db";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/comments/[id]
 * Get comment by ID
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const comment = await getCommentById(supabase, user.id, id);
    if (!comment) {
      return apiNotFound("Comment");
    }

    return apiSuccess(comment);
  });
}

/**
 * PATCH /api/v1/comments/[id]
 * Update comment
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const { content } = await request.json();

      if (!content || typeof content !== "string") {
        return apiError("Content is required");
      }

      const comment = await updateComment(supabase, user.id, id, content);
      if (!comment) {
        return apiNotFound("Comment");
      }

      return apiSuccess(comment);
    } catch {
      return apiError("Invalid request");
    }
  });
}

/**
 * DELETE /api/v1/comments/[id]
 * Delete comment
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const deleted = await deleteComment(supabase, user.id, id);
    if (!deleted) {
      return apiNotFound("Comment");
    }

    return apiSuccess({ success: true });
  });
}
