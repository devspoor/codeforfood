import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addTask, getTaskColumns, createDefaultTaskColumns } from "@/lib/db";

async function getPublicProject(hash: string) {
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, tasks_board_public, tasks_board_editable")
    .eq("hash", hash)
    .single();

  if (!project) return null;
  if (!project.tasks_board_public) return null;
  return project;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;
  const project = await getPublicProject(hash);

  if (!project) {
    return NextResponse.json({ error: "Not found or not public" }, { status: 404 });
  }

  const supabase = await createClient();

  // Fetch columns
  const { data: columns } = await supabase
    .from("task_columns")
    .select("*")
    .eq("project_id", project.id)
    .order("position", { ascending: true });

  // Fetch non-archived tasks only for public view
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", project.id)
    .eq("is_archived", false)
    .order("position", { ascending: true });

  const taskIds = (tasks || []).map(t => t.id);

  // Fetch checklists with items for all tasks
  let checklists: Array<{ id: string; task_id: string; name: string; position: number; created_at: string; items?: Array<{ id: string; checklist_id: string; text: string; is_completed: boolean; position: number; created_at: string }> }> = [];

  if (taskIds.length > 0) {
    const { data: checklistsData } = await supabase
      .from("task_checklists")
      .select("*")
      .in("task_id", taskIds)
      .order("position", { ascending: true });

    if (checklistsData && checklistsData.length > 0) {
      const checklistIds = checklistsData.map(c => c.id);
      const { data: itemsData } = await supabase
        .from("task_checklist_items")
        .select("*")
        .in("checklist_id", checklistIds)
        .order("position", { ascending: true });

      checklists = checklistsData.map(checklist => ({
        ...checklist,
        items: (itemsData || []).filter(item => item.checklist_id === checklist.id),
      }));
    }
  }

  // Merge checklists into tasks
  const tasksWithData = (tasks || []).map(task => ({
    ...task,
    checklists: checklists.filter(c => c.task_id === task.id),
  }));

  return NextResponse.json({
    columns: columns || [],
    tasks: tasksWithData,
    editable: !!project.tasks_board_editable,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;
  const project = await getPublicProject(hash);

  if (!project) {
    return NextResponse.json({ error: "Not found or not public" }, { status: 404 });
  }

  if (!project.tasks_board_editable) {
    return NextResponse.json({ error: "Editing not allowed" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const { title, description, priority, column_id } = data;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (title.length > 500) {
      return NextResponse.json({ error: "Title too long" }, { status: 400 });
    }
    if (priority && !["low", "medium", "high"].includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    let columns = await getTaskColumns(project.id);
    if (columns.length === 0) {
      columns = await createDefaultTaskColumns(project.id);
    }

    let targetColumnId = columns[0]?.id;
    if (column_id) {
      const columnExists = columns.some((c) => c.id === column_id);
      if (!columnExists) {
        return NextResponse.json({ error: "Column not found" }, { status: 400 });
      }
      targetColumnId = column_id;
    }
    if (!targetColumnId) {
      return NextResponse.json({ error: "No column available" }, { status: 500 });
    }

    const task = await addTask(project.id, targetColumnId, {
      title: title.trim(),
      description: description?.trim() || undefined,
      priority: priority || "medium",
    });

    if (!task) {
      return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }

    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
