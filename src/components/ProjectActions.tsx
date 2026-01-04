"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProjectActions({ projectId, organizationId }: { projectId: string; organizationId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push(`/admin/organizations/${organizationId}`);
      }
    } catch {
      setDeleting(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">Delete this project?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1 bg-danger text-white text-sm rounded hover:bg-danger/80 transition-colors disabled:opacity-50"
        >
          {deleting ? "..." : "Yes"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-1 border border-border text-sm rounded hover:border-muted transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-sm text-muted hover:text-danger transition-colors"
    >
      Delete
    </button>
  );
}
