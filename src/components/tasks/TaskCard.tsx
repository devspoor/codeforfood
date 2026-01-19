"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, Milestone } from "@/lib/types";

interface TaskCardProps {
  task: Task;
  milestones?: Milestone[];
  onClick: () => void;
}

const PRIORITY_COLORS = {
  high: "border-t-red-500",
  medium: "border-t-yellow-500",
  low: "border-t-gray-500",
};

export function TaskCard({ task, milestones = [], onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const milestone = milestones.find((m) => m.id === task.milestone_id);

  const isOverdue = task.deadline && new Date(task.deadline) < new Date();
  const isToday = task.deadline && isSameDay(new Date(task.deadline), new Date());
  const isTomorrow = task.deadline && isSameDay(new Date(task.deadline), addDays(new Date(), 1));

  function isSameDay(d1: Date, d2: Date) {
    return d1.toDateString() === d2.toDateString();
  }

  function addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function formatDeadline(deadline: string) {
    const date = new Date(deadline);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        bg-card border border-border rounded-lg p-3 cursor-pointer
        hover:border-accent/50 transition-colors
        border-t-4 ${PRIORITY_COLORS[task.priority]}
        ${isDragging ? "shadow-lg" : ""}
      `}
    >
      <p className="text-sm font-medium line-clamp-2">{task.title}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
        {task.deadline && (
          <span
            className={`
              ${isOverdue ? "text-red-400 bg-red-500/10 px-1 rounded" : ""}
              ${isToday ? "text-orange-400" : ""}
              ${isTomorrow ? "text-yellow-400" : ""}
            `}
          >
            {formatDeadline(task.deadline)}
          </span>
        )}

        {milestone && (
          <span className="text-muted truncate max-w-[120px]">
            {milestone.title}
          </span>
        )}
      </div>
    </div>
  );
}
