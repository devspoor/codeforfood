import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyProjectOwnership, getTaskBoardData, addTask, getTaskColumns, createDefaultTaskColumns } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await verifyProjectOwnership(id, user);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let boardData = await getTaskBoardData(id);

  // Create default columns if none exist
  if (boardData.columns.length === 0) {
    await createDefaultTaskColumns(id);
    boardData = await getTaskBoardData(id);
  }

  return NextResponse.json(boardData);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const project = await verifyProjectOwnership(id, user);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const data = await request.json();
    const { title, description, priority, deadline, milestone_id, column_id } = data;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (title.length > 500) {
      return NextResponse.json({ error: "Title too long (max 500 chars)" }, { status: 400 });
    }

    // Get columns to find target column
    let columns = await getTaskColumns(id);
    if (columns.length === 0) {
      columns = await createDefaultTaskColumns(id);
    }

    // Use provided column_id or default to first column
    const targetColumnId = column_id || columns[0]?.id;
    if (!targetColumnId) {
      return NextResponse.json({ error: "No column available" }, { status: 500 });
    }

    // Validate priority
    if (priority && !["low", "medium", "high"].includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    const task = await addTask(id, targetColumnId, {
      title: title.trim(),
      description: description?.trim() || undefined,
      priority: priority || "medium",
      deadline: deadline || undefined,
      milestone_id: milestone_id || undefined,
    });

    if (!task) {
      return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }

    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
