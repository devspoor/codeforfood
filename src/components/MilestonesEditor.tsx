"use client";

import { useState, useMemo } from "react";
import type { Milestone, TimeEntry, PaymentHistoryEntry } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

interface Props {
  projectId: string;
  milestones: Milestone[];
}

// Pure helper functions (outside component to avoid recreation)
const getPaymentPercent = (m: Milestone) => {
  if (m.type === "hourly") {
    const entries = m.time_entries || [];
    const hours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
    const total = hours * Number(m.hourly_rate || 0);
    const paid = entries.reduce((sum, e) => sum + Number(e.paid_amount || 0), 0);
    return total > 0 ? Math.round((paid / total) * 100) : 0;
  }
  const paid = m.paid_amount || 0;
  return m.amount > 0 ? Math.round((paid / m.amount) * 100) : 0;
};

const getMilestoneTotal = (m: Milestone) => {
  if (m.type === "hourly") {
    const hours = (m.time_entries || []).reduce((sum, e) => sum + Number(e.hours), 0);
    return hours * Number(m.hourly_rate || 0);
  }
  return m.amount;
};

const getTotalHours = (m: Milestone) => {
  return (m.time_entries || []).reduce((sum, e) => sum + Number(e.hours), 0);
};

const getPaidAmount = (m: Milestone) => {
  if (m.type === "hourly") {
    return (m.time_entries || []).reduce((sum, e) => sum + Number(e.paid_amount || 0), 0);
  }
  return m.paid_amount || 0;
};

export function MilestonesEditor({ projectId, milestones: initialMilestones }: Props) {
  const [milestones, setMilestones] = useState(initialMilestones);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [milestoneType, setMilestoneType] = useState<"fixed" | "hourly">("fixed");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [hoursLimit, setHoursLimit] = useState("");
  const [paymentInputs, setPaymentInputs] = useState<Record<string, string>>({});
  const [timeEntryPaymentInputs, setTimeEntryPaymentInputs] = useState<Record<string, string>>({});
  const [showTimeEntry, setShowTimeEntry] = useState<string | null>(null);
  const [timeEntryDate, setTimeEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [timeEntryHours, setTimeEntryHours] = useState("");
  const [timeEntryDesc, setTimeEntryDesc] = useState("");
  const [timeEntryPaidAmount, setTimeEntryPaidAmount] = useState("");
  const [showPaymentHistory, setShowPaymentHistory] = useState<string | null>(null);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    // Defer clearing fields to not block UI
    setTimeout(() => {
      setTitle("");
      setDescription("");
      setAmount("");
      setHourlyRate("");
      setEstimatedHours("");
      setHoursLimit("");
      setMilestoneType("fixed");
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingId) {
      const updateData: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
      };
      if (milestoneType === "fixed") {
        updateData.amount = Number(amount);
      } else {
        updateData.hourly_rate = Number(hourlyRate);
        updateData.estimated_hours = estimatedHours ? Number(estimatedHours) : undefined;
        updateData.hours_limit = hoursLimit ? Number(hoursLimit) : undefined;
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
      }
    } else {
      const createData: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        type: milestoneType,
      };
      if (milestoneType === "fixed") {
        createData.amount = Number(amount);
      } else {
        createData.hourly_rate = Number(hourlyRate);
        createData.estimated_hours = estimatedHours ? Number(estimatedHours) : undefined;
        createData.hours_limit = hoursLimit ? Number(hoursLimit) : undefined;
      }

      // Optimistic update for create
      const tempId = `temp-${Date.now()}`;
      const optimisticMilestone: Milestone = {
        id: tempId,
        project_id: projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        type: milestoneType,
        amount: milestoneType === "fixed" ? Number(amount) : 0,
        hourly_rate: milestoneType === "hourly" ? Number(hourlyRate) : undefined,
        estimated_hours: milestoneType === "hourly" && estimatedHours ? Number(estimatedHours) : undefined,
        hours_limit: milestoneType === "hourly" && hoursLimit ? Number(hoursLimit) : undefined,
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
      }
    }
  };

  const handleEdit = (m: Milestone) => {
    setEditingId(m.id);
    setShowForm(true);
    // Defer field population to not block UI
    setTimeout(() => {
      setTitle(m.title);
      setDescription(m.description || "");
      setMilestoneType(m.type || "fixed");
      if (m.type === "hourly") {
        setHourlyRate(String(m.hourly_rate || ""));
        setEstimatedHours(m.estimated_hours ? String(m.estimated_hours) : "");
        setHoursLimit(m.hours_limit ? String(m.hours_limit) : "");
        setAmount("");
      } else {
        setAmount(String(m.amount));
        setHourlyRate("");
        setEstimatedHours("");
        setHoursLimit("");
      }
    }, 0);
  };

  const handleUpdatePaidAmount = async (milestoneId: string, paidAmount: number) => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    const oldPaidAmount = milestone?.paid_amount || 0;
    const difference = paidAmount - oldPaidAmount;
    const total = milestone ? getMilestoneTotal(milestone) : 0;
    const isPaid = paidAmount >= total && total > 0;

    // Optimistic update - update UI immediately
    setMilestones(milestones.map((m) =>
      m.id === milestoneId
        ? { ...m, paid_amount: paidAmount, is_paid: isPaid, paid_at: isPaid ? new Date().toISOString() : m.paid_at }
        : m
    ));
    setPaymentInputs((prev) => ({ ...prev, [milestoneId]: "" }));

    // Fire requests in parallel
    const requests: Promise<Response>[] = [
      fetch(`/api/projects/${projectId}/milestones/${milestoneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount }),
      }),
    ];

    if (difference !== 0) {
      requests.push(
        fetch(`/api/projects/${projectId}/milestones/${milestoneId}/payment-history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: difference }),
        })
      );
    }

    const responses = await Promise.all(requests);

    // Update with server response for consistency
    if (responses[0].ok) {
      const updated = await responses[0].json();
      if (difference !== 0 && responses[1]?.ok) {
        const historyEntry = await responses[1].json();
        setMilestones((prev) => prev.map((m) =>
          m.id === milestoneId
            ? { ...m, ...updated, payment_history: [historyEntry, ...(m.payment_history || [])] }
            : m
        ));
      } else {
        setMilestones((prev) => prev.map((m) => m.id === milestoneId ? { ...m, ...updated } : m));
      }
    }
  };

  const handleDelete = async (milestoneId: string) => {
    // Optimistic update
    const previousMilestones = milestones;
    setMilestones(milestones.filter((m) => m.id !== milestoneId));

    const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      // Rollback on error
      setMilestones(previousMilestones);
    }
  };

  const handleAddTimeEntry = async (milestoneId: string) => {
    if (!timeEntryDate || !timeEntryHours) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticEntry: TimeEntry = {
      id: tempId,
      milestone_id: milestoneId,
      date: timeEntryDate,
      hours: Number(timeEntryHours),
      description: timeEntryDesc.trim() || undefined,
      paid_amount: timeEntryPaidAmount ? Number(timeEntryPaidAmount) : 0,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    setMilestones(milestones.map((m) =>
      m.id === milestoneId
        ? { ...m, time_entries: [optimisticEntry, ...(m.time_entries || [])] }
        : m
    ));
    setTimeEntryHours("");
    setTimeEntryDesc("");
    setTimeEntryPaidAmount("");
    setShowTimeEntry(null);

    const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}/time-entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: timeEntryDate,
        hours: Number(timeEntryHours),
        description: timeEntryDesc.trim() || undefined,
        paid_amount: timeEntryPaidAmount ? Number(timeEntryPaidAmount) : 0,
      }),
    });

    if (res.ok) {
      const entry = await res.json();
      // Replace temp entry with real one
      setMilestones((prev) => prev.map((m) =>
        m.id === milestoneId
          ? { ...m, time_entries: (m.time_entries || []).map((e) => e.id === tempId ? entry : e) }
          : m
      ));
    }
  };

  const handleDeleteTimeEntry = async (milestoneId: string, entryId: string) => {
    // Optimistic update
    const previousMilestones = milestones;
    setMilestones(milestones.map((m) =>
      m.id === milestoneId
        ? { ...m, time_entries: (m.time_entries || []).filter((e) => e.id !== entryId) }
        : m
    ));

    const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}/time-entries/${entryId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      // Rollback on error
      setMilestones(previousMilestones);
    }
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
                const total = getMilestoneTotal(m);
                const paidAmount = getPaidAmount(m);
                const remaining = total - paidAmount;
                const percent = getPaymentPercent(m);
                const inputValue = paymentInputs[m.id] ?? "";
                const totalHours = getTotalHours(m);

                const isFullyPaid = isHourly ? (paidAmount >= total && total > 0) : m.is_paid;
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
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                              HOURLY
                            </span>
                          ) : (
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
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
                            {m.estimated_hours && ` · Est. ${m.estimated_hours}h`}
                            {m.hours_limit && ` · Max ${m.hours_limit}h`}
                            {` · Logged: ${totalHours.toFixed(1)}h`}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(total)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => handleEdit(m)}
                            className="text-xs text-muted hover:text-foreground transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
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
                        <span className="text-success">{formatCurrency(paidAmount)} paid</span>
                        <span className="text-muted">{formatCurrency(remaining)} remaining</span>
                      </div>
                      <div className="h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isFullyPaid ? "bg-success" : "bg-accent"}`}
                          style={{ width: `${percent}%` }}
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
                              <input
                                type="number"
                                value={timeEntryHours}
                                onChange={(e) => setTimeEntryHours(e.target.value)}
                                placeholder="Hours"
                                min="0.25"
                                max="24"
                                step="0.25"
                                className="px-2 py-1 text-sm rounded bg-card border border-border focus:border-accent focus:outline-none"
                              />
                              <input
                                type="number"
                                value={timeEntryPaidAmount}
                                onChange={(e) => setTimeEntryPaidAmount(e.target.value)}
                                placeholder={timeEntryHours ? `$${(Number(timeEntryHours) * Number(m.hourly_rate || 0)).toFixed(0)} paid` : "Paid $"}
                                min="0"
                                step="0.01"
                                className="px-2 py-1 text-sm rounded bg-card border border-border focus:border-accent focus:outline-none"
                              />
                              <button
                                onClick={() => handleAddTimeEntry(m.id)}
                                disabled={!timeEntryHours}
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
                              const entryAmount = Number(entry.hours) * Number(m.hourly_rate || 0);
                              const entryPaid = Number(entry.paid_amount || 0);
                              const entryRemaining = entryAmount - entryPaid;
                              const isPaid = entryPaid >= entryAmount && entryAmount > 0;
                              const inputValue = timeEntryPaymentInputs[entry.id] ?? "";
                              return (
                                <div
                                  key={entry.id}
                                  className={`bg-background rounded px-2 py-2 ${isPaid ? "border-l-2 border-success" : entryPaid > 0 ? "border-l-2 border-accent" : ""}`}
                                >
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-3">
                                      <span className="text-muted">{entry.date}</span>
                                      <span className="font-medium">{Number(entry.hours).toFixed(2)}h</span>
                                      <span className={isPaid ? "text-success" : entryPaid > 0 ? "text-accent" : "text-muted"}>
                                        {formatCurrency(entryPaid)}/{formatCurrency(entryAmount)}
                                      </span>
                                      {entry.description && (
                                        <span className="text-muted truncate max-w-[150px]">{entry.description}</span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => handleDeleteTimeEntry(m.id, entry.id)}
                                      className="text-muted hover:text-danger transition-colors"
                                    >
                                      ×
                                    </button>
                                  </div>
                                  {!isPaid && entryAmount > 0 && (
                                    <div className="flex items-center gap-2 mt-2">
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
                    {!isHourly && !m.is_paid && total > 0 && (
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
                    {!isHourly && m.is_paid && m.paid_at && (
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
                    {!isHourly && (m.payment_history || []).length > 0 && (
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
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-4 space-y-4">
          {/* Type selector */}
          {!editingId && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMilestoneType("fixed")}
                className={`flex-1 py-2 text-sm rounded border transition-colors ${
                  milestoneType === "fixed"
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted hover:border-muted"
                }`}
              >
                Fixed Price
              </button>
              <button
                type="button"
                onClick={() => setMilestoneType("hourly")}
                className={`flex-1 py-2 text-sm rounded border transition-colors ${
                  milestoneType === "hourly"
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted hover:border-muted"
                }`}
              >
                Hourly Rate
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Design Phase"
                className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
                autoFocus
              />
            </div>
            {milestoneType === "fixed" ? (
              <div>
                <label className="block text-sm text-muted mb-1">Amount ($)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm text-muted mb-1">Hourly Rate ($)</label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
                />
              </div>
            )}
          </div>

          {milestoneType === "hourly" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted mb-1">Estimated Hours (optional)</label>
                <input
                  type="number"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  placeholder="e.g. 10"
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Hours Limit (optional)</label>
                <input
                  type="number"
                  value={hoursLimit}
                  onChange={(e) => setHoursLimit(e.target.value)}
                  placeholder="e.g. 20"
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-muted mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this milestone"
              className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!title.trim() || (milestoneType === "fixed" && !amount) || (milestoneType === "hourly" && !hourlyRate)}
              className="px-4 py-2 bg-accent text-background font-semibold rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {editingId ? "Update" : "Add Milestone"}
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
    </div>
  );
}
