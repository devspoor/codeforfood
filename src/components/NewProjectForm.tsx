"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewProjectForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    // Close form immediately
    const projectName = name.trim();
    const projectDescription = description.trim() || undefined;
    setShowForm(false);
    setName("");
    setDescription("");
    setIsSubmitting(true);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        name: projectName,
        description: projectDescription,
      }),
    });

    if (res.ok) {
      const project = await res.json();
      router.push(`/admin/projects/${project.id}`);
    } else {
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
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description"
          className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none"
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
