"use client";

import { useState } from "react";
import type { Comment } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { AlertDialog } from "./AlertDialog";

interface Props {
  projectId: string;
  comments: Comment[];
}

export function CommentsEditor({ projectId, comments: initialComments }: Props) {
  const [comments, setComments] = useState(initialComments);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTimeout(() => setContent(""), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const trimmedContent = content.trim();

    if (editingId) {
      // Optimistic update for edit
      setComments(comments.map((c) =>
        c.id === editingId ? { ...c, content: trimmedContent, updated_at: new Date().toISOString() } : c
      ));
      resetForm();

      const res = await fetch(`/api/projects/${projectId}/comments/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmedContent }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComments((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
      }
    } else {
      // Optimistic update for create
      const tempId = `temp-${Date.now()}`;
      const optimisticComment: Comment = {
        id: tempId,
        project_id: projectId,
        content: trimmedContent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setComments([optimisticComment, ...comments]);
      resetForm();

      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmedContent }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => prev.map((c) => (c.id === tempId ? comment : c)));
      }
    }
  };

  const handleEdit = (c: Comment) => {
    setEditingId(c.id);
    setShowForm(true);
    setTimeout(() => setContent(c.content), 0);
  };

  const handleDelete = async (commentId: string) => {
    setDeleting(true);
    // Optimistic update
    const previousComments = comments;
    setComments(comments.filter((c) => c.id !== commentId));
    setDeleteDialogId(null);

    const res = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setComments(previousComments);
    }
    setDeleting(false);
  };

  return (
    <div className="space-y-4">
      {/* Add comment button/form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border border-dashed border-border rounded-lg text-muted hover:border-accent hover:text-accent transition-colors"
        >
          + Add Comment
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">Comment</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add a comment to explain status, agreements, or next steps..."
              rows={4}
              className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none resize-none"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!content.trim()}
              className="px-4 py-2 bg-accent text-background font-semibold rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {editingId ? "Update" : "Add Comment"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-border rounded hover:border-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Comments list */}
      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-muted">
                  {formatDate(c.created_at)}
                  {c.updated_at !== c.created_at && " (edited)"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(c)}
                    className="text-xs text-muted hover:text-foreground transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteDialogId(c.id)}
                    className="text-xs text-muted hover:text-danger transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
        </div>
      )}

      {comments.length === 0 && !showForm && (
        <p className="text-center text-muted text-sm py-4">No comments yet</p>
      )}

      <AlertDialog
        open={deleteDialogId !== null}
        onOpenChange={(open) => !open && setDeleteDialogId(null)}
        title="Delete comment?"
        description="This will permanently delete this comment."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteDialogId && handleDelete(deleteDialogId)}
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}
