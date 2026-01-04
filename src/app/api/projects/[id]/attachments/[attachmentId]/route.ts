import { NextRequest, NextResponse } from "next/server";
import { deleteAttachment, getCurrentUser, verifyAttachmentOwnership } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { attachmentId } = await params;

  // Verify attachment ownership before deleting (pass user to avoid duplicate auth call)
  const ownership = await verifyAttachmentOwnership(attachmentId, user);
  if (!ownership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const deleted = await deleteAttachment(attachmentId);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
