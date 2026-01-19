import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectById, getTaskBoardData, createDefaultTaskColumns } from "@/lib/db";
import { FullScreenTaskBoard } from "@/components/tasks/FullScreenTaskBoard";

export const dynamic = "force-dynamic";

export default async function FullScreenTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  // Fetch or initialize task board
  let taskBoardData = await getTaskBoardData(project.id);
  if (taskBoardData.columns.length === 0) {
    await createDefaultTaskColumns(project.id);
    taskBoardData = await getTaskBoardData(project.id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href={`/admin/projects/${project.id}`}
            className="text-muted hover:text-foreground transition-colors text-sm"
          >
            &larr; Back to {project.name}
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold mt-2">Tasks</h1>
        </div>
      </div>

      {/* Full Screen Task Board */}
      <FullScreenTaskBoard
        projectId={project.id}
        columns={taskBoardData.columns}
        tasks={taskBoardData.tasks}
        milestones={project.milestones || []}
      />
    </div>
  );
}
