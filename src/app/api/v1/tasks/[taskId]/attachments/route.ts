import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyTaskOwnership, getTaskAttachments, addTaskAttachment } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    const task = await verifyTaskOwnership(taskId, user);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const attachments = await getTaskAttachments(taskId);
    return NextResponse.json(attachments);
  } catch (error) {
    console.error("[GET /attachments] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;
  const task = await verifyTaskOwnership(taskId, user);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  try {
    const data = await request.json();
    const { type, name, url } = data;

    // Validate type
    if (!type || (type !== "link" && type !== "file")) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Validate name
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (name.length > 255) {
      return NextResponse.json({ error: "Name too long" }, { status: 400 });
    }

    // Validate URL
    if (!url || typeof url !== "string" || url.trim().length === 0) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    if (url.length > 2048) {
      return NextResponse.json({ error: "URL too long" }, { status: 400 });
    }

    // For links, validate URL format
    if (type === "link") {
      try {
        new URL(url);
      } catch {
        return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
      }
    }

    const attachment = await addTaskAttachment(taskId, {
      type,
      name: name.trim(),
      url: url.trim(),
    });

    if (!attachment) {
      return NextResponse.json({ error: "Failed to create attachment" }, { status: 500 });
    }

    return NextResponse.json(attachment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
