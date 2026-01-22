import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyChecklistItemOwnership, updateChecklistItem, deleteChecklistItem } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId } = await params;
  const item = await verifyChecklistItemOwnership(itemId, user);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  try {
    const data = await request.json();
    const { text, is_completed, position } = data;

    const updateData: { text?: string; is_completed?: boolean; position?: number } = {};

    if (text !== undefined) {
      if (typeof text !== "string" || text.trim().length === 0) {
        return NextResponse.json({ error: "Invalid text" }, { status: 400 });
      }
      if (text.length > 500) {
        return NextResponse.json({ error: "Text too long" }, { status: 400 });
      }
      updateData.text = text.trim();
    }

    if (is_completed !== undefined) {
      if (typeof is_completed !== "boolean") {
        return NextResponse.json({ error: "Invalid is_completed" }, { status: 400 });
      }
      updateData.is_completed = is_completed;
    }

    if (position !== undefined) {
      if (typeof position !== "number" || position < 0) {
        return NextResponse.json({ error: "Invalid position" }, { status: 400 });
      }
      updateData.position = position;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await updateChecklistItem(itemId, updateData);
    if (!updated) {
      return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await params;
    const item = await verifyChecklistItemOwnership(itemId, user);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const deleted = await deleteChecklistItem(itemId);
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /checklist-items] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
