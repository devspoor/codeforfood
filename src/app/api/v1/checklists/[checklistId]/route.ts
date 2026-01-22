import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyChecklistOwnership, updateTaskChecklist, deleteTaskChecklist } from "@/lib/db";

export async function PATCH(
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
    const { name, position } = data;

    const updateData: { name?: string; position?: number } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Invalid name" }, { status: 400 });
      }
      if (name.length > 200) {
        return NextResponse.json({ error: "Name too long" }, { status: 400 });
      }
      updateData.name = name.trim();
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

    const updated = await updateTaskChecklist(checklistId, updateData);
    if (!updated) {
      return NextResponse.json({ error: "Failed to update checklist" }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ checklistId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { checklistId } = await params;
    const checklist = await verifyChecklistOwnership(checklistId, user);
    if (!checklist) {
      return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
    }

    const deleted = await deleteTaskChecklist(checklistId);
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete checklist" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /checklists] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
