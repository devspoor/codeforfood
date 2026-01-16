import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError } from "@/lib/api-auth";
import { addComment } from "@/lib/api-db";

/**
 * POST /api/v1/comments
 * Create a new comment
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const { project_id, milestone_id, content } = await request.json();

      if (!project_id) {
        return apiError("project_id is required");
      }

      if (!content || typeof content !== "string") {
        return apiError("Content is required");
      }

      const trimmedContent = content.trim();
      if (!trimmedContent) {
        return apiError("Content cannot be empty");
      }

      if (trimmedContent.length > 10000) {
        return apiError("Content is too long (max 10000 characters)");
      }

      const comment = await addComment(supabase, user.id, project_id, {
        content: trimmedContent,
        milestone_id,
      });

      if (!comment) {
        return apiError("Failed to create comment. Project not found or unauthorized.", 400);
      }

      return apiSuccess(comment, 201);
    } catch {
      return apiError("Invalid request");
    }
  });
}
