"use client";

import { useState, useEffect } from "react";
import type { Milestone } from "@/lib/types";

export type MilestoneType = "fixed" | "hourly" | "per_unit";

export interface MilestoneFormData {
  title: string;
  description: string;
  type: MilestoneType;
  // Fixed
  amount: string;
  // Hourly
  hourlyRate: string;
  estimatedHours: string;
  hoursLimit: string;
  // Per-unit
  unitRate: string;
  unitLabel: string;
  estimatedUnits: string;
  unitsLimit: string;
}

interface Props {
  isEditing: boolean;
  editingMilestone?: Milestone | null;
  onSubmit: (data: MilestoneFormData) => void;
  onCancel: () => void;
}

const initialFormData: MilestoneFormData = {
  title: "",
  description: "",
  type: "fixed",
  amount: "",
  hourlyRate: "",
  estimatedHours: "",
  hoursLimit: "",
  unitRate: "",
  unitLabel: "unit",
  estimatedUnits: "",
  unitsLimit: "",
};

export function MilestoneForm({ isEditing, editingMilestone, onSubmit, onCancel }: Props) {
  const [formData, setFormData] = useState<MilestoneFormData>(initialFormData);

  // Populate form when editing
  useEffect(() => {
    if (editingMilestone) {
      const m = editingMilestone;
      setFormData({
        title: m.title,
        description: m.description || "",
        type: m.type || "fixed",
        amount: m.type === "fixed" ? String(m.amount) : "",
        hourlyRate: m.type === "hourly" ? String(m.hourly_rate || "") : "",
        estimatedHours: m.type === "hourly" && m.estimated_hours ? String(m.estimated_hours) : "",
        hoursLimit: m.type === "hourly" && m.hours_limit ? String(m.hours_limit) : "",
        unitRate: m.type === "per_unit" ? String(m.unit_rate || "") : "",
        unitLabel: m.type === "per_unit" ? (m.unit_label || "unit") : "unit",
        estimatedUnits: m.type === "per_unit" && m.estimated_units ? String(m.estimated_units) : "",
        unitsLimit: m.type === "per_unit" && m.units_limit ? String(m.units_limit) : "",
      });
    } else {
      setFormData(initialFormData);
    }
  }, [editingMilestone]);

  const updateField = <K extends keyof MilestoneFormData>(field: K, value: MilestoneFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSubmit(formData);
  };

  const isValid = formData.title.trim() && (
    (formData.type === "fixed" && formData.amount) ||
    (formData.type === "hourly" && formData.hourlyRate) ||
    (formData.type === "per_unit" && formData.unitRate)
  );

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-4 space-y-4">
      {/* Type selector - only for new milestones */}
      {!isEditing && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateField("type", "fixed")}
            className={`flex-1 py-2 text-sm rounded border transition-colors ${
              formData.type === "fixed"
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:border-muted"
            }`}
          >
            Fixed Price
          </button>
          <button
            type="button"
            onClick={() => updateField("type", "hourly")}
            className={`flex-1 py-2 text-sm rounded border transition-colors ${
              formData.type === "hourly"
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:border-muted"
            }`}
          >
            Hourly Rate
          </button>
          <button
            type="button"
            onClick={() => updateField("type", "per_unit")}
            className={`flex-1 py-2 text-sm rounded border transition-colors ${
              formData.type === "per_unit"
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:border-muted"
            }`}
          >
            Per Unit
          </button>
        </div>
      )}

      {/* Title and main amount field */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-muted mb-1">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="e.g. Design Phase"
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
            autoFocus
          />
        </div>
        {formData.type === "fixed" && (
          <div>
            <label className="block text-sm text-muted mb-1">Amount ($)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => updateField("amount", e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
            />
          </div>
        )}
        {formData.type === "hourly" && (
          <div>
            <label className="block text-sm text-muted mb-1">Hourly Rate ($)</label>
            <input
              type="number"
              value={formData.hourlyRate}
              onChange={(e) => updateField("hourlyRate", e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
            />
          </div>
        )}
        {formData.type === "per_unit" && (
          <div>
            <label className="block text-sm text-muted mb-1">Rate per Unit ($)</label>
            <input
              type="number"
              value={formData.unitRate}
              onChange={(e) => updateField("unitRate", e.target.value)}
              placeholder="e.g. 30"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Hourly specific fields */}
      {formData.type === "hourly" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted mb-1">Estimated Hours (optional)</label>
            <input
              type="number"
              value={formData.estimatedHours}
              onChange={(e) => updateField("estimatedHours", e.target.value)}
              placeholder="e.g. 10"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Hours Limit (optional)</label>
            <input
              type="number"
              value={formData.hoursLimit}
              onChange={(e) => updateField("hoursLimit", e.target.value)}
              placeholder="e.g. 20"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Per-unit specific fields */}
      {formData.type === "per_unit" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-muted mb-1">Unit Name</label>
            <input
              type="text"
              value={formData.unitLabel}
              onChange={(e) => updateField("unitLabel", e.target.value)}
              placeholder="e.g. app, screen, widget"
              className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Estimated Units (optional)</label>
            <input
              type="number"
              value={formData.estimatedUnits}
              onChange={(e) => updateField("estimatedUnits", e.target.value)}
              placeholder="e.g. 5"
              min="0"
              step="1"
              className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Units Limit (optional)</label>
            <input
              type="number"
              value={formData.unitsLimit}
              onChange={(e) => updateField("unitsLimit", e.target.value)}
              placeholder="e.g. 10"
              min="0"
              step="1"
              className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm text-muted mb-1">Description (optional)</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Brief description of this milestone"
          className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!isValid}
          className="px-4 py-2 bg-accent text-background font-semibold rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isEditing ? "Update" : "Add Milestone"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-border rounded hover:border-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
