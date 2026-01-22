import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyChecklistOwnership, addChecklistItem } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ checklistId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { checklistId } = await params;
  const checklist = await verifyChecklistOwnership(checklistId, user);
  if (!checklist) {
    return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
  }

  try {
    const data = await request.json();
    const { text } = data;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (text.length > 500) {
      return NextResponse.json({ error: "Text too long" }, { status: 400 });
    }

    const item = await addChecklistItem(checklistId, text.trim());
    if (!item) {
      return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
    }

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
