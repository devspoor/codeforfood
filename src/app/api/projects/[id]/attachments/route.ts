import { NextRequest, NextResponse } from "next/server";
import { addAttachment, getCurrentUser, verifyProjectOwnership } from "@/lib/db";

const VALID_TYPES = ["figma", "github", "demo", "document", "link"] as const;

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

    // Verify project ownership before adding attachment (pass user to avoid duplicate auth call)
    const project = await verifyProjectOwnership(id, user);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { label, url, type = "link", milestone_id } = await request.json();

    if (!label || !label.trim()) {
      return NextResponse.json({ error: "Label required" }, { status: 400 });
    }

    if (!url || !url.trim()) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid attachment type" }, { status: 400 });
    }

    const attachment = await addAttachment(id, {
      label: label.trim(),
      url: url.trim(),
      type,
      milestone_id,
    });

    if (!attachment) {
      return NextResponse.json({ error: "Failed to add attachment" }, { status: 500 });
    }

    return NextResponse.json(attachment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
