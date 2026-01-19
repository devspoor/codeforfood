"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Task, TaskColumn, Milestone } from "@/lib/types";
import { TaskBoard } from "./TaskBoard";

interface FullScreenTaskBoardProps {
  projectId: string;
  columns: TaskColumn[];
  tasks: Task[];
  milestones: Milestone[];
}

export function FullScreenTaskBoard({
  projectId,
  columns,
  tasks: initialTasks,
  milestones,
}: FullScreenTaskBoardProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [showArchived, setShowArchived] = useState(false);

  const activeTasks = tasks.filter((t) => !t.is_archived);
  const archivedTasks = tasks.filter((t) => t.is_archived);
  const archivedCount = archivedTasks.length;

  const handleRestore = async (taskId: string) => {
    const res = await fetch(`/api/v1/tasks/${taskId}/restore`, {
      method: "POST",
    });

    if (res.ok) {
      const restored = await res.json();
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? restored : t))
      );
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Archive Toggle */}
      <div className="flex justify-end">
        {archivedCount > 0 && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`text-sm px-3 py-1.5 rounded border transition-colors ${
              showArchived
                ? "border-accent text-accent"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {showArchived ? "Hide" : "Show"} Archived ({archivedCount})
          </button>
        )}
      </div>

      {/* Main Task Board */}
      <div className="min-h-[calc(100vh-250px)]">
        <TaskBoard
          projectId={projectId}
          columns={columns}
          tasks={activeTasks}
          milestones={milestones}
        />
      </div>

      {/* Archived Tasks Section */}
      {showArchived && archivedCount > 0 && (
        <div className="border-t border-border pt-8">
          <h2 className="text-lg font-semibold mb-4 text-muted">
            Archived Tasks ({archivedCount})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {archivedTasks.map((task) => (
              <ArchivedTaskCard
                key={task.id}
                task={task}
                onRestore={() => handleRestore(task.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ArchivedTaskCard({
  task,
  onRestore,
}: {
  task: Task;
  onRestore: () => void;
}) {
  const [restoring, setRestoring] = useState(false);

  const handleRestore = async () => {
    setRestoring(true);
    await onRestore();
    setRestoring(false);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3 opacity-60">
      <p className="text-sm font-medium line-clamp-2">{task.title}</p>
      {task.description && (
        <p className="text-xs text-muted mt-1 line-clamp-2">{task.description}</p>
      )}
      <button
        onClick={handleRestore}
        disabled={restoring}
        className="mt-3 text-xs text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
      >
        {restoring ? "Restoring..." : "Restore"}
      </button>
    </div>
  );
}
