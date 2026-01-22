import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyTaskOwnership, updateTask, deleteTask } from "@/lib/db";

export async function PATCH(
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
    const { title, description, priority, deadline, milestone_id } = data;

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json({ error: "Invalid title" }, { status: 400 });
      }
      if (title.length > 500) {
        return NextResponse.json({ error: "Title too long" }, { status: 400 });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (priority !== undefined) {
      if (!["low", "medium", "high"].includes(priority)) {
        return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
      }
      updateData.priority = priority;
    }

    if (deadline !== undefined) {
      updateData.deadline = deadline || null;
    }

    if (milestone_id !== undefined) {
      updateData.milestone_id = milestone_id || null;
    }

    const updated = await updateTask(taskId, updateData);
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

    const deleted = await deleteTask(taskId);
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /tasks] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
