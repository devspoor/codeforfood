import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateTask, deleteTask } from "@/lib/db";

async function getPublicProjectAndTask(hash: string, taskId: string) {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, tasks_board_public, tasks_board_editable")
    .eq("hash", hash)
    .single();

  if (!project || !project.tasks_board_public || !project.tasks_board_editable) return null;

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("project_id", project.id)
    .single();

  if (!task) return null;

  return { project, task };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string; taskId: string }> }
) {
  const { hash, taskId } = await params;
  const result = await getPublicProjectAndTask(hash, taskId);

  if (!result) {
    return NextResponse.json({ error: "Not found or editing not allowed" }, { status: 404 });
  }

  try {
    const data = await request.json();
    const { title, description, priority } = data;

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
  { params }: { params: Promise<{ hash: string; taskId: string }> }
) {
  const { hash, taskId } = await params;
  const result = await getPublicProjectAndTask(hash, taskId);

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const deleted = await deleteTask(taskId);
  if (!deleted) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
