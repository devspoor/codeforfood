import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { moveTask } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string; taskId: string }> }
) {
  const { hash, taskId } = await params;
  const supabase = await createClient();

  // Verify project is public and editable
  const { data: project } = await supabase
    .from("projects")
    .select("id, tasks_board_public, tasks_board_editable")
    .eq("hash", hash)
    .single();

  if (!project || !project.tasks_board_public || !project.tasks_board_editable) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify task belongs to project
  const { data: task } = await supabase
    .from("tasks")
    .select("id, project_id")
    .eq("id", taskId)
    .eq("project_id", project.id)
    .single();

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  try {
    const data = await request.json();
    const { column_id, position } = data;

    if (!column_id) {
      return NextResponse.json({ error: "column_id required" }, { status: 400 });
    }

    if (typeof position !== "number" || !Number.isFinite(position) || !Number.isInteger(position) || position < 0 || position > 10000) {
      return NextResponse.json({ error: "Invalid position" }, { status: 400 });
    }

    // Verify column belongs to the same project
    const { data: column } = await supabase
      .from("task_columns")
      .select("id, project_id")
      .eq("id", column_id)
      .eq("project_id", project.id)
      .single();

    if (!column) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
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
