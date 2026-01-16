import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError } from "@/lib/api-auth";
import { addAttachment } from "@/lib/api-db";

const VALID_TYPES = ["figma", "github", "demo", "document", "link"] as const;

/**
 * POST /api/v1/attachments
 * Create a new attachment/link
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const { project_id, milestone_id, label, url, type } = await request.json();

      if (!project_id) {
        return apiError("project_id is required");
      }

      if (!label || typeof label !== "string") {
        return apiError("Label is required");
      }

      const trimmedLabel = label.trim();
      if (!trimmedLabel) {
        return apiError("Label cannot be empty");
      }

      if (!url || typeof url !== "string") {
        return apiError("URL is required");
      }

      const trimmedUrl = url.trim();
      if (!trimmedUrl) {
        return apiError("URL cannot be empty");
      }

      // Validate URL format and protocol to prevent XSS
      try {
        const parsedUrl = new URL(trimmedUrl);
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          return apiError("URL must use http or https protocol");
        }
      } catch {
        return apiError("Invalid URL format");
      }

      const attachmentType = type || "link";
      if (!VALID_TYPES.includes(attachmentType)) {
        return apiError(`Type must be one of: ${VALID_TYPES.join(", ")}`);
      }

      const attachment = await addAttachment(supabase, user.id, project_id, {
        label: trimmedLabel,
        url: trimmedUrl,
        type: attachmentType,
        milestone_id,
      });

      if (!attachment) {
        return apiError("Failed to create attachment. Project not found or unauthorized.", 400);
      }

      return apiSuccess(attachment, 201);
    } catch {
      return apiError("Invalid request");
    }
  });
}
