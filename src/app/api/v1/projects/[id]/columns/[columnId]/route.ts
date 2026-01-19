import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyTaskColumnOwnership, updateTaskColumn, deleteTaskColumn } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; columnId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, columnId } = await params;
    const column = await verifyTaskColumnOwnership(columnId, user);
    if (!column) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const data = await request.json();
    const { name } = data;

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Invalid name" }, { status: 400 });
      }
      if (name.length > 100) {
        return NextResponse.json({ error: "Name too long" }, { status: 400 });
      }
    }

    const updated = await updateTaskColumn(columnId, { name: name?.trim() });
    if (!updated) {
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; columnId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, columnId } = await params;
  const column = await verifyTaskColumnOwnership(columnId, user);
  if (!column) {
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }

  if (column.is_system) {
    return NextResponse.json({ error: "Cannot delete system column" }, { status: 400 });
  }

  const deleted = await deleteTaskColumn(columnId, id);
  if (!deleted) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
