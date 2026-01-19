"use client";

import { useState, useEffect } from "react";
import type { Task, TaskPriority, Milestone } from "@/lib/types";

interface TaskModalProps {
  task: Task | null;
  milestones: Milestone[];
  columnId?: string;
  onSave: (data: TaskFormData) => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onClose: () => void;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  deadline: string;
  milestone_id: string;
  column_id?: string;
}

export function TaskModal({
  task,
  milestones,
  columnId,
  onSave,
  onDelete,
  onArchive,
  onClose,
}: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || "medium");
  const [deadline, setDeadline] = useState(task?.deadline?.slice(0, 16) || "");
  const [milestoneId, setMilestoneId] = useState(task?.milestone_id || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setTitle(task?.title || "");
    setDescription(task?.description || "");
    setPriority(task?.priority || "medium");
    setDeadline(task?.deadline?.slice(0, 16) || "");
    setMilestoneId(task?.milestone_id || "");
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      deadline: deadline || "",
      milestone_id: milestoneId,
      column_id: columnId,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">
              {task ? "Edit Task" : "New Task"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-muted hover:text-foreground"
            >
              x
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm text-muted mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                autoFocus
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-muted mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description..."
                rows={3}
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
              />
            </div>

            {/* Priority & Deadline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted mb-1">Deadline</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Milestone */}
            {milestones.length > 0 && (
              <div>
                <label className="block text-sm text-muted mb-1">Milestone</label>
                <select
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                >
                  <option value="">No milestone</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex items-center justify-between">
            <div>
              {task && onDelete && (
                <>
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted">Delete?</span>
                      <button
                        type="button"
                        onClick={onDelete}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="text-sm text-muted hover:text-foreground"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {task && onArchive && (
                <button
                  type="button"
                  onClick={onArchive}
                  className="px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
                >
                  Archive
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-4 py-1.5 text-sm bg-accent text-white rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {task ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
