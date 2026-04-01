"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GeneratedMilestone } from "@/lib/0g/types";
import { formatCurrency } from "@/lib/format";

interface Props {
  projectId: string;
  projectDescription?: string;
  currency: string;
}

export function AiMilestoneGenerator({ projectId, projectDescription, currency }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState(projectDescription || "");
  const [milestones, setMilestones] = useState<GeneratedMilestone[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError("");
    setMilestones([]);

    try {
      const res = await fetch(`/api/projects/${projectId}/ai/generate-milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate");
        return;
      }

      setMilestones(data.milestones);
      setSelected(new Set(data.milestones.map((_: unknown, i: number) => i)));
    } catch {
      setError("Failed to generate milestones. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (selected.size === 0) return;
    setAdding(true);
    setError("");

    try {
      const toAdd = milestones.filter((_, i) => selected.has(i));

      for (const m of toAdd) {
        const res = await fetch(`/api/projects/${projectId}/milestones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            title: m.title,
            description: m.description,
            type: m.type,
            amount: m.amount,
            estimated_hours: m.estimated_hours,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          console.error("Failed to add milestone:", data.error);
        }
      }

      setIsOpen(false);
      setMilestones([]);
      setSelected(new Set());
      router.refresh();
    } catch {
      setError("Failed to add milestones.");
    } finally {
      setAdding(false);
    }
  };

  const toggleSelect = (index: number) => {
    const next = new Set(selected);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelected(next);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-accent hover:text-accent-hover transition-colors"
      >
        Generate with AI
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Generate Milestones with AI</h3>
          <button
            onClick={() => { setIsOpen(false); setMilestones([]); setError(""); }}
            className="text-muted hover:text-foreground"
          >
            &times;
          </button>
        </div>

        <p className="text-sm text-muted mb-3">
          Describe your project and AI will generate billing milestones.
          Powered by decentralized AI on 0G Network.
        </p>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the project scope, deliverables, and requirements..."
          rows={5}
          className="w-full bg-background border border-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-accent"
          disabled={loading}
        />

        {error && (
          <p className="text-danger text-sm mt-2">{error}</p>
        )}

        {milestones.length === 0 ? (
          <button
            onClick={handleGenerate}
            disabled={loading || !description.trim()}
            className="mt-3 px-4 py-2 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted">
              {milestones.length} milestones generated. Select which to add:
            </p>

            {milestones.map((m, i) => (
              <label
                key={i}
                className="flex items-start gap-3 p-3 bg-background border border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleSelect(i)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{m.title}</span>
                    <span className="text-accent font-mono text-sm whitespace-nowrap">
                      {formatCurrency(m.amount, currency)}
                    </span>
                  </div>
                  {m.description && (
                    <p className="text-xs text-muted mt-1">{m.description}</p>
                  )}
                  <span className="text-xs text-muted mt-1 inline-block bg-border/50 px-1.5 py-0.5 rounded">
                    {m.type}
                  </span>
                </div>
              </label>
            ))}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAdd}
                disabled={adding || selected.size === 0}
                className="px-4 py-2 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {adding ? "Adding..." : `Add ${selected.size} milestone${selected.size !== 1 ? "s" : ""}`}
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-4 py-2 bg-background border border-border rounded-lg text-sm hover:border-accent/50 transition-colors"
              >
                Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
