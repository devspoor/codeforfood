"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertDialog } from "./AlertDialog";
import type { Organization } from "@/lib/types";

export function ProjectActions({ projectId, organizationId }: { projectId: string; organizationId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [transferError, setTransferError] = useState<string>("");
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  const [orgsLoaded, setOrgsLoaded] = useState(false);

  useEffect(() => {
    // Don't fetch if not showing transfer or already loaded
    if (!showTransfer || orgsLoaded) return;

    const abortController = new AbortController();
    setLoadingOrgs(true);

    fetch("/api/organizations", { signal: abortController.signal })
      .then((res) => res.json())
      .then((data) => {
        // Check if component is still mounted (abort wasn't called)
        if (abortController.signal.aborted) return;

        const otherOrgs = (data as Organization[]).filter((org) => org.id !== organizationId);
        setOrganizations(otherOrgs);
        setOrgsLoaded(true);
        if (otherOrgs.length > 0) {
          setSelectedOrgId(otherOrgs[0].id);
        }
      })
      .catch((err) => {
        // Ignore abort errors
        if (err.name === "AbortError") return;
        setTransferError("Failed to load organizations");
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoadingOrgs(false);
        }
      });

    // Cleanup: abort fetch if component unmounts or dependencies change
    return () => {
      abortController.abort();
    };
  }, [showTransfer, organizationId, orgsLoaded]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push(`/admin/organizations/${organizationId}`);
      } else {
        setDeleting(false);
        setShowDeleteDialog(false);
      }
    } catch {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedOrgId) return;

    setTransferring(true);
    setTransferError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetOrganizationId: selectedOrgId }),
      });

      if (res.ok) {
        router.push(`/admin/organizations/${selectedOrgId}`);
        router.refresh();
      } else {
        const data = await res.json();
        setTransferError(data.error || "Transfer failed");
      }
    } catch {
      setTransferError("Transfer failed");
    } finally {
      setTransferring(false);
    }
  };

  if (showTransfer) {
    return (
      <div className="flex flex-col gap-2 p-4 bg-card border border-border rounded-lg min-w-[280px]">
        <span className="text-sm font-medium">Transfer to organization:</span>
        {loadingOrgs ? (
          <span className="text-sm text-muted">Loading...</span>
        ) : organizations.length === 0 ? (
          <span className="text-sm text-muted">No other organizations available</span>
        ) : (
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:border-accent"
            disabled={transferring}
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        )}
        {transferError && (
          <span className="text-sm text-danger">{transferError}</span>
        )}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleTransfer}
            disabled={transferring || !selectedOrgId || organizations.length === 0}
            className="px-3 py-1 bg-accent text-white text-sm rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {transferring ? "Transferring..." : "Transfer"}
          </button>
          <button
            onClick={() => {
              setShowTransfer(false);
              setTransferError("");
            }}
            className="px-3 py-1 border border-border text-sm rounded hover:border-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowTransfer(true)}
          className="text-sm text-muted hover:text-accent transition-colors"
        >
          Transfer
        </button>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="text-sm text-muted hover:text-danger transition-colors"
        >
          Delete
        </button>
      </div>

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete project?"
        description="This action cannot be undone. All milestones, attachments, and comments will be permanently deleted."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        loading={deleting}
        variant="danger"
      />
    </>
  );
}
