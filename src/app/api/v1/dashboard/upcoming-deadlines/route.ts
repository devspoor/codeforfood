import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Get date range: now to 7 days from now
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  // Get all projects owned by user
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id")
    .eq("user_id", user.id);

  if (!orgs || orgs.length === 0) {
    return NextResponse.json([]);
  }

  const orgIds = orgs.map((o) => o.id);

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .in("organization_id", orgIds);

  if (!projects || projects.length === 0) {
    return NextResponse.json([]);
  }

  const projectIds = projects.map((p) => p.id);
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  // Get tasks with deadlines in the next 7 days
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, deadline, priority, project_id, column_id, is_archived")
    .in("project_id", projectIds)
    .eq("is_archived", false)
    .not("deadline", "is", null)
    .lte("deadline", sevenDaysFromNow.toISOString())
    .order("deadline", { ascending: true });

  if (!tasks || tasks.length === 0) {
    return NextResponse.json([]);
  }

  // Get column names
  const columnIds = [...new Set(tasks.map((t) => t.column_id))];
  const { data: columns } = await supabase
    .from("task_columns")
    .select("id, name, is_done_column")
    .in("id", columnIds);

  const columnMap = new Map(columns?.map((c) => [c.id, { name: c.name, isDone: c.is_done_column }]) || []);

  // Format response with project name and column info
  const upcomingTasks = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    deadline: task.deadline,
    priority: task.priority,
    project_id: task.project_id,
    project_name: projectMap.get(task.project_id) || "Unknown",
    column_name: columnMap.get(task.column_id)?.name || "Unknown",
    is_done: columnMap.get(task.column_id)?.isDone || false,
    is_overdue: new Date(task.deadline) < now,
  }));

  return NextResponse.json(upcomingTasks);
}
