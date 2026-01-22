"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  DragOverlay,
  type CollisionDetection,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { SortableContext, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import type { Task, TaskColumn as TaskColumnType, Milestone } from "@/lib/types";
import { TaskColumn } from "./TaskColumn";
import { TaskCard } from "./TaskCard";
import { TaskModal, TaskFormData } from "./TaskModal";
import { ColumnEditor } from "./ColumnEditor";

interface TaskBoardProps {
  projectId: string;
  columns: TaskColumnType[];
  tasks: Task[];
  milestones: Milestone[];
}

export function TaskBoard({ projectId, columns: initialColumns, tasks: initialTasks, milestones }: TaskBoardProps) {
  const router = useRouter();
  const [columns, setColumns] = useState(initialColumns);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<TaskColumnType | null>(null);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [modalColumnId, setModalColumnId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [isColumnEditorOpen, setIsColumnEditorOpen] = useState(false);
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync columns and tasks when props change (after router.refresh)
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  useEffect(() => {
    setTasks(initialTasks);
    // Update modalTask if it's open to reflect new data (e.g., checklists)
    setModalTask(prev => {
      if (!prev) return null;
      const updatedTask = initialTasks.find(t => t.id === prev.id);
      return updatedTask || prev;
    });
  }, [initialTasks]);

  // Track scroll position for mobile indicator
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const columnWidth = container.firstElementChild?.clientWidth || 288;
      const gap = 16; // gap-4 = 1rem = 16px
      const index = Math.round(scrollLeft / (columnWidth + gap));
      setActiveColumnIndex(Math.min(index, columns.length));
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [columns.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  // Custom collision detection: use pointer position for better accuracy with snapCenterToCursor
  const collisionDetection: CollisionDetection = useCallback((args) => {
    // First try pointerWithin - detects based on cursor position
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    // Fallback to rectIntersection for edge cases
    return rectIntersection(args);
  }, []);

  const getTasksByColumn = useCallback(
    (columnId: string) => tasks.filter((t) => t.column_id === columnId).sort((a, b) => a.position - b.position),
    [tasks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;

    // Check if dragging a column
    if (activeId.startsWith("column-")) {
      const columnId = activeId.replace("column-", "");
      const column = columns.find((c) => c.id === columnId);
      if (column) {
        setActiveColumn(column);
        setActiveTask(null);
      }
      return;
    }

    // Otherwise dragging a task
    const task = tasks.find((t) => t.id === activeId);
    if (task) {
      setActiveTask(task);
      setActiveColumn(null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Skip if dragging a column (handled in dragEnd)
    if (activeId.startsWith("column-")) return;

    const activeTaskItem = tasks.find((t) => t.id === activeId);
    if (!activeTaskItem) return;

    // Check if dropping on a column
    const overColumn = columns.find((c) => c.id === overId);
    if (overColumn && activeTaskItem.column_id !== overId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, column_id: overId } : t
        )
      );
      return;
    }

    // Check if dropping on another task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && activeTaskItem.column_id !== overTask.column_id) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, column_id: overTask.column_id } : t
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setActiveColumn(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Handle column reordering
    if (activeId.startsWith("column-") && overId.startsWith("column-")) {
      const activeColumnId = activeId.replace("column-", "");
      const overColumnId = overId.replace("column-", "");

      if (activeColumnId !== overColumnId) {
        const sortedCols = [...columns].sort((a, b) => {
          if (a.is_done_column) return 1;
          if (b.is_done_column) return -1;
          return a.position - b.position;
        });

        const oldIndex = sortedCols.findIndex((c) => c.id === activeColumnId);
        const newIndex = sortedCols.findIndex((c) => c.id === overColumnId);

        // Don't allow moving past the Done column
        const overCol = sortedCols[newIndex];
        if (overCol?.is_done_column) return;

        const reordered = arrayMove(sortedCols, oldIndex, newIndex);
        const previousColumns = columns;

        // Optimistic update
        setColumns(reordered.map((c, i) => ({ ...c, position: i })));

        // API call with error handling
        try {
          const columnIds = reordered.map((c) => c.id);
          const res = await fetch(`/api/v1/projects/${projectId}/columns/reorder`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ columnIds }),
          });
          if (!res.ok) {
            console.error("Failed to reorder columns");
            setColumns(previousColumns); // Rollback
          }
        } catch (error) {
          console.error("Error reordering columns:", error);
          setColumns(previousColumns); // Rollback
        }
      }
      return;
    }

    const activeTaskItem = tasks.find((t) => t.id === activeId);
    if (!activeTaskItem) return;

    // Determine target column
    let targetColumnId = activeTaskItem.column_id;
    const overColumn = columns.find((c) => c.id === overId);
    const overTask = tasks.find((t) => t.id === overId);

    if (overColumn) {
      targetColumnId = overColumn.id;
    } else if (overTask) {
      targetColumnId = overTask.column_id;
    }

    // Get tasks in target column
    const columnTasks = tasks
      .filter((t) => t.column_id === targetColumnId && t.id !== activeId)
      .sort((a, b) => a.position - b.position);

    // Calculate new position
    let newPosition = 0;
    if (overTask && overTask.id !== activeId) {
      const overIndex = columnTasks.findIndex((t) => t.id === overId);
      newPosition = overIndex >= 0 ? overIndex : columnTasks.length;
    } else {
      newPosition = columnTasks.length;
    }

    // Save previous state for rollback
    const previousTasks = tasks;

    // Optimistic update
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id === activeId) {
          return { ...t, column_id: targetColumnId, position: newPosition };
        }
        return t;
      });

      // Reorder positions in target column
      const columnTasksUpdated = updated
        .filter((t) => t.column_id === targetColumnId)
        .sort((a, b) => {
          if (a.id === activeId) return newPosition - b.position;
          if (b.id === activeId) return a.position - newPosition;
          return a.position - b.position;
        });

      return updated.map((t) => {
        if (t.column_id === targetColumnId) {
          const idx = columnTasksUpdated.findIndex((ct) => ct.id === t.id);
          return { ...t, position: idx };
        }
        return t;
      });
    });

    // API call with error handling
    try {
      const res = await fetch(`/api/v1/tasks/${activeId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          column_id: targetColumnId,
          position: newPosition,
        }),
      });
      if (!res.ok) {
        console.error("Failed to move task");
        setTasks(previousTasks); // Rollback
      }
    } catch (error) {
      console.error("Error moving task:", error);
      setTasks(previousTasks); // Rollback
    }
  };

  const handleAddTask = (columnId: string) => {
    setModalTask(null);
    setModalColumnId(columnId);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setModalTask(task);
    setModalColumnId(null);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEditClick = () => {
    setModalMode("edit");
  };

  const handleSaveTask = async (data: TaskFormData) => {
    if (modalTask) {
      // Update - use optimistic update, no need to refresh entire page
      const prev = tasks;
      // Don't spread column_id if undefined (editing existing task)
      const updateData = { ...data };
      if (updateData.column_id === undefined) {
        delete updateData.column_id;
      }
      setTasks((t) => t.map((task) => (task.id === modalTask.id ? { ...task, ...updateData } : task)));
      setIsModalOpen(false);

      const res = await fetch(`/api/v1/tasks/${modalTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        setTasks(prev);
      }
      // Don't call router.refresh() - optimistic update is sufficient
    } else {
      // Create - add new task to state
      setIsModalOpen(false);

      const res = await fetch(`/api/v1/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, column_id: data.column_id || modalColumnId }),
      });

      if (res.ok) {
        const newTask = await res.json();
        setTasks((prev) => [...prev, { ...newTask, checklists: [], attachments: [] }]);
      }
      // Don't call router.refresh() - we already added the task to state
    }
  };

  const handleDeleteTask = async () => {
    if (!modalTask) return;

    const prev = tasks;
    setTasks((t) => t.filter((task) => task.id !== modalTask.id));
    setIsModalOpen(false);

    const res = await fetch(`/api/v1/tasks/${modalTask.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setTasks(prev);
    }
  };

  const handleArchiveTask = async () => {
    if (!modalTask) return;

    const prev = tasks;
    setTasks((t) => t.filter((task) => task.id !== modalTask.id));
    setIsModalOpen(false);

    const res = await fetch(`/api/v1/tasks/${modalTask.id}/archive`, {
      method: "POST",
    });

    if (!res.ok) {
      setTasks(prev);
    }
  };

  return (
    <>
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
          <SortableContext
            items={columns
              .sort((a, b) => {
                if (a.is_done_column) return 1;
                if (b.is_done_column) return -1;
                return a.position - b.position;
              })
              .map((c) => `column-${c.id}`)}
            strategy={horizontalListSortingStrategy}
          >
            {columns
              .sort((a, b) => {
                if (a.is_done_column) return 1;
                if (b.is_done_column) return -1;
                return a.position - b.position;
              })
              .map((column) => (
                <TaskColumn
                  key={column.id}
                  column={column}
                  tasks={getTasksByColumn(column.id)}
                  milestones={milestones}
                  onTaskClick={handleTaskClick}
                  onAddTask={handleAddTask}
                  isDraggingColumn={!!activeColumn}
                />
              ))}
          </SortableContext>

          {/* Add Column Button */}
          <button
            onClick={() => setIsColumnEditorOpen(true)}
            className="flex-shrink-0 w-[85vw] sm:w-72 h-12 border-2 border-dashed border-border rounded-lg
                       flex items-center justify-center gap-2 text-muted hover:text-foreground
                       hover:border-accent/50 transition-colors snap-center sm:snap-align-none"
          >
            <span className="text-lg">+</span>
            <span className="text-sm">Add Column</span>
          </button>
        </div>

        {/* Mobile scroll indicator dots */}
        <div className="flex justify-center gap-1.5 py-2 sm:hidden">
          {columns.map((_, index) => (
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
          {/* Dot for Add Column */}
          <button
            onClick={() => {
              const container = scrollContainerRef.current;
              if (!container) return;
              container.scrollTo({
                left: container.scrollWidth,
                behavior: "smooth",
              });
            }}
            className={`w-2 h-2 rounded-full transition-colors ${
              activeColumnIndex === columns.length ? "bg-accent" : "bg-border"
            }`}
            aria-label="Go to add column"
          />
        </div>

        <DragOverlay modifiers={[snapCenterToCursor]}>
          {activeTask && (
            <TaskCard
              task={activeTask}
              milestones={milestones}
              onClick={() => {}}
            />
          )}
          {activeColumn && (
            <div className="w-72 bg-background border border-accent rounded-lg p-3 shadow-lg opacity-90">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
                <span className="font-medium text-sm">{activeColumn.name}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {isModalOpen && (
        <TaskModal
          task={modalTask}
          milestones={milestones}
          columnId={modalColumnId || undefined}
          mode={modalMode}
          onSave={handleSaveTask}
          onDelete={modalTask ? handleDeleteTask : undefined}
          onArchive={modalTask ? handleArchiveTask : undefined}
          onClose={() => setIsModalOpen(false)}
          onRefresh={() => router.refresh()}
          onEditClick={handleEditClick}
        />
      )}

      {isColumnEditorOpen && (
        <ColumnEditor
          projectId={projectId}
          columns={columns}
          onClose={() => setIsColumnEditorOpen(false)}
          onColumnsChange={() => {
            router.refresh();
            setIsColumnEditorOpen(false);
          }}
        />
      )}
    </>
  );
}
