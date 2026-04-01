"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

    const toAdd = milestones.filter((_, i) => selected.has(i));
    const errors: string[] = [];

    for (const m of toAdd) {
      try {
        const res = await fetch(`/api/projects/${projectId}/milestones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: m.title,
            description: m.description,
            type: m.type || "fixed",
            amount: m.amount || 0,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          errors.push(`"${m.title}": ${data.error || "Unknown error"}`);
        }
      } catch {
        errors.push(`"${m.title}": Network error`);
      }
    }

    if (errors.length > 0) {
      setError(`Failed to add: ${errors.join(", ")}`);
      setAdding(false);
      return;
    }

    setIsOpen(false);
    setMilestones([]);
    setSelected(new Set());
    setAdding(false);
    router.refresh();
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

  const updateMilestone = (index: number, field: keyof GeneratedMilestone, value: string | number) => {
    setMilestones(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
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

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
      onClick={(e) => { if (e.target === e.currentTarget) { setIsOpen(false); setMilestones([]); setError(""); } }}
    >
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Generate Milestones with AI</h3>
          <button
            onClick={() => { setIsOpen(false); setMilestones([]); setError(""); }}
            className="text-muted hover:text-foreground text-xl leading-none"
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
              {milestones.length} milestones generated. Edit and select which to add:
            </p>

            {milestones.map((m, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 bg-background border rounded-lg transition-colors ${
                  selected.has(i) ? "border-accent/50" : "border-border"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleSelect(i)}
                  className="mt-2"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={m.title}
                      onChange={(e) => updateMilestone(i, "title", e.target.value)}
                      className="flex-1 bg-transparent border border-border rounded px-2 py-1 text-sm font-medium focus:outline-none focus:border-accent"
                    />
                    <div className="relative flex items-center">
                      <span className="absolute left-2 text-xs text-muted">{currency}</span>
                      <input
                        type="number"
                        value={m.amount}
                        onChange={(e) => updateMilestone(i, "amount", Math.max(0, Number(e.target.value) || 0))}
                        className="w-28 bg-transparent border border-border rounded px-2 py-1 pl-12 text-sm font-mono text-accent text-right focus:outline-none focus:border-accent"
                        min="0"
                        step="any"
                      />
                    </div>
                  </div>
                  <textarea
                    value={m.description || ""}
                    onChange={(e) => updateMilestone(i, "description", e.target.value)}
                    placeholder="Description..."
                    rows={2}
                    className="w-full bg-transparent border border-border rounded px-2 py-1 text-xs text-muted resize-none focus:outline-none focus:border-accent"
                  />
                  <span className="text-xs text-muted inline-block bg-border/50 px-1.5 py-0.5 rounded">
                    {m.type}
                  </span>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
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
              <span className="text-xs text-muted font-mono">
                Total: {formatCurrency(
                  milestones.filter((_, i) => selected.has(i)).reduce((sum, m) => sum + (m.amount || 0), 0),
                  currency
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to escape parent transform/overflow that breaks fixed positioning
  if (mounted) {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
