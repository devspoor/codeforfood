"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Task, TaskColumn as TaskColumnType, Milestone } from "@/lib/types";
import { TaskCard } from "./TaskCard";

interface TaskColumnProps {
  column: TaskColumnType;
  tasks: Task[];
  milestones: Milestone[];
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string) => void;
}

export function TaskColumn({ column, tasks, milestones, onTaskClick, onAddTask }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      className={`
        flex-shrink-0 w-72 bg-background border border-border rounded-lg
        flex flex-col max-h-[calc(100vh-200px)]
        ${isOver ? "border-accent" : ""}
      `}
    >
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{column.name}</h3>
          <span className="text-xs text-muted bg-muted/10 px-1.5 py-0.5 rounded">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="text-muted hover:text-foreground transition-colors text-lg"
        >
          +
        </button>
      </div>

      {/* Tasks */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-2 space-y-2"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              milestones={milestones}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <p className="text-xs text-muted text-center py-4">
            No tasks
          </p>
        )}
      </div>
    </div>
  );
}
