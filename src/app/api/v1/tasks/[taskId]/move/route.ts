import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyTaskOwnership, verifyTaskColumnOwnership, moveTask } from "@/lib/db";

export async function POST(
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

    const data = await request.json();
    const { column_id, position } = data;

    if (!column_id) {
      return NextResponse.json({ error: "column_id required" }, { status: 400 });
    }

    // Validate position is a valid integer
    if (typeof position !== "number" || !Number.isFinite(position) || !Number.isInteger(position) || position < 0 || position > 10000) {
      return NextResponse.json({ error: "Invalid position" }, { status: 400 });
    }

    // Verify column belongs to the same project as the task
    const column = await verifyTaskColumnOwnership(column_id, user);
    if (!column) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }
    if (column.project_id !== task.project_id) {
      return NextResponse.json({ error: "Column belongs to different project" }, { status: 400 });
    }

    const updated = await moveTask(taskId, column_id, position);
    if (!updated) {
      return NextResponse.json({ error: "Failed to move" }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[POST /tasks/move] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
