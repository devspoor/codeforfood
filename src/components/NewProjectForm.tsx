"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CURRENCIES } from "@/lib/currencies";
import { Select } from "@/components/ui/Select";

export function NewProjectForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setLimitReached(false);

    const projectName = name.trim();
    const projectDescription = description.trim() || undefined;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          name: projectName,
          description: projectDescription,
          currency,
        }),
      });

      if (res.ok) {
        const project = await res.json();
        // Only reset form and navigate on success
        setShowForm(false);
        setName("");
        setDescription("");
        router.push(`/admin/projects/${project.id}`);
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.code === "LIMIT_REACHED") {
          setLimitReached(true);
        }
        setError(data.error || "Failed to create project");
        setIsSubmitting(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full py-3 border border-dashed border-border rounded-lg text-muted hover:border-accent hover:text-accent transition-colors"
      >
        + New Project
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-4 space-y-4">
      {error && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">
          {error}
          {limitReached && (
            <Link
              href="/admin/settings/billing"
              className="ml-2 text-accent hover:underline"
            >
              Upgrade now →
            </Link>
          )}
        </div>
      )}
      <div>
        <label className="block text-sm text-muted mb-1">Project Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Website Redesign"
          className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-sm text-muted mb-1">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description"
          rows={2}
          className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none resize-y"
        />
      </div>
      <div>
        <label className="block text-sm text-muted mb-1">Currency</label>
        <Select
          value={currency}
          onChange={setCurrency}
          options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} — ${c.symbol} — ${c.name}` }))}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!name.trim()}
          className="px-4 py-2 bg-accent text-background font-semibold rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          Create Project
        </button>
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setTimeout(() => {
              setName("");
              setDescription("");
            }, 0);
          }}
          className="px-4 py-2 border border-border rounded hover:border-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
