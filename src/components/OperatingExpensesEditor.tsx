"use client";

import { useState } from "react";
import type { OperatingExpense } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { AlertDialog } from "./AlertDialog";

interface Props {
  projectId: string;
  expenses: OperatingExpense[];
  currency?: string;
}

export function OperatingExpensesEditor({ projectId, expenses: initialExpenses, currency = "USD" }: Props) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTimeout(() => {
      setName("");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setDescription("");
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) return;

    if (editingId) {
      // Optimistic update for edit
      setExpenses(expenses.map((exp) =>
        exp.id === editingId
          ? { ...exp, name: name.trim(), amount: numAmount, date, description: description.trim() || undefined }
          : exp
      ));
      resetForm();

      const res = await fetch(`/api/projects/${projectId}/operating-expenses/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          amount: numAmount,
          date,
          description: description.trim() || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setExpenses((prev) => prev.map((exp) => (exp.id === editingId ? updated : exp)));
      }
    } else {
      // Optimistic update for create
      const tempId = `temp-${Date.now()}`;
      const optimisticExpense: OperatingExpense = {
        id: tempId,
        project_id: projectId,
        name: name.trim(),
        amount: numAmount,
        date,
        description: description.trim() || undefined,
        created_at: new Date().toISOString(),
      };
      // Sort by date descending
      const newExpenses = [optimisticExpense, ...expenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setExpenses(newExpenses);
      resetForm();

      const res = await fetch(`/api/projects/${projectId}/operating-expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          amount: numAmount,
          date,
          description: description.trim() || undefined,
        }),
      });
      if (res.ok) {
        const expense = await res.json();
        setExpenses((prev) => prev.map((exp) => (exp.id === tempId ? expense : exp)));
      }
    }
  };

  const handleEdit = (exp: OperatingExpense) => {
    setEditingId(exp.id);
    setShowForm(true);
    setTimeout(() => {
      setName(exp.name);
      setAmount(exp.amount.toString());
      setDate(exp.date);
      setDescription(exp.description || "");
    }, 0);
  };

  const handleDelete = async (expenseId: string) => {
    setDeleting(true);
    // Optimistic update
    const previousExpenses = expenses;
    setExpenses(expenses.filter((exp) => exp.id !== expenseId));
    setDeleteDialogId(null);

    const res = await fetch(`/api/projects/${projectId}/operating-expenses/${expenseId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setExpenses(previousExpenses);
    }
    setDeleting(false);
  };

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <div className="space-y-4">
      {/* Expenses list */}
      {expenses.length > 0 && (
        <div className="space-y-2">
          {expenses.map((exp) => (
            <div key={exp.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{exp.name}</span>
                    <span className="text-xs text-muted">{formatDate(exp.date)}</span>
                  </div>
                  {exp.description && (
                    <p className="text-sm text-muted mt-1 truncate">{exp.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="font-bold text-danger whitespace-nowrap">
                    {formatCurrency(exp.amount, currency)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(exp)}
                      className="text-xs text-muted hover:text-foreground transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteDialogId(exp.id)}
                      className="text-xs text-muted hover:text-danger transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {expenses.length === 0 && !showForm && (
        <p className="text-center text-muted text-sm py-4">No expenses recorded</p>
      )}

      {/* Total summary */}
      {expenses.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-lg">
          <span className="text-sm text-muted">Total Expenses</span>
          <span className="font-bold text-danger">{formatCurrency(totalExpenses, currency)}</span>
        </div>
      )}

      {/* Add expense button/form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border border-dashed border-border rounded-lg text-muted hover:border-accent hover:text-accent transition-colors"
        >
          + Add Expense
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Server hosting, API subscription..."
                className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Amount *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details..."
                rows={2}
                className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none resize-y"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!name.trim() || !amount}
              className="px-4 py-2 bg-accent text-background font-semibold rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {editingId ? "Update" : "Add Expense"}
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
        title="Delete expense?"
        description="This will permanently delete this expense record."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteDialogId && handleDelete(deleteDialogId)}
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}
