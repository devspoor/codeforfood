"use client";

import { useState } from "react";
import type { TaskColumn } from "@/lib/types";

interface ColumnEditorProps {
  projectId: string;
  columns: TaskColumn[];
  onClose: () => void;
  onColumnsChange: () => void;
}

export function ColumnEditor({
  projectId,
  columns: initialColumns,
  onClose,
  onColumnsChange,
}: ColumnEditorProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [newColumnName, setNewColumnName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [saving, setSaving] = useState(false);

  // Sort columns by position, but Done column always last
  const sortedColumns = [...columns].sort((a, b) => {
    if (a.is_done_column) return 1;
    if (b.is_done_column) return -1;
    return a.position - b.position;
  });

  const handleAddColumn = async () => {
    if (!newColumnName.trim() || saving) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newColumnName.trim() }),
      });

      if (res.ok) {
        const newColumn = await res.json();
        setColumns((prev) => [...prev, newColumn]);
        setNewColumnName("");
        onColumnsChange();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (column: TaskColumn) => {
    setEditingId(column.id);
    setEditingName(column.name);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim() || saving) return;

    const column = columns.find((c) => c.id === editingId);
    if (!column || column.name === editingName.trim()) {
      setEditingId(null);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/columns/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });

      if (res.ok) {
        const updated = await res.json();
        setColumns((prev) =>
          prev.map((c) => (c.id === editingId ? updated : c))
        );
        onColumnsChange();
      }
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  };

  const handleDelete = async (columnId: string) => {
    const column = columns.find((c) => c.id === columnId);
    if (!column || column.is_system) return;

    if (!confirm(`Delete "${column.name}"? Tasks will be moved to the first column.`)) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/columns/${columnId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setColumns((prev) => prev.filter((c) => c.id !== columnId));
        onColumnsChange();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleMoveUp = async (columnId: string) => {
    const index = sortedColumns.findIndex((c) => c.id === columnId);
    if (index <= 0) return;

    const prevColumn = sortedColumns[index - 1];
    // Can't move past first column if it's system
    if (index === 1 && prevColumn.is_system) return;

    const newOrder = sortedColumns.map((c) => c.id);
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];

    await reorderColumns(newOrder);
  };

  const handleMoveDown = async (columnId: string) => {
    const index = sortedColumns.findIndex((c) => c.id === columnId);
    const nextColumn = sortedColumns[index + 1];

    // Can't move past Done column
    if (!nextColumn || nextColumn.is_done_column) return;

    const newOrder = sortedColumns.map((c) => c.id);
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];

    await reorderColumns(newOrder);
  };

  const reorderColumns = async (columnIds: string[]) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/columns/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnIds }),
      });

      if (res.ok) {
        // Update local state with new positions
        setColumns((prev) =>
          prev.map((c) => ({
            ...c,
            position: columnIds.indexOf(c.id),
          }))
        );
        onColumnsChange();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-card border border-border rounded-t-xl sm:rounded-lg w-full sm:max-w-md">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Manage Columns</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground"
          >
            x
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Columns list */}
          <div className="space-y-2">
            {sortedColumns.map((column, index) => (
              <div
                key={column.id}
                className="flex items-center gap-2 bg-background/50 rounded p-2"
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMoveUp(column.id)}
                    disabled={
                      saving ||
                      index === 0 ||
                      (index === 1 && sortedColumns[0].is_system)
                    }
                    className="p-1.5 text-muted hover:text-foreground disabled:opacity-30 text-xs leading-none"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleMoveDown(column.id)}
                    disabled={
                      saving ||
                      column.is_done_column ||
                      sortedColumns[index + 1]?.is_done_column
                    }
                    className="p-1.5 text-muted hover:text-foreground disabled:opacity-30 text-xs leading-none"
                  >
                    ▼
                  </button>
                </div>

                {/* Name (editable or display) */}
                {editingId === column.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-accent"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => handleStartEdit(column)}
                    className="flex-1 text-sm cursor-pointer hover:text-accent"
                  >
                    {column.name}
                    {column.is_system && (
                      <span className="text-xs text-muted ml-1">(system)</span>
                    )}
                  </span>
                )}

                {/* Delete button (only for custom columns) */}
                {!column.is_system && (
                  <button
                    onClick={() => handleDelete(column.id)}
                    disabled={saving}
                    className="text-muted hover:text-danger text-xs transition-colors disabled:opacity-50"
                  >
                    x
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add new column */}
          <div className="flex gap-2 pt-2 border-t border-border">
            <input
              type="text"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="New column name..."
              className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddColumn();
              }}
            />
            <button
              onClick={handleAddColumn}
              disabled={!newColumnName.trim() || saving}
              className="px-3 py-2 text-sm bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
