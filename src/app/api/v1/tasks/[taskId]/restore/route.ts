import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyTaskOwnership, restoreTask } from "@/lib/db";

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

  const restored = await restoreTask(taskId);
  if (!restored) {
    return NextResponse.json({ error: "Failed to restore" }, { status: 500 });
  }

  return NextResponse.json(restored);
}
