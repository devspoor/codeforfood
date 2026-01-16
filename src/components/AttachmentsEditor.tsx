"use client";

import { useState, useRef, useEffect } from "react";
import type { Attachment } from "@/lib/types";
import { AlertDialog } from "./AlertDialog";

interface Props {
  projectId: string;
  attachments: Attachment[];
}

/**
 * Validates URL to prevent XSS via javascript: protocol
 * Only allows http:// and https:// URLs
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const TYPE_OPTIONS = [
  { value: "figma", label: "Figma", icon: "🎨" },
  { value: "github", label: "GitHub", icon: "📦" },
  { value: "demo", label: "Demo", icon: "🚀" },
  { value: "document", label: "Document", icon: "📄" },
  { value: "link", label: "Link", icon: "🔗" },
] as const;

const TYPE_COLORS: Record<string, string> = {
  figma: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  github: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  demo: "bg-green-500/20 text-green-400 border-green-500/30",
  document: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  link: "bg-accent/20 text-accent border-accent/30",
};

const TYPE_HOVER: Record<string, string> = {
  figma: "hover:bg-purple-500/30 hover:border-purple-400",
  github: "hover:bg-gray-500/30 hover:border-gray-400",
  demo: "hover:bg-green-500/30 hover:border-green-400",
  document: "hover:bg-blue-500/30 hover:border-blue-400",
  link: "hover:bg-accent/30 hover:border-accent",
};

export function AttachmentsEditor({ projectId, attachments: initialAttachments }: Props) {
  const [attachments, setAttachments] = useState(initialAttachments);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<typeof TYPE_OPTIONS[number]["value"]>("link");
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setTypeDropdownOpen(false);
    setTimeout(() => {
      setLabel("");
      setUrl("");
      setType("link");
    }, 0);
  };

  const selectedType = TYPE_OPTIONS.find(t => t.value === type) || TYPE_OPTIONS[4];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !url.trim()) return;

    // Validate URL to prevent XSS
    if (!isValidUrl(url.trim())) {
      return;
    }

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticAttachment: Attachment = {
      id: tempId,
      project_id: projectId,
      label: label.trim(),
      url: url.trim(),
      type,
      created_at: new Date().toISOString(),
    };
    setAttachments([...attachments, optimisticAttachment]);
    resetForm();

    const res = await fetch(`/api/projects/${projectId}/attachments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: label.trim(),
        url: url.trim(),
        type,
      }),
    });
    if (res.ok) {
      const attachment = await res.json();
      setAttachments((prev) => prev.map((a) => (a.id === tempId ? attachment : a)));
    }
  };

  const handleDelete = async (attachmentId: string) => {
    setDeleting(true);
    // Optimistic update
    const previousAttachments = attachments;
    setAttachments(attachments.filter((a) => a.id !== attachmentId));
    setDeleteDialogId(null);

    const res = await fetch(`/api/projects/${projectId}/attachments/${attachmentId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setAttachments(previousAttachments);
    }
    setDeleting(false);
  };

  const detectType = (inputUrl: string) => {
    const lower = inputUrl.toLowerCase();
    if (lower.includes("figma.com")) return "figma";
    if (lower.includes("github.com") || lower.includes("gitlab.com") || lower.includes("bitbucket.org")) return "github";
    if (lower.includes("vercel.app") || lower.includes("netlify.app") || lower.includes("herokuapp.com")) return "demo";
    if (lower.includes("docs.google.com") || lower.includes("notion.so") || lower.includes("confluence")) return "document";
    return "link";
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setType(detectType(value));
  };

  return (
    <div className="space-y-4">
      {/* Attachments list */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between bg-card border border-border rounded-lg p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${TYPE_COLORS[a.type] || TYPE_COLORS.link}`}>
                  {TYPE_OPTIONS.find(t => t.value === a.type)?.icon || "🔗"}
                </span>
                <div className="min-w-0">
                  {isValidUrl(a.url) ? (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-accent hover:text-accent-hover transition-colors"
                    >
                      {a.label}
                    </a>
                  ) : (
                    <span className="font-medium text-muted">{a.label}</span>
                  )}
                  <p className="text-xs text-muted truncate">{a.url}</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteDialogId(a.id)}
                className="text-muted hover:text-danger transition-colors ml-2 flex-shrink-0"
                aria-label="Delete attachment"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add attachment form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border border-dashed border-border rounded-lg text-muted hover:border-accent hover:text-accent transition-colors"
        >
          + Add Link
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-4 space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-sm text-muted mb-2">Type</label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                className={`w-full px-4 py-3 rounded-lg border transition-all flex items-center justify-between ${TYPE_COLORS[type]} ${TYPE_HOVER[type]}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{selectedType.icon}</span>
                  <span className="font-medium">{selectedType.label}</span>
                </div>
                <svg
                  className={`w-5 h-5 transition-transform ${typeDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {typeDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                  {TYPE_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setType(t.value);
                        setTypeDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-3 transition-all ${
                        type === t.value
                          ? TYPE_COLORS[t.value]
                          : "hover:bg-border/50"
                      }`}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <span className="font-medium">{t.label}</span>
                      {type === t.value && (
                        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm text-muted mb-2">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Design File"
              className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-accent focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm text-muted mb-2">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={!label.trim() || !url.trim()}
              className="flex-1 px-4 py-3 bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              Add Link
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-3 border border-border rounded-lg hover:border-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {attachments.length === 0 && !showForm && (
        <p className="text-center text-muted text-sm py-4">No links yet</p>
      )}

      <AlertDialog
        open={deleteDialogId !== null}
        onOpenChange={(open) => !open && setDeleteDialogId(null)}
        title="Delete attachment?"
        description="This will remove this link from the project."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteDialogId && handleDelete(deleteDialogId)}
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}
