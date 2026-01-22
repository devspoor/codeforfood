import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TaskBoardData } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;
  const supabase = await createClient();

  // First check if project exists and has public tasks board enabled
  const { data: project } = await supabase
    .from("projects")
    .select("id, tasks_board_public")
    .eq("hash", hash)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.tasks_board_public) {
    return NextResponse.json({ error: "Tasks board is not public" }, { status: 403 });
  }

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
    // Don't include attachments in public view for privacy
  }));

  const data: TaskBoardData = {
    columns: columns || [],
    tasks: tasksWithData,
  };

  return NextResponse.json(data);
}
