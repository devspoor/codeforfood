import { NextRequest, NextResponse } from "next/server";
import { addComment, getCurrentUser, verifyProjectOwnership } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify project ownership before adding comment (pass user to avoid duplicate auth call)
    const project = await verifyProjectOwnership(id, user);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { content, milestone_id } = await request.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    // Limit content length
    if (content.length > 10000) {
      return NextResponse.json({ error: "Content too long" }, { status: 400 });
    }

    const comment = await addComment(id, { content: content.trim(), milestone_id });
    if (!comment) {
      return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
