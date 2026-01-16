"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertDialog } from "./AlertDialog";

export function OrganizationActions({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin/organizations");
      } else {
        setDeleting(false);
        setShowDeleteDialog(false);
      }
    } catch {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowDeleteDialog(true)}
        className="text-sm text-muted hover:text-danger transition-colors"
      >
        Delete
      </button>

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete organization?"
        description="This will permanently delete the organization and all its projects, milestones, attachments, and comments. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        loading={deleting}
        variant="danger"
      />
    </>
  );
}
