"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  pointerWithin,
  rectIntersection,
  DragOverlay,
  type CollisionDetection,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import type { Task, TaskColumn, TaskBoardData, TaskChecklist, TaskPriority } from "@/lib/types";
import { Select } from "@/components/ui/Select";

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
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalColumnId, setModalColumnId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/projects/${hash}/tasks`);
      if (!res.ok) {
        if (res.status === 403) setError("Tasks board is not available");
        else setError("Failed to load tasks");
        return;
      }
      const result = await res.json();
      setData({ columns: result.columns, tasks: result.tasks });
      setEditable(!!result.editable);
    } catch {
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [hash]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: editable ? 8 : Infinity } }),
    useSensor(TouchSensor, { activationConstraint: { delay: editable ? 200 : 999999, tolerance: 5 } })
  );

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return rectIntersection(args);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-muted text-sm">Loading tasks...</div>
      </div>
    );
  }

  if (error || !data) return null;

  const sortedColumns = [...data.columns].sort((a, b) => {
    if (a.is_done_column) return 1;
    if (b.is_done_column) return -1;
    return a.position - b.position;
  });

  const getTasksByColumn = (columnId: string) =>
    data.tasks.filter((t) => t.column_id === columnId).sort((a, b) => a.position - b.position);

  const handleDragStart = (event: DragStartEvent) => {
    const task = data.tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeTaskItem = data.tasks.find((t) => t.id === activeId);
    if (!activeTaskItem) return;

    const overColumn = data.columns.find((c) => c.id === overId);
    if (overColumn && activeTaskItem.column_id !== overId) {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === activeId ? { ...t, column_id: overId } : t
          ),
        };
      });
      return;
    }

    const overTask = data.tasks.find((t) => t.id === overId);
    if (overTask && activeTaskItem.column_id !== overTask.column_id) {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === activeId ? { ...t, column_id: overTask.column_id } : t
          ),
        };
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over || !data) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeTaskItem = data.tasks.find((t) => t.id === activeId);
    if (!activeTaskItem) return;

    let targetColumnId = activeTaskItem.column_id;
    const overColumn = data.columns.find((c) => c.id === overId);
    const overTask = data.tasks.find((t) => t.id === overId);

    if (overColumn) targetColumnId = overColumn.id;
    else if (overTask) targetColumnId = overTask.column_id;

    const previousData = data;
    const isSameColumn = activeTaskItem.column_id === targetColumnId;

    if (isSameColumn) {
      // Same-column reorder using arrayMove
      const columnTasks = data.tasks
        .filter((t) => t.column_id === targetColumnId)
        .sort((a, b) => a.position - b.position);

      const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
      let newIndex = overTask ? columnTasks.findIndex((t) => t.id === overId) : columnTasks.length - 1;
      if (newIndex < 0) newIndex = columnTasks.length - 1;
      if (oldIndex === newIndex) return;

      const reordered = arrayMove(columnTasks, oldIndex, newIndex);

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) => {
            if (t.column_id !== targetColumnId) return t;
            const idx = reordered.findIndex((rt) => rt.id === t.id);
            return { ...t, position: idx };
          }),
        };
      });

      try {
        const res = await fetch(`/api/public/projects/${hash}/tasks/${activeId}/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ column_id: targetColumnId, position: newIndex }),
        });
        if (!res.ok) setData(previousData);
      } catch {
        setData(previousData);
      }
    } else {
      // Cross-column move
      const columnTasks = data.tasks
        .filter((t) => t.column_id === targetColumnId && t.id !== activeId)
        .sort((a, b) => a.position - b.position);

      let newPosition = columnTasks.length;
      if (overTask && overTask.id !== activeId) {
        const overIndex = columnTasks.findIndex((t) => t.id === overId);
        if (overIndex >= 0) newPosition = overIndex;
      }

      const newColumnTasks = [...columnTasks];
      newColumnTasks.splice(newPosition, 0, { ...activeTaskItem, column_id: targetColumnId });

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) => {
            if (t.id === activeId) {
              return { ...t, column_id: targetColumnId, position: newPosition };
            }
            if (t.column_id === targetColumnId) {
              const idx = newColumnTasks.findIndex((ct) => ct.id === t.id);
              return { ...t, position: idx >= 0 ? idx : t.position };
            }
            return t;
          }),
        };
      });

      try {
        const res = await fetch(`/api/public/projects/${hash}/tasks/${activeId}/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ column_id: targetColumnId, position: newPosition }),
        });
        if (!res.ok) setData(previousData);
      } catch {
        setData(previousData);
      }
    }
  };

  const handleAddTask = (columnId: string) => {
    if (!editable) return;
    setSelectedTask(null);
    setModalColumnId(columnId);
    setModalMode("edit");
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setModalColumnId(null);
    setModalMode("view");
  };

  const handleSaveTask = async (formData: { title: string; description: string; priority: TaskPriority }) => {
    if (selectedTask) {
      // Update
      const prev = data;
      setData((d) => {
        if (!d) return d;
        return { ...d, tasks: d.tasks.map((t) => (t.id === selectedTask.id ? { ...t, ...formData } : t)) };
      });
      setSelectedTask(null);
      setModalColumnId(null);

      const res = await fetch(`/api/public/projects/${hash}/tasks/${selectedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) setData(prev);
    } else if (modalColumnId) {
      // Create
      setSelectedTask(null);
      setModalColumnId(null);

      const res = await fetch(`/api/public/projects/${hash}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, column_id: modalColumnId }),
      });
      if (res.ok) {
        const newTask = await res.json();
        setData((d) => {
          if (!d) return d;
          return { ...d, tasks: [...d.tasks, { ...newTask, checklists: [], attachments: [] }] };
        });
      }
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask || !data) return;
    const prev = data;
    setData((d) => {
      if (!d) return d;
      return { ...d, tasks: d.tasks.filter((t) => t.id !== selectedTask.id) };
    });
    setSelectedTask(null);
    setModalColumnId(null);

    const res = await fetch(`/api/public/projects/${hash}/tasks/${selectedTask.id}`, {
      method: "DELETE",
    });
    if (!res.ok) setData(prev);
  };

  const isModalOpen = selectedTask !== null || modalColumnId !== null;

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:snap-none scroll-smooth"
        >
          {sortedColumns.map((column) => (
            <PublicColumn
              key={column.id}
              column={column}
              tasks={getTasksByColumn(column.id)}
              editable={editable}
              onTaskClick={handleTaskClick}
              onAddTask={handleAddTask}
            />
          ))}
        </div>

        <DragOverlay modifiers={[snapCenterToCursor]}>
          {activeTask && (
            <PublicTaskCard task={activeTask} onClick={() => {}} isDragOverlay />
          )}
        </DragOverlay>
      </DndContext>

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

      {/* Task modal */}
      {isModalOpen && (
        <PublicTaskModal
          task={selectedTask}
          mode={modalMode}
          editable={editable}
          onSave={handleSaveTask}
          onDelete={selectedTask && editable ? handleDeleteTask : undefined}
          onClose={() => {
            setSelectedTask(null);
            setModalColumnId(null);
          }}
          onEditClick={() => setModalMode("edit")}
        />
      )}
    </div>
  );
}

function PublicColumn({
  column,
  tasks,
  editable,
  onTaskClick,
  onAddTask,
}: {
  column: TaskColumn;
  tasks: Task[];
  editable: boolean;
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      className={`flex-shrink-0 w-[85vw] sm:w-72 bg-card border rounded-lg flex flex-col max-h-[500px] snap-center sm:snap-align-none transition-colors ${
        isOver && editable ? "border-accent/50" : "border-border"
      }`}
    >
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{column.name}</h3>
          <span className="text-xs text-muted bg-muted/10 px-1.5 py-0.5 rounded">
            {tasks.length}
          </span>
        </div>
        {editable && (
          <button
            onClick={() => onAddTask(column.id)}
            className="text-muted hover:text-accent transition-colors p-0.5"
            title="Add task"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {/* Tasks */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2 space-y-2">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            editable ? (
              <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ) : (
              <div key={task.id}>
                <PublicTaskCard task={task} onClick={() => onTaskClick(task)} />
              </div>
            )
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="text-xs text-muted text-center py-4">No tasks</p>
        )}
      </div>
    </div>
  );
}

function SortableTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        bg-background border border-border rounded-lg p-3 cursor-pointer
        hover:border-accent/50 transition-colors
        border-t-4 ${PRIORITY_COLORS[task.priority]}
        ${isDragging ? "shadow-lg" : ""}
      `}
    >
      <TaskCardContent task={task} />
    </div>
  );
}

function PublicTaskCard({ task, onClick, isDragOverlay }: { task: Task; onClick: () => void; isDragOverlay?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-background border border-border rounded-lg p-3 cursor-pointer
        hover:border-accent/50 transition-colors
        border-t-4 ${PRIORITY_COLORS[task.priority]}
        ${isDragOverlay ? "shadow-lg shadow-black/30 rotate-2" : ""}
      `}
    >
      <TaskCardContent task={task} />
    </div>
  );
}

function TaskCardContent({ task }: { task: Task }) {
  const checklists = task.checklists || [];
  const totalItems = checklists.reduce((sum, c) => sum + (c.items?.length || 0), 0);
  const completedItems = checklists.reduce(
    (sum, c) => sum + (c.items?.filter((i) => i.is_completed).length || 0),
    0
  );

  const isOverdue = task.deadline && new Date(task.deadline) < new Date();

  function formatDeadline(deadline: string) {
    const date = new Date(deadline);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <>
      <p className="text-sm font-medium line-clamp-2">{task.title}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
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

        {task.deadline && (
          <span className={isOverdue ? "text-danger bg-danger/10 px-1 rounded" : ""}>
            {formatDeadline(task.deadline)}
          </span>
        )}
      </div>
    </>
  );
}

function PublicTaskModal({
  task,
  mode,
  editable,
  onSave,
  onDelete,
  onClose,
  onEditClick,
}: {
  task: Task | null;
  mode: "view" | "edit";
  editable: boolean;
  onSave: (data: { title: string; description: string; priority: TaskPriority }) => void;
  onDelete?: () => void;
  onClose: () => void;
  onEditClick: () => void;
}) {
  const isViewMode = mode === "view" && task;
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || "medium");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setTitle(task?.title || "");
    setDescription(task?.description || "");
    setPriority(task?.priority || "medium");
    setShowDeleteConfirm(false);
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim(), priority });
  };

  const checklists = task?.checklists || [];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card border border-border rounded-t-xl sm:rounded-lg w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">
              {isViewMode ? "Task Details" : task ? "Edit Task" : "New Task"}
            </h2>
            <button type="button" onClick={onClose} className="text-muted hover:text-foreground">
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {isViewMode ? (
              <>
                <h3 className="text-lg font-medium">{task.title}</h3>
                {task.description && (
                  <div>
                    <label className="block text-sm text-muted mb-1">Description</label>
                    <p className="text-sm whitespace-pre-wrap">{task.description}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-muted">Priority: </span>
                    <span className={`capitalize ${
                      task.priority === "high" ? "text-danger" :
                      task.priority === "medium" ? "text-accent" : "text-muted"
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  {task.deadline && (
                    <div>
                      <span className="text-muted">Deadline: </span>
                      <span className={new Date(task.deadline) < new Date() ? "text-danger" : ""}>
                        {new Date(task.deadline).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
                {/* Checklists (read-only) */}
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
              </>
            ) : (
              <>
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
                <div>
                  <label className="block text-sm text-muted mb-1">Priority</label>
                  <Select
                    value={priority}
                    onChange={(v) => setPriority(v as TaskPriority)}
                    options={[
                      { value: "low", label: "Low" },
                      { value: "medium", label: "Medium" },
                      { value: "high", label: "High" },
                    ]}
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex items-center justify-between">
            {isViewMode ? (
              <>
                <div />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
                  >
                    Close
                  </button>
                  {editable && (
                    <button
                      type="button"
                      onClick={onEditClick}
                      className="px-4 py-2 text-sm bg-accent text-white rounded hover:bg-accent-hover transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  {task && onDelete && (
                    <>
                      {showDeleteConfirm ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted">Delete?</span>
                          <button type="button" onClick={onDelete} className="text-sm text-danger hover:text-danger/80">
                            Yes
                          </button>
                          <button type="button" onClick={() => setShowDeleteConfirm(false)} className="text-sm text-muted hover:text-foreground">
                            No
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setShowDeleteConfirm(true)} className="text-sm text-danger hover:text-danger/80">
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!title.trim()}
                    className="px-4 py-2 text-sm bg-accent text-white rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
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

function PublicChecklist({ checklist }: { checklist: TaskChecklist }) {
  const items = checklist.items || [];
  const completedCount = items.filter((i) => i.is_completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="bg-background/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">{checklist.name}</h4>
        <span className="text-xs text-muted">
          {completedCount}/{items.length}
        </span>
      </div>

      {items.length > 0 && (
        <div className="h-1.5 bg-border rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-success transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

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
