import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyTaskOwnership, moveTask } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    if (typeof position !== "number" || position < 0) {
      return NextResponse.json({ error: "Invalid position" }, { status: 400 });
    }

    const updated = await moveTask(taskId, column_id, position);
    if (!updated) {
      return NextResponse.json({ error: "Failed to move" }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
