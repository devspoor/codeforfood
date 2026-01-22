"use client";

import { useState } from "react";
import type { ProjectStatus } from "@/lib/types";

interface Props {
  projectId: string;
  status: ProjectStatus;
  hideAmounts: boolean;
  hidePaid: boolean;
  showPaymentHistory: boolean;
  showExpenses: boolean;
  showTasksBoard: boolean;
  hasPassword: boolean;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string; color: string }[] = [
  { value: "in_progress", label: "In Progress", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "awaiting_payment", label: "Awaiting Payment", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { value: "completed", label: "Completed", color: "bg-success/20 text-success border-success/30" },
  { value: "on_hold", label: "On Hold", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
];

export function ProjectSettingsEditor({
  projectId,
  status: initialStatus,
  hideAmounts: initialHideAmounts,
  hidePaid: initialHidePaid,
  showPaymentHistory: initialShowPaymentHistory,
  showExpenses: initialShowExpenses,
  showTasksBoard: initialShowTasksBoard,
  hasPassword: initialHasPassword,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [hideAmounts, setHideAmounts] = useState(initialHideAmounts);
  const [hidePaid, setHidePaid] = useState(initialHidePaid);
  const [showPaymentHistory, setShowPaymentHistory] = useState(initialShowPaymentHistory);
  const [showExpenses, setShowExpenses] = useState(initialShowExpenses);
  const [showTasksBoard, setShowTasksBoard] = useState(initialShowTasksBoard);
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState("");

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    // Optimistic update
    const previousStatus = status;
    setStatus(newStatus);

    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      // Rollback on error
      setStatus(previousStatus);
    }
  };

  const handleVisibilityChange = async (field: "hide_amounts" | "hide_paid" | "show_payment_history" | "show_expenses" | "tasks_board_public", value: boolean) => {
    // Optimistic update
    const previousValues = { hideAmounts, hidePaid, showPaymentHistory, showExpenses, showTasksBoard };
    if (field === "hide_amounts") setHideAmounts(value);
    if (field === "hide_paid") setHidePaid(value);
    if (field === "show_payment_history") setShowPaymentHistory(value);
    if (field === "show_expenses") setShowExpenses(value);
    if (field === "tasks_board_public") setShowTasksBoard(value);

    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (!res.ok) {
      // Rollback on error
      setHideAmounts(previousValues.hideAmounts);
      setHidePaid(previousValues.hidePaid);
      setShowPaymentHistory(previousValues.showPaymentHistory);
      setShowExpenses(previousValues.showExpenses);
      setShowTasksBoard(previousValues.showTasksBoard);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPassword = password.trim();
    if (!trimmedPassword) return;

    // Optimistic update
    setHasPassword(true);
    setPassword("");
    setShowPasswordForm(false);

    const res = await fetch(`/api/projects/${projectId}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: trimmedPassword }),
    });
    if (!res.ok) {
      // Rollback on error
      setHasPassword(false);
    }
  };

  const handleRemovePassword = async () => {
    // Optimistic update
    setHasPassword(false);

    const res = await fetch(`/api/projects/${projectId}/password`, {
      method: "DELETE",
    });
    if (!res.ok) {
      // Rollback on error
      setHasPassword(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Status */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Project Status</h3>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              className={`px-3 py-2 text-sm rounded border transition-colors ${
                status === opt.value ? opt.color : "border-border text-muted hover:border-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visibility Settings */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Public Page Visibility</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hideAmounts}
              onChange={(e) => handleVisibilityChange("hide_amounts", e.target.checked)}
              className="w-4 h-4 rounded border-border bg-background accent-accent"
            />
            <div>
              <span className="text-sm">Hide amounts</span>
              <p className="text-xs text-muted">Don&apos;t show total, paid, and due amounts</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hidePaid}
              onChange={(e) => handleVisibilityChange("hide_paid", e.target.checked)}
              className="w-4 h-4 rounded border-border bg-background accent-accent"
            />
            <div>
              <span className="text-sm">Hide payment status</span>
              <p className="text-xs text-muted">Don&apos;t show which milestones are paid</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showPaymentHistory}
              onChange={(e) => handleVisibilityChange("show_payment_history", e.target.checked)}
              className="w-4 h-4 rounded border-border bg-background accent-accent"
            />
            <div>
              <span className="text-sm">Show payment history</span>
              <p className="text-xs text-muted">Show payment dates and amounts on public page</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showExpenses}
              onChange={(e) => handleVisibilityChange("show_expenses", e.target.checked)}
              className="w-4 h-4 rounded border-border bg-background accent-accent"
            />
            <div>
              <span className="text-sm">Show operating expenses</span>
              <p className="text-xs text-muted">Show project expenses on public page</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showTasksBoard}
              onChange={(e) => handleVisibilityChange("tasks_board_public", e.target.checked)}
              className="w-4 h-4 rounded border-border bg-background accent-accent"
            />
            <div>
              <span className="text-sm">Show tasks board</span>
              <p className="text-xs text-muted">Display task board on public page (read-only)</p>
            </div>
          </label>
        </div>
      </div>

      {/* Password Protection */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Password Protection</h3>
        {hasPassword ? (
          <div className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-success text-lg">🔒</span>
              <span className="text-sm">Public page is password protected</span>
            </div>
            <button
              onClick={handleRemovePassword}
              className="text-xs text-danger hover:text-danger/80 transition-colors"
            >
              Remove password
            </button>
          </div>
        ) : showPasswordForm ? (
          <form onSubmit={handleSetPassword} className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a password"
                minLength={12}
                className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
                autoFocus
              />
              <p className="text-xs text-muted mt-1">Minimum 12 characters</p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={password.length < 12}
                className="px-4 py-2 bg-accent text-background font-semibold rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                Set Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setTimeout(() => setPassword(""), 0);
                }}
                className="px-4 py-2 border border-border rounded hover:border-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="w-full py-3 border border-dashed border-border rounded-lg text-muted hover:border-accent hover:text-accent transition-colors"
          >
            + Add Password Protection
          </button>
        )}
      </div>
    </div>
  );
}
