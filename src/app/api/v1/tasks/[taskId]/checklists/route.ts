import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyTaskOwnership, getTaskChecklists, addTaskChecklist } from "@/lib/db";

export async function GET(
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

    const checklists = await getTaskChecklists(taskId);
    return NextResponse.json(checklists);
  } catch (error) {
    console.error("[GET /checklists] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

  try {
    const data = await request.json();
    const { name } = data;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (name.length > 200) {
      return NextResponse.json({ error: "Name too long" }, { status: 400 });
    }

    const checklist = await addTaskChecklist(taskId, name.trim());
    if (!checklist) {
      return NextResponse.json({ error: "Failed to create checklist" }, { status: 500 });
    }

    return NextResponse.json(checklist, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
