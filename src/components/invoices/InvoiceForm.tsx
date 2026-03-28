"use client";

import { useState } from "react";
import type { Milestone } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface InvoiceItemDraft {
  description: string;
  quantity: number;
  unit_price: number;
  milestone_id?: string;
}

interface Props {
  projectId: string;
  milestones: Milestone[];
  currency: string;
  onSave: () => void;
  onCancel: () => void;
}

export function InvoiceForm({ projectId, milestones, currency, onSave, onCancel }: Props) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<InvoiceItemDraft[]>([]);
  const [saving, setSaving] = useState(false);

  // Manual item fields
  const [newDesc, setNewDesc] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newPrice, setNewPrice] = useState("");

  // Import from milestones
  const [showImport, setShowImport] = useState(false);
  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState<Set<string>>(new Set());

  const unpaidMilestones = milestones.filter((m) => !m.is_paid);

  const toggleMilestone = (id: string) => {
    setSelectedMilestoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const importSelected = () => {
    const newItems: InvoiceItemDraft[] = [];
    for (const m of unpaidMilestones) {
      if (!selectedMilestoneIds.has(m.id)) continue;

      if (m.type === "hourly") {
        const totalHours = (m.time_entries || []).reduce((sum, e) => sum + (e.hours || 0), 0);
        newItems.push({
          description: `${m.title} (${totalHours}h logged)`,
          quantity: totalHours || 1,
          unit_price: m.hourly_rate || 0,
          milestone_id: m.id,
        });
      } else if (m.type === "per_unit") {
        const totalUnits = (m.time_entries || []).reduce((sum, e) => sum + (e.units || 0), 0);
        newItems.push({
          description: `${m.title} (${totalUnits} ${m.unit_label || "units"})`,
          quantity: totalUnits || 1,
          unit_price: m.unit_rate || 0,
          milestone_id: m.id,
        });
      } else {
        newItems.push({
          description: m.title,
          quantity: 1,
          unit_price: m.amount,
          milestone_id: m.id,
        });
      }
    }
    setItems((prev) => [...prev, ...newItems]);
    setShowImport(false);
    setSelectedMilestoneIds(new Set());
  };

  const addManualItem = () => {
    if (!newDesc.trim() || !newPrice) return;
    setItems((prev) => [
      ...prev,
      {
        description: newDesc.trim(),
        quantity: parseFloat(newQty) || 1,
        unit_price: parseFloat(newPrice) || 0,
      },
    ]);
    setNewDesc("");
    setNewQty("1");
    setNewPrice("");
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const handleSave = async () => {
    if (items.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: clientName || undefined,
          client_email: clientEmail || undefined,
          due_date: dueDate || undefined,
          note: note || undefined,
          items: items.map((item, i) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            milestone_id: item.milestone_id || undefined,
            order: i,
          })),
        }),
      });
      if (res.ok) {
        onSave();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-semibold">New Invoice</h3>

      {/* Client info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-muted mb-1">Client Name</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client name"
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">Client Email</label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="client@example.com"
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none text-sm"
          />
        </div>
      </div>

      {/* Due date and note */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-muted mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">Note</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note"
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none text-sm"
          />
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Items</label>
          {unpaidMilestones.length > 0 && (
            <button
              type="button"
              onClick={() => setShowImport(!showImport)}
              className="text-xs text-accent hover:text-accent-hover transition-colors"
            >
              Import from milestones
            </button>
          )}
        </div>

        {/* Import from milestones panel */}
        {showImport && (
          <div className="bg-background border border-border rounded-lg p-3 mb-3 space-y-2">
            <p className="text-xs text-muted">Select milestones to import:</p>
            {unpaidMilestones.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedMilestoneIds.has(m.id)}
                  onChange={() => toggleMilestone(m.id)}
                  className="rounded"
                />
                <span>{m.title}</span>
                <span className="text-muted text-xs ml-auto">
                  {m.type === "fixed" && formatCurrency(m.amount, currency)}
                  {m.type === "hourly" && `${m.hourly_rate}/hr`}
                  {m.type === "per_unit" && `${m.unit_rate}/${m.unit_label || "unit"}`}
                </span>
              </label>
            ))}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={importSelected}
                disabled={selectedMilestoneIds.size === 0}
                className="px-3 py-1 text-xs bg-accent text-background rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                Import Selected
              </button>
              <button
                type="button"
                onClick={() => setShowImport(false)}
                className="px-3 py-1 text-xs border border-border rounded hover:border-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Item list */}
        {items.length > 0 && (
          <div className="space-y-1 mb-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm bg-background border border-border rounded px-3 py-2">
                <span className="flex-1 truncate">{item.description}</span>
                <span className="text-muted whitespace-nowrap">{item.quantity} x {formatCurrency(item.unit_price, currency)}</span>
                <span className="font-medium whitespace-nowrap">{formatCurrency(item.quantity * item.unit_price, currency)}</span>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="text-muted hover:text-danger transition-colors ml-1"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add manual item */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description"
              className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none text-sm"
            />
          </div>
          <div className="w-20">
            <input
              type="number"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              placeholder="Qty"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none text-sm"
            />
          </div>
          <div className="w-28">
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Price"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none text-sm"
            />
          </div>
          <button
            type="button"
            onClick={addManualItem}
            disabled={!newDesc.trim() || !newPrice}
            className="px-3 py-2 text-sm bg-accent text-background rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-end border-t border-border pt-3">
        <span className="text-sm text-muted mr-2">Total:</span>
        <span className="text-sm font-bold">{formatCurrency(total, currency)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || items.length === 0}
          className="px-4 py-2 bg-accent text-background font-semibold rounded hover:bg-accent-hover transition-colors disabled:opacity-50 text-sm"
        >
          {saving ? "Saving..." : "Create Invoice"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-border rounded hover:border-muted transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
