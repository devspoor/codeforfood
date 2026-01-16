"use client";

import * as React from "react";
import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
  variant?: "danger" | "warning";
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  loading = false,
  variant = "danger",
}: AlertDialogProps) {
  const variantStyles = {
    danger: "bg-danger hover:bg-danger/80",
    warning: "bg-accent hover:bg-accent-hover",
  };

  return (
    <BaseAlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseAlertDialog.Portal>
        <BaseAlertDialog.Backdrop className="fixed inset-0 bg-black/60 z-50" />
        <BaseAlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-xl">
          <BaseAlertDialog.Title className="text-lg font-semibold text-balance">
            {title}
          </BaseAlertDialog.Title>
          <BaseAlertDialog.Description className="mt-2 text-sm text-muted text-pretty">
            {description}
          </BaseAlertDialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <BaseAlertDialog.Close
              className="px-4 py-2 text-sm border border-border rounded hover:border-muted transition-colors"
              disabled={loading}
            >
              {cancelLabel}
            </BaseAlertDialog.Close>
            <button
              onClick={() => {
                onConfirm();
              }}
              disabled={loading}
              className={`px-4 py-2 text-sm text-white rounded transition-colors disabled:opacity-50 ${variantStyles[variant]}`}
            >
              {loading ? "..." : confirmLabel}
            </button>
          </div>
        </BaseAlertDialog.Popup>
      </BaseAlertDialog.Portal>
    </BaseAlertDialog.Root>
  );
}
