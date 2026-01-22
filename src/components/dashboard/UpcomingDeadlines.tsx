"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface UpcomingTask {
  id: string;
  title: string;
  deadline: string;
  priority: "low" | "medium" | "high";
  project_id: string;
  project_name: string;
  column_name: string;
  is_done: boolean;
  is_overdue: boolean;
}

const PRIORITY_COLORS = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-gray-500",
};

export function UpcomingDeadlines() {
  const [tasks, setTasks] = useState<UpcomingTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeadlines() {
      try {
        const res = await fetch("/api/v1/dashboard/upcoming-deadlines");
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchDeadlines();
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Upcoming Deadlines
        </h2>
        <div className="text-sm text-muted text-center py-4">Loading...</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Upcoming Deadlines
        </h2>
        <div className="text-sm text-muted text-center py-6">
          <p>No upcoming deadlines in the next 7 days</p>
        </div>
      </div>
    );
  }

  function formatDeadline(deadline: string) {
    const date = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""} overdue`;
    }
    if (diffDays === 0) {
      return "Today";
    }
    if (diffDays === 1) {
      return "Tomorrow";
    }
    return `In ${diffDays} days`;
  }

  // Filter out completed tasks (in done column)
  const activeTasks = tasks.filter((t) => !t.is_done);
  const overdueTasks = activeTasks.filter((t) => t.is_overdue);
  const upcomingTasks = activeTasks.filter((t) => !t.is_overdue);

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Upcoming Deadlines
        {activeTasks.length > 0 && (
          <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full ml-auto">
            {activeTasks.length}
          </span>
        )}
      </h2>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {/* Overdue tasks first */}
        {overdueTasks.map((task) => (
          <DeadlineItem key={task.id} task={task} formatDeadline={formatDeadline} />
        ))}
        {/* Then upcoming */}
        {upcomingTasks.map((task) => (
          <DeadlineItem key={task.id} task={task} formatDeadline={formatDeadline} />
        ))}
      </div>
    </div>
  );
}

function DeadlineItem({
  task,
  formatDeadline,
}: {
  task: UpcomingTask;
  formatDeadline: (deadline: string) => string;
}) {
  return (
    <Link
      href={`/admin/projects/${task.project_id}/tasks`}
      className={`block p-3 rounded-lg border transition-colors hover:border-accent/30 ${
        task.is_overdue
          ? "bg-red-500/5 border-red-500/20"
          : "bg-background/50 border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Priority indicator */}
        <div
          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
            PRIORITY_COLORS[task.priority]
          }`}
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{task.title}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted">
            <span className="truncate">{task.project_name}</span>
            <span className="text-border">•</span>
            <span className="text-muted/70">{task.column_name}</span>
          </div>
        </div>

        {/* Deadline */}
        <div className="flex-shrink-0 text-right">
          <span
            className={`text-xs font-medium ${
              task.is_overdue ? "text-red-400" : "text-muted"
            }`}
          >
            {formatDeadline(task.deadline)}
          </span>
        </div>
      </div>
    </Link>
  );
}
