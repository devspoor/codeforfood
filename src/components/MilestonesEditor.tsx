"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Milestone, TimeEntry, PaymentHistoryEntry } from "@/lib/types";
import { formatCurrency, formatDate, formatHours } from "@/lib/format";
import { AlertDialog } from "./AlertDialog";
import { MilestoneForm, type MilestoneFormData } from "./milestones";
import {
  getPaymentPercent,
  getMilestoneTotal,
  getTotalHours,
  getTotalUnits,
  getPaidAmount,
} from "./milestones/utils";

interface Props {
  projectId: string;
  milestones: Milestone[];
}

export function MilestonesEditor({ projectId, milestones: initialMilestones }: Props) {
  const router = useRouter();
  const [milestones, setMilestones] = useState(initialMilestones);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Payment and time entry states (kept in main component)
  const [paymentInputs, setPaymentInputs] = useState<Record<string, string>>({});
  const [timeEntryPaymentInputs, setTimeEntryPaymentInputs] = useState<Record<string, string>>({});
  const [showTimeEntry, setShowTimeEntry] = useState<string | null>(null);
  const [timeEntryDate, setTimeEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [timeEntryHours, setTimeEntryHours] = useState("");
  const [timeEntryMinutes, setTimeEntryMinutes] = useState("");
  const [timeEntryUnits, setTimeEntryUnits] = useState("");
  const [timeEntryDesc, setTimeEntryDesc] = useState("");
  const [timeEntryPaidAmount, setTimeEntryPaidAmount] = useState("");
  const [showPaymentHistory, setShowPaymentHistory] = useState<string | null>(null);
  const [deleteDialogMilestoneId, setDeleteDialogMilestoneId] = useState<string | null>(null);
  const [deleteDialogEntryId, setDeleteDialogEntryId] = useState<{ milestoneId: string; entryId: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const editingMilestone = editingId ? milestones.find(m => m.id === editingId) : null;

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleFormSubmit = async (formData: MilestoneFormData) => {
    if (!formData.title.trim()) return;

    if (editingId) {
      const updateData: Record<string, unknown> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
      };
      if (formData.type === "fixed") {
        updateData.amount = Number(formData.amount);
      } else if (formData.type === "hourly") {
        updateData.hourly_rate = Number(formData.hourlyRate);
        updateData.estimated_hours = formData.estimatedHours ? Number(formData.estimatedHours) : undefined;
        updateData.hours_limit = formData.hoursLimit ? Number(formData.hoursLimit) : undefined;
      } else {
        updateData.unit_rate = Number(formData.unitRate);
        updateData.unit_label = formData.unitLabel.trim() || "unit";
        updateData.estimated_units = formData.estimatedUnits ? Number(formData.estimatedUnits) : undefined;
        updateData.units_limit = formData.unitsLimit ? Number(formData.unitsLimit) : undefined;
      }

      // Optimistic update for edit
      setMilestones(milestones.map((m) =>
        m.id === editingId ? { ...m, ...updateData } as Milestone : m
      ));
      resetForm();

      const res = await fetch(`/api/projects/${projectId}/milestones/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (res.ok) {
        const updated = await res.json();
        setMilestones((prev) => prev.map((m) => (m.id === editingId ? { ...m, ...updated } : m)));
        router.refresh(); // Update summary stats
      }
    } else {
      const createData: Record<string, unknown> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
      };
      if (formData.type === "fixed") {
        createData.amount = Number(formData.amount);
      } else if (formData.type === "hourly") {
        createData.hourly_rate = Number(formData.hourlyRate);
        createData.estimated_hours = formData.estimatedHours ? Number(formData.estimatedHours) : undefined;
        createData.hours_limit = formData.hoursLimit ? Number(formData.hoursLimit) : undefined;
      } else {
        // per_unit
        createData.unit_rate = Number(formData.unitRate);
        createData.unit_label = formData.unitLabel.trim() || "unit";
        createData.estimated_units = formData.estimatedUnits ? Number(formData.estimatedUnits) : undefined;
        createData.units_limit = formData.unitsLimit ? Number(formData.unitsLimit) : undefined;
      }

      // Optimistic update for create
      const tempId = `temp-${Date.now()}`;
      const optimisticMilestone: Milestone = {
        id: tempId,
        project_id: projectId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        amount: formData.type === "fixed" ? Number(formData.amount) : 0,
        hourly_rate: formData.type === "hourly" ? Number(formData.hourlyRate) : undefined,
        estimated_hours: formData.type === "hourly" && formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
        hours_limit: formData.type === "hourly" && formData.hoursLimit ? Number(formData.hoursLimit) : undefined,
        unit_rate: formData.type === "per_unit" ? Number(formData.unitRate) : undefined,
        unit_label: formData.type === "per_unit" ? (formData.unitLabel.trim() || "unit") : undefined,
        estimated_units: formData.type === "per_unit" && formData.estimatedUnits ? Number(formData.estimatedUnits) : undefined,
        units_limit: formData.type === "per_unit" && formData.unitsLimit ? Number(formData.unitsLimit) : undefined,
        paid_amount: 0,
        is_paid: false,
        paid_at: undefined,
        order: milestones.length,
        time_entries: [],
        payment_history: [],
        created_at: new Date().toISOString(),
      };
      setMilestones([...milestones, optimisticMilestone]);
      resetForm();

      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createData),
      });
      if (res.ok) {
        const milestone = await res.json();
        setMilestones((prev) => prev.map((m) => (m.id === tempId ? milestone : m)));
        router.refresh(); // Update summary stats
      }
    }
  };

  const handleEdit = (m: Milestone) => {
    setEditingId(m.id);
    setShowForm(true);
  };

  const handleUpdatePaidAmount = async (milestoneId: string, paidAmount: number) => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    if (!milestone) return;

    const oldPaidAmount = milestone.paid_amount || 0;
    const difference = paidAmount - oldPaidAmount;

    // No change needed
    if (difference === 0) return;

    const total = getMilestoneTotal(milestone);
    const isPaid = paidAmount >= total && total > 0;

    // Optimistic update - update UI immediately
    setMilestones(milestones.map((m) =>
      m.id === milestoneId
        ? { ...m, paid_amount: paidAmount, is_paid: isPaid, paid_at: isPaid ? new Date().toISOString() : m.paid_at }
        : m
    ));
    setPaymentInputs((prev) => ({ ...prev, [milestoneId]: "" }));

    // Use atomic payment endpoint - single request handles both milestone update and payment history
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}/payment-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: difference, atomic: true }),
      });

      if (res.ok) {
        const result = await res.json();
        // Update with server response for consistency
        setMilestones((prev) => prev.map((m) =>
          m.id === milestoneId
            ? {
                ...m,
                paid_amount: result.milestone?.paid_amount ?? paidAmount,
                is_paid: result.milestone?.is_paid ?? isPaid,
                paid_at: result.milestone?.paid_at ?? m.paid_at,
                payment_history: result.entry
                  ? [result.entry, ...(m.payment_history || [])]
                  : m.payment_history,
              }
            : m
        ));
        router.refresh(); // Update summary stats
      } else {
        // Rollback on error
        const error = await res.json().catch(() => ({}));
        console.error("Payment update failed:", error.error || "Unknown error");
        setMilestones((prev) => prev.map((m) =>
          m.id === milestoneId
            ? { ...m, paid_amount: oldPaidAmount, is_paid: milestone.is_paid, paid_at: milestone.paid_at }
            : m
        ));
      }
    } catch (err) {
      // Rollback on network error
      console.error("Payment update failed:", err);
      setMilestones((prev) => prev.map((m) =>
        m.id === milestoneId
          ? { ...m, paid_amount: oldPaidAmount, is_paid: milestone.is_paid, paid_at: milestone.paid_at }
          : m
      ));
    }
  };

  const handleDelete = async (milestoneId: string) => {
    setDeleting(true);
    // Optimistic update
    const previousMilestones = milestones;
    setMilestones(milestones.filter((m) => m.id !== milestoneId));
    setDeleteDialogMilestoneId(null);

    const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      // Rollback on error
      setMilestones(previousMilestones);
    } else {
      router.refresh(); // Update summary stats
    }
    setDeleting(false);
  };

  const handleAddTimeEntry = async (milestoneId: string, isUnitEntry: boolean = false) => {
    const hasHours = !isUnitEntry && (timeEntryHours || timeEntryMinutes);
    const hasUnits = isUnitEntry && timeEntryUnits;
    if (!timeEntryDate || (!hasHours && !hasUnits)) return;

    // Validate numeric values - combine hours + minutes into decimal hours
    const hours = hasHours ? (Number(timeEntryHours) || 0) + (Number(timeEntryMinutes) || 0) / 60 : undefined;
    const units = hasUnits ? Number(timeEntryUnits) : undefined;
    const paidAmount = timeEntryPaidAmount ? Number(timeEntryPaidAmount) : 0;

    if (hours !== undefined && (!Number.isFinite(hours) || hours <= 0 || hours > 24)) {
      console.error("Invalid hours value");
      return;
    }
    if (units !== undefined && (!Number.isFinite(units) || units < 1 || units > 10000)) {
      console.error("Invalid units value");
      return;
    }
    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      console.error("Invalid paid amount");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticEntry: TimeEntry = {
      id: tempId,
      milestone_id: milestoneId,
      date: timeEntryDate,
      hours,
      units,
      description: timeEntryDesc.trim() || undefined,
      paid_amount: paidAmount,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    setMilestones(milestones.map((m) =>
      m.id === milestoneId
        ? { ...m, time_entries: [optimisticEntry, ...(m.time_entries || [])] }
        : m
    ));
    setTimeEntryHours("");
    setTimeEntryMinutes("");
    setTimeEntryUnits("");
    setTimeEntryDesc("");
    setTimeEntryPaidAmount("");
    setShowTimeEntry(null);

    const body: Record<string, unknown> = {
      date: timeEntryDate,
      description: timeEntryDesc.trim() || undefined,
      paid_amount: paidAmount,
    };
    if (hours !== undefined) body.hours = hours;
    if (units !== undefined) body.units = units;

    const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}/time-entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const entry = await res.json();
      // Replace temp entry with real one
      setMilestones((prev) => prev.map((m) =>
        m.id === milestoneId
          ? { ...m, time_entries: (m.time_entries || []).map((e) => e.id === tempId ? entry : e) }
          : m
      ));
      router.refresh(); // Update summary stats (hours/units)
    } else {
      // Rollback optimistic update on error
      const errorData = await res.json().catch(() => ({}));
      console.error("Failed to add time entry:", errorData.error || "Unknown error");
      setMilestones((prev) => prev.map((m) =>
        m.id === milestoneId
          ? { ...m, time_entries: (m.time_entries || []).filter((e) => e.id !== tempId) }
          : m
      ));
    }
  };

  const handleDeleteTimeEntry = async (milestoneId: string, entryId: string) => {
    setDeleting(true);
    // Optimistic update
    const previousMilestones = milestones;
    setMilestones(milestones.map((m) =>
      m.id === milestoneId
        ? { ...m, time_entries: (m.time_entries || []).filter((e) => e.id !== entryId) }
        : m
    ));
    setDeleteDialogEntryId(null);

    const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}/time-entries/${entryId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      // Rollback on error
      setMilestones(previousMilestones);
    } else {
      router.refresh(); // Update summary stats
    }
    setDeleting(false);
  };

  const handleUpdateTimeEntryPayment = async (milestoneId: string, entry: TimeEntry, newPaidAmount: number) => {
    // Optimistic update
    setMilestones(milestones.map((ml) =>
      ml.id === milestoneId
        ? {
            ...ml,
            time_entries: (ml.time_entries || []).map((e) =>
              e.id === entry.id ? { ...e, paid_amount: newPaidAmount } : e
            ),
          }
        : ml
    ));
    setTimeEntryPaymentInputs((prev) => ({ ...prev, [entry.id]: "" }));

    const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}/time-entries/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid_amount: newPaidAmount }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMilestones((prev) => prev.map((ml) =>
        ml.id === milestoneId
          ? {
              ...ml,
              time_entries: (ml.time_entries || []).map((e) =>
                e.id === entry.id ? updated : e
              ),
            }
          : ml
      ));
      router.refresh(); // Update summary stats
    } else {
      // Rollback optimistic update on error
      setMilestones((prev) => prev.map((ml) =>
        ml.id === milestoneId
          ? {
              ...ml,
              time_entries: (ml.time_entries || []).map((e) =>
                e.id === entry.id ? { ...e, paid_amount: entry.paid_amount } : e
              ),
            }
          : ml
      ));
    }
  };

  // Memoize sorted milestones to avoid re-sorting on every render
  const sortedMilestones = useMemo(() =>
    [...milestones].sort((a, b) => a.order - b.order),
    [milestones]
  );

  return (
    <div className="space-y-4">
      {milestones.length === 0 && !showForm ? (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-muted mb-4">No milestones yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-accent hover:text-accent-hover transition-colors"
          >
            + Add first milestone
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {sortedMilestones.map((m, index) => {
                const isHourly = m.type === "hourly";
                const isPerUnit = m.type === "per_unit";
                const isTracked = isHourly || isPerUnit;
                const total = getMilestoneTotal(m);
                const paidAmount = getPaidAmount(m);
                const remaining = total - paidAmount;
                const percent = getPaymentPercent(m);
                const inputValue = paymentInputs[m.id] ?? "";
                const totalHours = getTotalHours(m);
                const totalUnits = getTotalUnits(m);

                const isFullyPaid = isTracked ? (paidAmount >= total && total > 0) : m.is_paid;
                const isPartiallyPaid = paidAmount > 0 && paidAmount < total;

                return (
                  <div
                    key={m.id}
                    className={`bg-card border rounded-lg p-4 ${
                      isFullyPaid ? "border-success/30" : isPartiallyPaid ? "border-accent/30" : "border-border"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted text-sm">#{index + 1}</span>
                          <span className={`font-semibold ${isFullyPaid ? "text-success" : ""}`}>
                            {m.title}
                          </span>
                          {isHourly ? (
                            <span className="text-xs bg-neutral-500/20 text-muted px-2 py-0.5 rounded">
                              HOURLY
                            </span>
                          ) : isPerUnit ? (
                            <span className="text-xs bg-neutral-500/20 text-muted px-2 py-0.5 rounded">
                              PER {(m.unit_label || "unit").toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-xs bg-neutral-500/20 text-muted px-2 py-0.5 rounded">
                              FIXED
                            </span>
                          )}
                          {isFullyPaid && (
                            <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded">
                              PAID
                            </span>
                          )}
                          {isPartiallyPaid && (
                            <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
                              PARTIAL
                            </span>
                          )}
                        </div>
                        {m.description && (
                          <p className="text-sm text-muted mt-1">{m.description}</p>
                        )}
                        {isHourly && (
                          <p className="text-xs text-muted mt-1">
                            {formatCurrency(Number(m.hourly_rate || 0))}/hr
                            {m.estimated_hours && ` · Est. ${formatHours(Number(m.estimated_hours))}`}
                            {m.hours_limit && ` · Max ${formatHours(Number(m.hours_limit))}`}
                            {` · Logged: ${formatHours(totalHours)}`}
                          </p>
                        )}
                        {isPerUnit && (
                          <p className="text-xs text-muted mt-1">
                            {formatCurrency(Number(m.unit_rate || 0))}/{m.unit_label || "unit"}
                            {m.estimated_units && ` · Est. ${m.estimated_units}`}
                            {m.units_limit && ` · Max ${m.units_limit}`}
                            {` · Logged: ${totalUnits}`} {m.unit_label || "unit"}{totalUnits !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg tabular-nums font-mono">{formatCurrency(total)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => handleEdit(m)}
                            className="text-xs text-muted hover:text-foreground transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteDialogMilestoneId(m.id)}
                            className="text-xs text-muted hover:text-danger transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-success tabular-nums font-mono">{formatCurrency(paidAmount)} paid</span>
                        <span className="text-muted tabular-nums font-mono">{formatCurrency(remaining)} remaining</span>
                      </div>
                      <div className="h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className={`h-full w-full origin-left ${isFullyPaid ? "bg-success" : "bg-accent"}`}
                          style={{ transform: `scaleX(${percent / 100})` }}
                        />
                      </div>
                    </div>

                    {/* Time entries for hourly milestones */}
                    {isHourly && (
                      <div className="mb-3 border-t border-border pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Time Log</span>
                          <button
                            onClick={() => setShowTimeEntry(showTimeEntry === m.id ? null : m.id)}
                            className="text-xs text-accent hover:text-accent-hover transition-colors"
                          >
                            + Log Time
                          </button>
                        </div>

                        {showTimeEntry === m.id && (
                          <div className="bg-background border border-border rounded p-3 mb-3 space-y-2">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <input
                                type="date"
                                value={timeEntryDate}
                                onChange={(e) => setTimeEntryDate(e.target.value)}
                                className="px-2 py-1 text-sm rounded bg-card border border-border focus:border-accent focus:outline-none"
                              />
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  value={timeEntryHours}
                                  onChange={(e) => setTimeEntryHours(e.target.value)}
                                  placeholder="0h"
                                  min="0"
                                  max="24"
                                  step="1"
                                  className="w-16 px-2 py-1 text-sm rounded bg-card border border-border focus:border-accent focus:outline-none"
                                />
                                <input
                                  type="number"
                                  value={timeEntryMinutes}
                                  onChange={(e) => setTimeEntryMinutes(e.target.value)}
                                  placeholder="0m"
                                  min="0"
                                  max="59"
                                  step="1"
                                  className="w-16 px-2 py-1 text-sm rounded bg-card border border-border focus:border-accent focus:outline-none"
                                />
                              </div>
                              <input
                                type="number"
                                value={timeEntryPaidAmount}
                                onChange={(e) => setTimeEntryPaidAmount(e.target.value)}
                                placeholder={(timeEntryHours || timeEntryMinutes) ? `$${(((Number(timeEntryHours) || 0) + (Number(timeEntryMinutes) || 0) / 60) * Number(m.hourly_rate || 0)).toFixed(0)} paid` : "Paid $"}
                                min="0"
                                step="0.01"
                                className="px-2 py-1 text-sm rounded bg-card border border-border focus:border-accent focus:outline-none"
                              />
                              <button
                                onClick={() => handleAddTimeEntry(m.id, false)}
                                disabled={!timeEntryHours && !timeEntryMinutes}
                                className="px-3 py-1 text-sm bg-accent text-background rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
                              >
                                Add
                              </button>
                            </div>
                            <input
                              type="text"
                              value={timeEntryDesc}
                              onChange={(e) => setTimeEntryDesc(e.target.value)}
                              placeholder="Description (optional)"
                              className="w-full px-2 py-1 text-sm rounded bg-card border border-border focus:border-accent focus:outline-none"
                            />
                          </div>
                        )}

                        {(m.time_entries || []).length > 0 && (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {(m.time_entries || []).map((entry: TimeEntry) => {
                              const entryAmount = Number(entry.hours || 0) * Number(m.hourly_rate || 0);
                              const entryPaid = Number(entry.paid_amount || 0);
                              const entryRemaining = entryAmount - entryPaid;
                              const isPaid = entryPaid >= entryAmount && entryAmount > 0;
                              const inputValue = timeEntryPaymentInputs[entry.id] ?? "";
                              return (
                                <div
                                  key={entry.id}
                                  className={`bg-background rounded px-2 py-2 ${isPaid ? "border-l-2 border-success" : entryPaid > 0 ? "border-l-2 border-accent" : ""}`}
                                >
                                  <div className="flex items-start justify-between text-xs gap-2">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                      <span className="text-muted">{entry.date}</span>
                                      <span className="font-medium">{formatHours(Number(entry.hours || 0))}</span>
                                      <span className={isPaid ? "text-success" : entryPaid > 0 ? "text-accent" : "text-muted"}>
                                        {formatCurrency(entryPaid)}/{formatCurrency(entryAmount)}
                                      </span>
                                      {entry.description && (
                                        <span className="text-muted truncate max-w-[100px] sm:max-w-[150px]">{entry.description}</span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => setDeleteDialogEntryId({ milestoneId: m.id, entryId: entry.id })}
                                      className="text-muted hover:text-danger transition-colors"
                                      aria-label="Delete entry"
                                    >
                                      ×
                                    </button>
                                  </div>
                                  {!isPaid && entryAmount > 0 && (
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      <span className="text-xs text-muted">$</span>
                                      <input
                                        type="number"
                                        value={inputValue}
                                        onChange={(e) => setTimeEntryPaymentInputs((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                                        placeholder={entryRemaining.toFixed(2)}
                                        min="0"
                                        max={entryAmount}
                                        step="0.01"
                                        className="flex-1 px-2 py-1 text-xs rounded bg-card border border-border focus:border-accent focus:outline-none"
                                      />
                                      <button
                                        onClick={() => {
                                          const addAmount = Number(inputValue) || entryRemaining;
                                          const newPaid = Math.min(entryPaid + addAmount, entryAmount);
                                          handleUpdateTimeEntryPayment(m.id, entry, newPaid);
                                        }}
                                        className="px-2 py-1 text-xs bg-accent text-background rounded hover:bg-accent-hover transition-colors"
                                      >
                                        +Add
                                      </button>
                                      <button
                                        onClick={() => handleUpdateTimeEntryPayment(m.id, entry, entryAmount)}
                                        className="px-2 py-1 text-xs border border-success text-success rounded hover:bg-success/10 transition-colors"
                                        title="Pay full amount"
                                      >
                                        Full
                                      </button>
                                      {entryPaid > 0 && (
                                        <button
                                          onClick={() => handleUpdateTimeEntryPayment(m.id, entry, 0)}
                                          className="px-2 py-1 text-xs border border-border text-muted rounded hover:border-danger hover:text-danger transition-colors"
                                        >
                                          Clear
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Unit entries for per_unit milestones */}
                    {isPerUnit && (
                      <div className="mb-3 border-t border-border pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{m.unit_label || "Unit"} Log</span>
                          <button
                            onClick={() => setShowTimeEntry(showTimeEntry === m.id ? null : m.id)}
                            className="text-xs text-accent hover:text-accent-hover transition-colors"
                          >
                            + Log {m.unit_label || "Unit"}
                          </button>
                        </div>

                        {showTimeEntry === m.id && (
                          <div className="bg-background border border-border rounded p-3 mb-3 space-y-2">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <input
                                type="date"
                                value={timeEntryDate}
                                onChange={(e) => setTimeEntryDate(e.target.value)}
                                className="px-2 py-1 text-sm rounded bg-card border border-border focus:border-accent focus:outline-none"
                              />
                              <input
                                type="number"
                                value={timeEntryUnits}
                                onChange={(e) => setTimeEntryUnits(e.target.value)}
                                placeholder={`# of ${m.unit_label || "unit"}s`}
                                min="1"
                                step="1"
                                className="px-2 py-1 text-sm rounded bg-card border border-border focus:border-accent focus:outline-none"
                              />
                              <input
                                type="number"
                                value={timeEntryPaidAmount}
                                onChange={(e) => setTimeEntryPaidAmount(e.target.value)}
                                placeholder={timeEntryUnits ? `$${(Number(timeEntryUnits) * Number(m.unit_rate || 0)).toFixed(0)} paid` : "Paid $"}
                                min="0"
                                step="0.01"
                                className="px-2 py-1 text-sm rounded bg-card border border-border focus:border-accent focus:outline-none"
                              />
                              <button
                                onClick={() => handleAddTimeEntry(m.id, true)}
                                disabled={!timeEntryUnits}
                                className="px-3 py-1 text-sm bg-accent text-background rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
                              >
                                Add
                              </button>
                            </div>
                            <input
                              type="text"
                              value={timeEntryDesc}
                              onChange={(e) => setTimeEntryDesc(e.target.value)}
                              placeholder="Description (optional)"
                              className="w-full px-2 py-1 text-sm rounded bg-card border border-border focus:border-accent focus:outline-none"
                            />
                          </div>
                        )}

                        {(m.time_entries || []).length > 0 && (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {(m.time_entries || []).map((entry: TimeEntry) => {
                              const entryAmount = Number(entry.units || 0) * Number(m.unit_rate || 0);
                              const entryPaid = Number(entry.paid_amount || 0);
                              const entryRemaining = entryAmount - entryPaid;
                              const isPaid = entryPaid >= entryAmount && entryAmount > 0;
                              const inputValue = timeEntryPaymentInputs[entry.id] ?? "";
                              return (
                                <div
                                  key={entry.id}
                                  className={`bg-background rounded px-2 py-2 ${isPaid ? "border-l-2 border-success" : entryPaid > 0 ? "border-l-2 border-accent" : ""}`}
                                >
                                  <div className="flex items-start justify-between text-xs gap-2">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                      <span className="text-muted">{entry.date}</span>
                                      <span className="font-medium">{Number(entry.units || 0)} {m.unit_label || "unit"}{Number(entry.units || 0) !== 1 ? "s" : ""}</span>
                                      <span className={isPaid ? "text-success" : entryPaid > 0 ? "text-accent" : "text-muted"}>
                                        {formatCurrency(entryPaid)}/{formatCurrency(entryAmount)}
                                      </span>
                                      {entry.description && (
                                        <span className="text-muted truncate max-w-[100px] sm:max-w-[150px]">{entry.description}</span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => setDeleteDialogEntryId({ milestoneId: m.id, entryId: entry.id })}
                                      className="text-muted hover:text-danger transition-colors"
                                      aria-label="Delete entry"
                                    >
                                      ×
                                    </button>
                                  </div>
                                  {!isPaid && entryAmount > 0 && (
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      <span className="text-xs text-muted">$</span>
                                      <input
                                        type="number"
                                        value={inputValue}
                                        onChange={(e) => setTimeEntryPaymentInputs((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                                        placeholder={entryRemaining.toFixed(2)}
                                        min="0"
                                        max={entryAmount}
                                        step="0.01"
                                        className="flex-1 px-2 py-1 text-xs rounded bg-card border border-border focus:border-accent focus:outline-none"
                                      />
                                      <button
                                        onClick={() => {
                                          const addAmount = Number(inputValue) || entryRemaining;
                                          const newPaid = Math.min(entryPaid + addAmount, entryAmount);
                                          handleUpdateTimeEntryPayment(m.id, entry, newPaid);
                                        }}
                                        className="px-2 py-1 text-xs bg-accent text-background rounded hover:bg-accent-hover transition-colors"
                                      >
                                        +Add
                                      </button>
                                      <button
                                        onClick={() => handleUpdateTimeEntryPayment(m.id, entry, entryAmount)}
                                        className="px-2 py-1 text-xs border border-success text-success rounded hover:bg-success/10 transition-colors"
                                        title="Pay full amount"
                                      >
                                        Full
                                      </button>
                                      {entryPaid > 0 && (
                                        <button
                                          onClick={() => handleUpdateTimeEntryPayment(m.id, entry, 0)}
                                          className="px-2 py-1 text-xs border border-border text-muted rounded hover:border-danger hover:text-danger transition-colors"
                                        >
                                          Clear
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Payment controls - only for fixed milestones */}
                    {!isTracked && !m.is_paid && total > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-sm text-muted">$</span>
                          <input
                            type="number"
                            value={inputValue}
                            onChange={(e) => setPaymentInputs((prev) => ({ ...prev, [m.id]: e.target.value }))}
                            placeholder={String(remaining.toFixed(2))}
                            min="0"
                            max={total}
                            step="0.01"
                            className="flex-1 px-2 py-1 text-sm rounded bg-background border border-border focus:border-accent focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              const addAmount = Number(inputValue) || remaining;
                              handleUpdatePaidAmount(m.id, paidAmount + addAmount);
                            }}
                            className="px-3 py-1 text-sm bg-accent text-background rounded hover:bg-accent-hover transition-colors"
                          >
                            + Add
                          </button>
                        </div>
                        <button
                          onClick={() => handleUpdatePaidAmount(m.id, total)}
                          className="px-3 py-1 text-sm border border-success text-success rounded hover:bg-success/10 transition-colors"
                        >
                          Pay Full
                        </button>
                        {paidAmount > 0 && (
                          <button
                            onClick={() => handleUpdatePaidAmount(m.id, 0)}
                            className="px-3 py-1 text-sm border border-border text-muted rounded hover:border-danger hover:text-danger transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    )}

                    {/* Paid info - only for fixed milestones */}
                    {!isTracked && m.is_paid && m.paid_at && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted">Paid on {formatDate(m.paid_at)}</p>
                        <button
                          onClick={() => handleUpdatePaidAmount(m.id, 0)}
                          className="text-xs text-muted hover:text-danger transition-colors"
                        >
                          Reset payment
                        </button>
                      </div>
                    )}

                    {/* Payment History */}
                    {!isTracked && (m.payment_history || []).length > 0 && (
                      <div className="border-t border-border pt-3 mt-3">
                        <button
                          onClick={() => setShowPaymentHistory(showPaymentHistory === m.id ? null : m.id)}
                          className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors"
                        >
                          <span>{showPaymentHistory === m.id ? "▼" : "▶"}</span>
                          <span>Payment History ({(m.payment_history || []).length})</span>
                        </button>
                        {showPaymentHistory === m.id && (
                          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                            {(m.payment_history || []).map((entry: PaymentHistoryEntry) => (
                              <div
                                key={entry.id}
                                className="flex items-center justify-between text-xs bg-background rounded px-2 py-1"
                              >
                                <span className="text-muted">{formatDate(entry.created_at)}</span>
                                <span className={entry.amount >= 0 ? "text-success" : "text-danger"}>
                                  {entry.amount >= 0 ? "+" : ""}{formatCurrency(entry.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 border border-dashed border-border rounded-lg text-muted hover:border-accent hover:text-accent transition-colors"
            >
              + Add Milestone
            </button>
          )}
        </>
      )}

      {showForm && (
        <MilestoneForm
          isEditing={!!editingId}
          editingMilestone={editingMilestone}
          onSubmit={handleFormSubmit}
          onCancel={resetForm}
        />
      )}

      <AlertDialog
        open={deleteDialogMilestoneId !== null}
        onOpenChange={(open) => !open && setDeleteDialogMilestoneId(null)}
        title="Delete milestone?"
        description="This will permanently delete the milestone and all its time entries and payment history."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteDialogMilestoneId && handleDelete(deleteDialogMilestoneId)}
        loading={deleting}
        variant="danger"
      />

      <AlertDialog
        open={deleteDialogEntryId !== null}
        onOpenChange={(open) => !open && setDeleteDialogEntryId(null)}
        title="Delete entry?"
        description="This will permanently delete this time/unit entry."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteDialogEntryId && handleDeleteTimeEntry(deleteDialogEntryId.milestoneId, deleteDialogEntryId.entryId)}
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}
