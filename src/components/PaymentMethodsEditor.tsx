"use client";

import { useState } from "react";
import type { PaymentMethod } from "@/lib/types";
import { AlertDialog } from "./AlertDialog";
import { Select } from "@/components/ui/Select";

interface Props {
  organizationId: string;
  paymentMethods: PaymentMethod[];
}

export function PaymentMethodsEditor({ organizationId, paymentMethods }: Props) {
  const [methods, setMethods] = useState(paymentMethods);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [type, setType] = useState<"crypto" | "bank" | "other">("crypto");
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTimeout(() => {
      setLabel("");
      setValue("");
      setType("crypto");
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !value.trim()) return;

    if (editingId) {
      // Optimistic update for edit
      const optimisticMethod = { id: editingId, label: label.trim(), value: value.trim(), type };
      setMethods(methods.map((m) => (m.id === editingId ? { ...m, ...optimisticMethod } : m)));
      resetForm();

      const res = await fetch(`/api/organizations/${organizationId}/payment-methods/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), value: value.trim(), type }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMethods((prev) => prev.map((m) => (m.id === editingId ? updated : m)));
      }
    } else {
      // Optimistic update for create
      const tempId = `temp-${Date.now()}`;
      const optimisticMethod = { id: tempId, label: label.trim(), value: value.trim(), type };
      setMethods([...methods, optimisticMethod as PaymentMethod]);
      resetForm();

      const res = await fetch(`/api/organizations/${organizationId}/payment-methods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), value: value.trim(), type }),
      });
      if (res.ok) {
        const pm = await res.json();
        setMethods((prev) => prev.map((m) => (m.id === tempId ? pm : m)));
      }
    }
  };

  const handleEdit = (pm: PaymentMethod) => {
    setEditingId(pm.id);
    setShowForm(true);
    setTimeout(() => {
      setLabel(pm.label);
      setValue(pm.value);
      setType(pm.type);
    }, 0);
  };

  const handleDelete = async (pmId: string) => {
    setDeleting(true);
    // Optimistic update
    const previousMethods = methods;
    setMethods(methods.filter((m) => m.id !== pmId));
    setDeleteDialogId(null);

    const res = await fetch(`/api/organizations/${organizationId}/payment-methods/${pmId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      // Rollback on error
      setMethods(previousMethods);
    }
    setDeleting(false);
  };

  return (
    <div className="space-y-4">
      {methods.length === 0 && !showForm ? (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-muted mb-4">No payment methods configured</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-accent hover:text-accent-hover transition-colors"
          >
            + Add payment method
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {methods.map((pm) => (
              <div
                key={pm.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{pm.label}</span>
                    <span className="text-xs bg-border px-2 py-0.5 rounded text-muted">{pm.type}</span>
                  </div>
                  <p className="text-sm text-muted mt-1 font-mono break-all">{pm.value}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(pm)}
                    className="text-sm text-muted hover:text-foreground transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteDialogId(pm.id)}
                    className="text-sm text-muted hover:text-danger transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-accent hover:text-accent-hover transition-colors text-sm"
            >
              + Add payment method
            </button>
          )}
        </>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1">Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Bitcoin, Bank Wire"
                className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Type</label>
              <Select
                value={type}
                onChange={(v) => setType(v as "crypto" | "bank" | "other")}
                options={[
                  { value: "crypto", label: "Crypto" },
                  { value: "bank", label: "Bank" },
                  { value: "other", label: "Other" },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Value</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Address or account number"
                className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!label.trim() || !value.trim()}
              className="px-4 py-2 bg-accent text-background font-semibold rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {editingId ? "Update" : "Add"}
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

      <AlertDialog
        open={deleteDialogId !== null}
        onOpenChange={(open) => !open && setDeleteDialogId(null)}
        title="Delete payment method?"
        description="This will remove this payment method from your organization."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteDialogId && handleDelete(deleteDialogId)}
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}
