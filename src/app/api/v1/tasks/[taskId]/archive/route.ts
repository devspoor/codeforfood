import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyTaskOwnership, archiveTask } from "@/lib/db";

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

  const archived = await archiveTask(taskId);
  if (!archived) {
    return NextResponse.json({ error: "Failed to archive" }, { status: 500 });
  }

  return NextResponse.json(archived);
}
