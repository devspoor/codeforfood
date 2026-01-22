"use client";

import { useState, useEffect } from "react";
import type { Task, TaskPriority, Milestone } from "@/lib/types";
import { ChecklistEditor } from "./ChecklistEditor";
import { AttachmentManager } from "./AttachmentManager";

interface TaskModalProps {
  task: Task | null;
  milestones: Milestone[];
  columnId?: string;
  mode?: "view" | "edit";
  onSave: (data: TaskFormData) => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onClose: () => void;
  onRefresh?: () => void;
  onEditClick?: () => void;
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
  mode = "edit",
  onSave,
  onDelete,
  onArchive,
  onClose,
  onRefresh,
  onEditClick,
}: TaskModalProps) {
  const isViewMode = mode === "view" && task;
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || "medium");
  const [deadline, setDeadline] = useState(task?.deadline?.slice(0, 16) || "");
  const [milestoneId, setMilestoneId] = useState(task?.milestone_id || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "checklists" | "attachments">("details");

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

  const handleChecklistChange = () => {
    onRefresh?.();
  };

  const handleAttachmentChange = () => {
    onRefresh?.();
  };

  const checklists = task?.checklists || [];
  const attachments = task?.attachments || [];

  // Count for tab badges
  const checklistItemsCount = checklists.reduce((sum, c) => sum + (c.items?.length || 0), 0);
  const completedItemsCount = checklists.reduce(
    (sum, c) => sum + (c.items?.filter(i => i.is_completed).length || 0),
    0
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-card border border-border rounded-t-xl sm:rounded-lg w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">
              {isViewMode ? "Task Details" : task ? "Edit Task" : "New Task"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-muted hover:text-foreground"
            >
              ✕
            </button>
          </div>

          {/* Tabs (only for existing tasks) */}
          {task && (
            <div className="flex border-b border-border">
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "details"
                    ? "text-accent border-b-2 border-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("checklists")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "checklists"
                    ? "text-accent border-b-2 border-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Checklists
                {checklistItemsCount > 0 && (
                  <span className="ml-1 text-xs">
                    ({completedItemsCount}/{checklistItemsCount})
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("attachments")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "attachments"
                    ? "text-accent border-b-2 border-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Attachments
                {attachments.length > 0 && (
                  <span className="ml-1 text-xs">({attachments.length})</span>
                )}
              </button>
            </div>
          )}

          {/* Body */}
          <div className="p-4">
            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-4">
                {isViewMode ? (
                  /* View Mode */
                  <>
                    {/* Title */}
                    <div>
                      <h3 className="text-lg font-medium">{task.title}</h3>
                    </div>

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
                          <span className={new Date(task.deadline) < new Date() ? "text-red-400" : ""}>
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

                    {/* Milestone */}
                    {task.milestone_id && milestones.length > 0 && (
                      <div className="text-sm">
                        <span className="text-muted">Milestone: </span>
                        <span>{milestones.find(m => m.id === task.milestone_id)?.title || "Unknown"}</span>
                      </div>
                    )}
                  </>
                ) : (
                  /* Edit Mode */
                  <>
                    {/* Title */}
                    <div>
                      <label className="block text-sm text-muted mb-1">Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Task title..."
                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                        autoFocus={!task}
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
                  </>
                )}
              </div>
            )}

            {/* Checklists Tab */}
            {activeTab === "checklists" && task && (
              <ChecklistEditor
                taskId={task.id}
                checklists={checklists}
                readOnly={!!isViewMode}
                onChange={handleChecklistChange}
              />
            )}

            {/* Attachments Tab */}
            {activeTab === "attachments" && task && (
              <AttachmentManager
                taskId={task.id}
                attachments={attachments}
                readOnly={!!isViewMode}
                onChange={handleAttachmentChange}
              />
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex items-center justify-between">
            {isViewMode ? (
              /* View Mode Footer */
              <>
                <div />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
                  >
                    Close
                  </button>
                  {onEditClick && (
                    <button
                      type="button"
                      onClick={onEditClick}
                      className="px-4 py-1.5 text-sm bg-accent text-white rounded hover:bg-accent-hover transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* Edit Mode Footer */
              <>
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
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
