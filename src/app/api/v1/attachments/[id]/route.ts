import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiNotFound } from "@/lib/api-auth";
import { getAttachmentById, deleteAttachment } from "@/lib/api-db";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/attachments/[id]
 * Get attachment by ID
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const attachment = await getAttachmentById(supabase, user.id, id);
    if (!attachment) {
      return apiNotFound("Attachment");
    }

    return apiSuccess(attachment);
  });
}

/**
 * DELETE /api/v1/attachments/[id]
 * Delete attachment
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const deleted = await deleteAttachment(supabase, user.id, id);
    if (!deleted) {
      return apiNotFound("Attachment");
    }

    return apiSuccess({ success: true });
  });
}
