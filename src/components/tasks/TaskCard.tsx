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

  // Checklist stats
  const checklists = task.checklists || [];
  const totalItems = checklists.reduce((sum, c) => sum + (c.items?.length || 0), 0);
  const completedItems = checklists.reduce(
    (sum, c) => sum + (c.items?.filter(i => i.is_completed).length || 0),
    0
  );

  // Attachment count
  const attachmentCount = task.attachments?.length || 0;

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
        {/* Checklist indicator */}
        {totalItems > 0 && (
          <span
            className={`flex items-center gap-1 ${
              completedItems === totalItems ? "text-success" : ""
            }`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {completedItems}/{totalItems}
          </span>
        )}

        {/* Attachment indicator */}
        {attachmentCount > 0 && (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {attachmentCount}
          </span>
        )}

        {/* Deadline */}
        {task.deadline && (
          <span
            className={`
              ${isOverdue ? "text-danger bg-danger/10 px-1 rounded" : ""}
              ${isToday ? "text-accent" : ""}
              ${isTomorrow ? "text-muted" : ""}
            `}
          >
            {formatDeadline(task.deadline)}
          </span>
        )}

        {/* Milestone */}
        {milestone && (
          <span className="text-muted truncate max-w-[100px]">
            {milestone.title}
          </span>
        )}
      </div>
    </div>
  );
}
