"use client";

import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Task, TaskColumn as TaskColumnType, Milestone } from "@/lib/types";
import { TaskCard } from "./TaskCard";

interface TaskColumnProps {
  column: TaskColumnType;
  tasks: Task[];
  milestones: Milestone[];
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string) => void;
  isDraggingColumn?: boolean;
}

export function TaskColumn({ column, tasks, milestones, onTaskClick, onAddTask, isDraggingColumn }: TaskColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${column.id}`,
    data: { type: "column", column },
    disabled: column.is_done_column,
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
  });

  const taskIds = tasks.map((t) => t.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={`
        flex-shrink-0 w-[85vw] sm:w-72 bg-background border border-border rounded-lg
        flex flex-col max-h-[calc(100vh-200px)]
        ${isOver && !isDraggingColumn ? "border-accent" : ""}
        ${isDragging ? "opacity-50 z-50" : ""}
        snap-center sm:snap-align-none
      `}
    >
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Drag handle (hidden for Done column) */}
          {!column.is_done_column && (
            <button
              {...attributes}
              {...listeners}
              className="text-muted hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
              title="Drag to reorder"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </button>
          )}
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
        ref={setDroppableRef}
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
