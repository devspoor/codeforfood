import { NextRequest, NextResponse } from "next/server";
import { updateComment, deleteComment, getCurrentUser, verifyCommentOwnership } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { commentId } = await params;

    // Verify comment ownership before modifying (pass user to avoid duplicate auth call)
    const ownership = await verifyCommentOwnership(commentId, user);
    if (!ownership) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    if (content.length > 10000) {
      return NextResponse.json({ error: "Content too long" }, { status: 400 });
    }

    const comment = await updateComment(commentId, content.trim());
    if (!comment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(comment);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { commentId } = await params;

  // Verify comment ownership before deleting (pass user to avoid duplicate auth call)
  const ownership = await verifyCommentOwnership(commentId, user);
  if (!ownership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const deleted = await deleteComment(commentId);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
