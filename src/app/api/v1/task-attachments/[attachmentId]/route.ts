import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyTaskAttachmentOwnership, deleteTaskAttachment } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attachmentId } = await params;
    const attachment = await verifyTaskAttachmentOwnership(attachmentId, user);
    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // TODO: If it's a file attachment, also delete from Supabase Storage

    const deleted = await deleteTaskAttachment(attachmentId);
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /task-attachments] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
