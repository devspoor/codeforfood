"use client";

import { useState, useEffect } from "react";
import type { TaskChecklist, TaskChecklistItem } from "@/lib/types";

interface ChecklistEditorProps {
  taskId: string;
  checklists: TaskChecklist[];
  readOnly?: boolean;
  onChange?: () => void; // Deprecated: kept for compatibility, not used (optimistic updates)
}

export function ChecklistEditor({ taskId, checklists: initialChecklists, readOnly = false }: ChecklistEditorProps) {
  const [checklists, setChecklists] = useState<TaskChecklist[]>(initialChecklists);
  const [newChecklistName, setNewChecklistName] = useState("");
  const [addingChecklist, setAddingChecklist] = useState(false);
  const [showAddChecklist, setShowAddChecklist] = useState(false);

  // Sync with props when they change (e.g., from parent refresh)
  useEffect(() => {
    setChecklists(initialChecklists);
  }, [initialChecklists]);

  const handleAddChecklist = async () => {
    if (!newChecklistName.trim() || addingChecklist) return;

    const tempId = `temp-${Date.now()}`;
    const newChecklist: TaskChecklist = {
      id: tempId,
      task_id: taskId,
      name: newChecklistName.trim(),
      position: checklists.length,
      created_at: new Date().toISOString(),
      items: [],
    };

    // Optimistic update
    setChecklists(prev => [...prev, newChecklist]);
    setNewChecklistName("");
    setShowAddChecklist(false);
    setAddingChecklist(true);

    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/checklists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newChecklist.name }),
      });

      if (res.ok) {
        const created = await res.json();
        // Replace temp with real
        setChecklists(prev => prev.map(c => c.id === tempId ? { ...created, items: [] } : c));
      } else {
        // Rollback
        setChecklists(prev => prev.filter(c => c.id !== tempId));
      }
    } catch {
      // Rollback
      setChecklists(prev => prev.filter(c => c.id !== tempId));
    } finally {
      setAddingChecklist(false);
    }
  };

  const handleUpdateChecklist = (checklistId: string, updates: Partial<TaskChecklist>) => {
    setChecklists(prev => prev.map(c => c.id === checklistId ? { ...c, ...updates } : c));
  };

  const handleDeleteChecklist = (checklistId: string) => {
    setChecklists(prev => prev.filter(c => c.id !== checklistId));
  };

  const handleAddItem = (checklistId: string, item: TaskChecklistItem) => {
    setChecklists(prev => prev.map(c => {
      if (c.id === checklistId) {
        return { ...c, items: [...(c.items || []), item] };
      }
      return c;
    }));
  };

  const handleUpdateItem = (checklistId: string, itemId: string, updates: Partial<TaskChecklistItem>) => {
    setChecklists(prev => prev.map(c => {
      if (c.id === checklistId) {
        return {
          ...c,
          items: (c.items || []).map(i => i.id === itemId ? { ...i, ...updates } : i)
        };
      }
      return c;
    }));
  };

  const handleDeleteItem = (checklistId: string, itemId: string) => {
    setChecklists(prev => prev.map(c => {
      if (c.id === checklistId) {
        return { ...c, items: (c.items || []).filter(i => i.id !== itemId) };
      }
      return c;
    }));
  };

  const handleReplaceItemId = (checklistId: string, tempId: string, realItem: TaskChecklistItem) => {
    setChecklists(prev => prev.map(c => {
      if (c.id === checklistId) {
        return {
          ...c,
          items: (c.items || []).map(i => i.id === tempId ? realItem : i)
        };
      }
      return c;
    }));
  };

  return (
    <div className="space-y-4">
      {checklists.length === 0 && readOnly && (
        <p className="text-sm text-muted text-center py-4">No checklists</p>
      )}

      {checklists.map((checklist) => (
        <ChecklistItem
          key={checklist.id}
          checklist={checklist}
          readOnly={readOnly}
          onUpdateChecklist={(updates) => handleUpdateChecklist(checklist.id, updates)}
          onDeleteChecklist={() => handleDeleteChecklist(checklist.id)}
          onAddItem={(item) => handleAddItem(checklist.id, item)}
          onUpdateItem={(itemId, updates) => handleUpdateItem(checklist.id, itemId, updates)}
          onDeleteItem={(itemId) => handleDeleteItem(checklist.id, itemId)}
          onReplaceItemId={(tempId, realItem) => handleReplaceItemId(checklist.id, tempId, realItem)}
        />
      ))}

      {!readOnly && (
        showAddChecklist ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newChecklistName}
              onChange={(e) => setNewChecklistName(e.target.value)}
              placeholder="Checklist name..."
              className="flex-1 bg-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddChecklist();
                if (e.key === "Escape") {
                  setShowAddChecklist(false);
                  setNewChecklistName("");
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddChecklist}
              disabled={!newChecklistName.trim() || addingChecklist}
              className="px-3 py-1.5 text-sm bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddChecklist(false);
                setNewChecklistName("");
              }}
              className="px-3 py-1.5 text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddChecklist(true)}
            className="text-sm text-accent hover:text-accent-hover"
          >
            + Add checklist
          </button>
        )
      )}
    </div>
  );
}

function ChecklistItem({
  checklist,
  readOnly = false,
  onUpdateChecklist,
  onDeleteChecklist,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onReplaceItemId,
}: {
  checklist: TaskChecklist;
  readOnly?: boolean;
  onUpdateChecklist: (updates: Partial<TaskChecklist>) => void;
  onDeleteChecklist: () => void;
  onAddItem: (item: TaskChecklistItem) => void;
  onUpdateItem: (itemId: string, updates: Partial<TaskChecklistItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onReplaceItemId: (tempId: string, realItem: TaskChecklistItem) => void;
}) {
  const [newItemText, setNewItemText] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(checklist.name);

  const items = checklist.items || [];
  const completedCount = items.filter((i) => i.is_completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const handleUpdateName = async () => {
    if (!name.trim() || name.trim() === checklist.name) {
      setName(checklist.name);
      setEditingName(false);
      return;
    }

    const newName = name.trim();
    // Optimistic update
    onUpdateChecklist({ name: newName });
    setEditingName(false);

    const res = await fetch(`/api/v1/checklists/${checklist.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });

    if (!res.ok) {
      // Rollback
      onUpdateChecklist({ name: checklist.name });
      setName(checklist.name);
    }
  };

  const handleDeleteChecklist = async () => {
    if (!confirm("Delete this checklist?")) return;

    // Optimistic delete
    onDeleteChecklist();

    await fetch(`/api/v1/checklists/${checklist.id}`, {
      method: "DELETE",
    });
    // Note: Can't easily rollback here since component is unmounted
  };

  const handleAddItem = async () => {
    if (!newItemText.trim() || addingItem) return;

    const tempId = `temp-item-${Date.now()}`;
    const newItem: TaskChecklistItem = {
      id: tempId,
      checklist_id: checklist.id,
      text: newItemText.trim(),
      is_completed: false,
      position: items.length,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    onAddItem(newItem);
    setNewItemText("");
    setShowAddItem(false);
    setAddingItem(true);

    try {
      const res = await fetch(`/api/v1/checklists/${checklist.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newItem.text }),
      });

      if (res.ok) {
        const created = await res.json();
        onReplaceItemId(tempId, created);
      } else {
        // Rollback
        onDeleteItem(tempId);
      }
    } catch {
      // Rollback
      onDeleteItem(tempId);
    } finally {
      setAddingItem(false);
    }
  };

  return (
    <div className="bg-background/50 rounded-lg p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        {editingName && !readOnly ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm font-medium focus:outline-none focus:border-accent"
            autoFocus
            onBlur={handleUpdateName}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUpdateName();
              if (e.key === "Escape") {
                setName(checklist.name);
                setEditingName(false);
              }
            }}
          />
        ) : (
          <h4
            className={`text-sm font-medium ${!readOnly ? "cursor-pointer hover:text-accent" : ""}`}
            onClick={() => !readOnly && setEditingName(true)}
          >
            {checklist.name}
          </h4>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {completedCount}/{items.length}
          </span>
          {!readOnly && (
            <button
              type="button"
              onClick={handleDeleteChecklist}
              className="text-muted hover:text-danger text-xs"
            >
              Delete
            </button>
          )}
        </div>
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
          <ChecklistItemRow
            key={item.id}
            item={item}
            readOnly={readOnly}
            onUpdateItem={(updates) => onUpdateItem(item.id, updates)}
            onDeleteItem={() => onDeleteItem(item.id)}
          />
        ))}
      </div>

      {/* Add item */}
      {!readOnly && (
        showAddItem ? (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Add item..."
              className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddItem();
                if (e.key === "Escape") {
                  setShowAddItem(false);
                  setNewItemText("");
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddItem}
              disabled={!newItemText.trim() || addingItem}
              className="px-3 py-2 text-sm bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddItem(true)}
            className="mt-2 text-xs text-muted hover:text-foreground"
          >
            + Add item
          </button>
        )
      )}
    </div>
  );
}

function ChecklistItemRow({
  item,
  readOnly = false,
  onUpdateItem,
  onDeleteItem,
}: {
  item: TaskChecklistItem;
  readOnly?: boolean;
  onUpdateItem: (updates: Partial<TaskChecklistItem>) => void;
  onDeleteItem: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);

  const handleToggle = async () => {
    const newCompleted = !item.is_completed;
    // Optimistic update
    onUpdateItem({ is_completed: newCompleted });

    const res = await fetch(`/api/v1/checklist-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_completed: newCompleted }),
    });

    if (!res.ok) {
      // Rollback
      onUpdateItem({ is_completed: item.is_completed });
    }
  };

  const handleUpdateText = async () => {
    if (!text.trim() || text.trim() === item.text) {
      setText(item.text);
      setEditing(false);
      return;
    }

    const newText = text.trim();
    // Optimistic update
    onUpdateItem({ text: newText });
    setEditing(false);

    const res = await fetch(`/api/v1/checklist-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText }),
    });

    if (!res.ok) {
      // Rollback
      onUpdateItem({ text: item.text });
      setText(item.text);
    }
  };

  const handleDelete = async () => {
    // Optimistic delete
    onDeleteItem();

    await fetch(`/api/v1/checklist-items/${item.id}`, {
      method: "DELETE",
    });
    // Note: Can't easily rollback delete since component is unmounted
  };

  return (
    <div className="flex items-center gap-2 group">
      {readOnly ? (
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
      ) : (
        <button
          type="button"
          onClick={handleToggle}
          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
            item.is_completed
              ? "bg-success border-success text-white"
              : "border-border hover:border-accent"
          }`}
        >
          {item.is_completed && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      )}

      {editing && !readOnly ? (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-background border border-border rounded px-2 py-0.5 text-sm focus:outline-none focus:border-accent"
          autoFocus
          onBlur={handleUpdateText}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleUpdateText();
            if (e.key === "Escape") {
              setText(item.text);
              setEditing(false);
            }
          }}
        />
      ) : (
        <span
          onClick={() => !readOnly && setEditing(true)}
          className={`flex-1 text-sm ${!readOnly ? "cursor-pointer" : ""} ${
            item.is_completed ? "text-muted line-through" : ""
          }`}
        >
          {item.text}
        </span>
      )}

      {!readOnly && (
        <button
          type="button"
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger text-xs transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  );
}
