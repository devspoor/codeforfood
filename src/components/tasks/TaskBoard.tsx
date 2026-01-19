"use client";

import { useState, useCallback } from "react";
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
  closestCorners,
  DragOverlay,
} from "@dnd-kit/core";
import type { Task, TaskColumn as TaskColumnType, Milestone } from "@/lib/types";
import { TaskColumn } from "./TaskColumn";
import { TaskCard } from "./TaskCard";
import { TaskModal, TaskFormData } from "./TaskModal";

interface TaskBoardProps {
  projectId: string;
  columns: TaskColumnType[];
  tasks: Task[];
  milestones: Milestone[];
}

export function TaskBoard({ projectId, columns: initialColumns, tasks: initialTasks, milestones }: TaskBoardProps) {
  const router = useRouter();
  const [columns] = useState(initialColumns);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [modalColumnId, setModalColumnId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const getTasksByColumn = useCallback(
    (columnId: string) => tasks.filter((t) => t.column_id === columnId).sort((a, b) => a.position - b.position),
    [tasks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Check if dropping on a column
    const overColumn = columns.find((c) => c.id === overId);
    if (overColumn && activeTask.column_id !== overId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, column_id: overId } : t
        )
      );
      return;
    }

    // Check if dropping on another task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && activeTask.column_id !== overTask.column_id) {
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

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Determine target column
    let targetColumnId = activeTask.column_id;
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

    // API call
    await fetch(`/api/v1/tasks/${activeId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        column_id: targetColumnId,
        position: newPosition,
      }),
    });

    router.refresh();
  };

  const handleAddTask = (columnId: string) => {
    setModalTask(null);
    setModalColumnId(columnId);
    setIsModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setModalTask(task);
    setModalColumnId(null);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (data: TaskFormData) => {
    if (modalTask) {
      // Update
      const prev = tasks;
      setTasks((t) => t.map((task) => (task.id === modalTask.id ? { ...task, ...data } : task)));
      setIsModalOpen(false);

      const res = await fetch(`/api/v1/tasks/${modalTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        setTasks(prev);
      }
      router.refresh();
    } else {
      // Create
      setIsModalOpen(false);

      const res = await fetch(`/api/v1/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, column_id: data.column_id || modalColumnId }),
      });

      if (res.ok) {
        const newTask = await res.json();
        setTasks((prev) => [...prev, newTask]);
      }
      router.refresh();
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
    router.refresh();
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
    router.refresh();
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <TaskColumn
              key={column.id}
              column={column}
              tasks={getTasksByColumn(column.id)}
              milestones={milestones}
              onTaskClick={handleTaskClick}
              onAddTask={handleAddTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <TaskCard
              task={activeTask}
              milestones={milestones}
              onClick={() => {}}
            />
          )}
        </DragOverlay>
      </DndContext>

      {isModalOpen && (
        <TaskModal
          task={modalTask}
          milestones={milestones}
          columnId={modalColumnId || undefined}
          onSave={handleSaveTask}
          onDelete={modalTask ? handleDeleteTask : undefined}
          onArchive={modalTask ? handleArchiveTask : undefined}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
