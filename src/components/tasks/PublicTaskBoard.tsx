"use client";

import { useState, useEffect, useRef } from "react";
import type { Task, TaskColumn, TaskBoardData, TaskChecklist } from "@/lib/types";

interface PublicTaskBoardProps {
  hash: string;
}

const PRIORITY_COLORS = {
  high: "border-t-red-500",
  medium: "border-t-yellow-500",
  low: "border-t-gray-500",
};

export function PublicTaskBoard({ hash }: PublicTaskBoardProps) {
  const [data, setData] = useState<TaskBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch(`/api/public/projects/${hash}/tasks`);
        if (!res.ok) {
          if (res.status === 403) {
            setError("Tasks board is not available");
          } else {
            setError("Failed to load tasks");
          }
          return;
        }
        const result = await res.json();
        setData(result);
      } catch {
        setError("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [hash]);

  // Track scroll position for mobile indicator
  const columnsLength = data?.columns.length ?? 0;
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || columnsLength === 0) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const columnWidth = container.firstElementChild?.clientWidth || 288;
      const gap = 16;
      const index = Math.round(scrollLeft / (columnWidth + gap));
      setActiveColumnIndex(Math.min(index, columnsLength - 1));
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [columnsLength]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-muted text-sm">Loading tasks...</div>
      </div>
    );
  }

  if (error || !data) {
    return null; // Silently hide if not available
  }

  const sortedColumns = [...data.columns].sort((a, b) => {
    if (a.is_done_column) return 1;
    if (b.is_done_column) return -1;
    return a.position - b.position;
  });

  const getTasksByColumn = (columnId: string) =>
    data.tasks.filter((t) => t.column_id === columnId).sort((a, b) => a.position - b.position);

  return (
    <div>
      {/* Scrollable columns */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:snap-none scroll-smooth"
      >
        {sortedColumns.map((column) => (
          <PublicColumn
            key={column.id}
            column={column}
            tasks={getTasksByColumn(column.id)}
            onTaskClick={setSelectedTask}
          />
        ))}
      </div>

      {/* Mobile scroll indicator dots */}
      <div className="flex justify-center gap-1.5 py-2 sm:hidden">
        {sortedColumns.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              const container = scrollContainerRef.current;
              if (!container) return;
              const columnWidth = container.firstElementChild?.clientWidth || 288;
              const gap = 16;
              container.scrollTo({
                left: index * (columnWidth + gap),
                behavior: "smooth",
              });
            }}
            className={`w-2 h-2 rounded-full transition-colors ${
              activeColumnIndex === index ? "bg-accent" : "bg-border"
            }`}
            aria-label={`Go to column ${index + 1}`}
          />
        ))}
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <PublicTaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}

function PublicColumn({
  column,
  tasks,
  onTaskClick,
}: {
  column: TaskColumn;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  return (
    <div className="flex-shrink-0 w-[85vw] sm:w-72 bg-card border border-border rounded-lg flex flex-col max-h-[400px] snap-center sm:snap-align-none">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center gap-2">
        <h3 className="font-medium text-sm">{column.name}</h3>
        <span className="text-xs text-muted bg-muted/10 px-1.5 py-0.5 rounded">
          {tasks.length}
        </span>
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {tasks.map((task) => (
          <PublicTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-muted text-center py-4">No tasks</p>
        )}
      </div>
    </div>
  );
}

function PublicTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const checklists = task.checklists || [];
  const totalItems = checklists.reduce((sum, c) => sum + (c.items?.length || 0), 0);
  const completedItems = checklists.reduce(
    (sum, c) => sum + (c.items?.filter((i) => i.is_completed).length || 0),
    0
  );

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
      onClick={onClick}
      className={`
        bg-background border border-border rounded-lg p-3 cursor-pointer
        hover:border-accent/50 transition-colors
        border-t-4 ${PRIORITY_COLORS[task.priority]}
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            {completedItems}/{totalItems}
          </span>
        )}

        {/* Deadline */}
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
      </div>
    </div>
  );
}

function PublicTaskModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const checklists = task.checklists || [];
  const attachments = task.attachments || [];

  const isOverdue = task.deadline && new Date(task.deadline) < new Date();

  const getAttachmentIcon = (attachment: { type: string; name: string; url: string }) => {
    if (attachment.type === "file") {
      const ext = attachment.name.split(".").pop()?.toLowerCase();
      if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) return "🖼️";
      if (["pdf"].includes(ext || "")) return "📄";
      if (["doc", "docx"].includes(ext || "")) return "📝";
      return "📎";
    }
    const url = attachment.url.toLowerCase();
    if (url.includes("figma.com")) return "🎨";
    if (url.includes("github.com")) return "🐙";
    if (url.includes("notion.so") || url.includes("notion.com")) return "📓";
    return "🔗";
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-t-xl sm:rounded-lg w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Task Details</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Title */}
          <h3 className="text-lg font-medium">{task.title}</h3>

          {/* Description */}
          {task.description && (
            <div>
              <label className="block text-sm text-muted mb-1">Description</label>
              <p className="text-sm whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Priority & Deadline */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted">Priority: </span>
              <span className={`capitalize ${
                task.priority === "high" ? "text-red-400" :
                task.priority === "medium" ? "text-yellow-400" : "text-muted"
              }`}>
                {task.priority}
              </span>
            </div>

            {task.deadline && (
              <div>
                <span className="text-muted">Deadline: </span>
                <span className={isOverdue ? "text-red-400" : ""}>
                  {new Date(task.deadline).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Checklists */}
          {checklists.length > 0 && (
            <div>
              <label className="block text-sm text-muted mb-2">Checklists</label>
              <div className="space-y-3">
                {checklists.map((checklist) => (
                  <PublicChecklist key={checklist.id} checklist={checklist} />
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div>
              <label className="block text-sm text-muted mb-2">Attachments</label>
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 bg-background/50 rounded px-3 py-2"
                  >
                    <span className="text-sm">{getAttachmentIcon(attachment)}</span>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-sm text-accent hover:text-accent-hover truncate"
                    >
                      {attachment.name}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function PublicChecklist({ checklist }: { checklist: TaskChecklist }) {
  const items = checklist.items || [];
  const completedCount = items.filter((i) => i.is_completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="bg-background/50 rounded-lg p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">{checklist.name}</h4>
        <span className="text-xs text-muted">
          {completedCount}/{items.length}
        </span>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="h-1.5 bg-border rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-success transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Items */}
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                item.is_completed
                  ? "bg-success border-success text-white"
                  : "border-border"
              }`}
            >
              {item.is_completed && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${item.is_completed ? "text-muted line-through" : ""}`}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
