"use client";

import { useState } from "react";
import type { TaskAttachment } from "@/lib/types";

interface AttachmentManagerProps {
  taskId: string;
  attachments: TaskAttachment[];
  readOnly?: boolean;
  onChange: () => void;
}

export function AttachmentManager({ taskId, attachments, readOnly = false, onChange }: AttachmentManagerProps) {
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAddLink = async () => {
    if (!linkName.trim() || !linkUrl.trim() || adding) return;

    // Validate URL
    try {
      new URL(linkUrl.trim());
    } catch {
      alert("Please enter a valid URL");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "link",
          name: linkName.trim(),
          url: linkUrl.trim(),
        }),
      });

      if (res.ok) {
        setLinkName("");
        setLinkUrl("");
        setShowAddLink(false);
        onChange();
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    const res = await fetch(`/api/v1/task-attachments/${attachmentId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      onChange();
    }
  };

  const getIcon = (attachment: TaskAttachment) => {
    if (attachment.type === "file") {
      const ext = attachment.name.split(".").pop()?.toLowerCase();
      if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) return "🖼️";
      if (["pdf"].includes(ext || "")) return "📄";
      if (["doc", "docx"].includes(ext || "")) return "📝";
      if (["xls", "xlsx"].includes(ext || "")) return "📊";
      if (["zip", "rar", "7z"].includes(ext || "")) return "📦";
      return "📎";
    }

    // Link icons based on URL
    const url = attachment.url.toLowerCase();
    if (url.includes("figma.com")) return "🎨";
    if (url.includes("github.com")) return "🐙";
    if (url.includes("notion.so") || url.includes("notion.com")) return "📓";
    if (url.includes("docs.google.com")) return "📄";
    if (url.includes("drive.google.com")) return "📁";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "🎬";
    if (url.includes("slack.com")) return "💬";
    if (url.includes("discord.com") || url.includes("discord.gg")) return "💬";
    return "🔗";
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* Empty state for readOnly */}
      {attachments.length === 0 && readOnly && (
        <p className="text-sm text-muted text-center py-4">No attachments</p>
      )}

      {/* Attachments list */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 bg-background/50 rounded px-3 py-2 group"
            >
              <span className="text-sm">{getIcon(attachment)}</span>
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-sm text-accent hover:text-accent-hover truncate"
              >
                {attachment.name}
              </a>
              {attachment.file_size && (
                <span className="text-xs text-muted">
                  {formatFileSize(attachment.file_size)}
                </span>
              )}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleDelete(attachment.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger text-xs transition-opacity"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add link form */}
      {!readOnly && (
        showAddLink ? (
          <div className="space-y-2 bg-background/50 rounded p-3">
            <input
              type="text"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              placeholder="Link name..."
              className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
              autoFocus
            />
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddLink();
                if (e.key === "Escape") {
                  setShowAddLink(false);
                  setLinkName("");
                  setLinkUrl("");
                }
              }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddLink}
                disabled={!linkName.trim() || !linkUrl.trim() || adding}
                className="px-3 py-1.5 text-sm bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50"
              >
                Add Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddLink(false);
                  setLinkName("");
                  setLinkUrl("");
                }}
                className="px-3 py-1.5 text-sm text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddLink(true)}
            className="text-sm text-accent hover:text-accent-hover"
          >
            + Add link
          </button>
        )
      )}
    </div>
  );
}
