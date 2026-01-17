"use client";

import { useState, useEffect } from "react";
import { PublicProjectContent } from "./PublicProjectContent";
import type { Project, ProjectSummary } from "@/lib/types";

interface Props {
  hash: string;
  projectName: string;
}

interface ProjectData {
  project: Project;
  org: {
    hash: string;
    name: string;
    payment_methods?: Array<{ id: string; label: string; type: string; value: string }>;
  } | null;
  summary: ProjectSummary;
  statusInfo: { label: string; color: string };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  in_progress: { label: "In Progress", color: "bg-blue-500/20 text-blue-400" },
  awaiting_payment: { label: "Awaiting Payment", color: "bg-yellow-500/20 text-yellow-400" },
  completed: { label: "Completed", color: "bg-success/20 text-success" },
  on_hold: { label: "On Hold", color: "bg-gray-500/20 text-gray-400" },
};

export function ProtectedProjectGate({ hash, projectName }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);

  // Clear retryAfter after the specified time
  useEffect(() => {
    if (retryAfter === null) return;

    const timer = setTimeout(() => {
      setRetryAfter(null);
      setError("");
    }, retryAfter * 1000);

    return () => clearTimeout(timer);
  }, [retryAfter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading || retryAfter !== null) return;

    setLoading(true);
    setError("");

    try {
      // Step 1: Verify password
      const verifyRes = await fetch(`/api/public/projects/${hash}/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      if (verifyRes.status === 429) {
        const data = await verifyRes.json();
        setRetryAfter(data.retryAfter);
        setError(`Too many attempts. Try again in ${Math.ceil(data.retryAfter / 60)} minutes.`);
        setLoading(false);
        return;
      }

      if (!verifyRes.ok) {
        setError("Incorrect password");
        setPassword("");
        setLoading(false);
        return;
      }

      // Step 2: Password verified - fetch project data
      const dataRes = await fetch(`/api/public/projects/${hash}/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      if (!dataRes.ok) {
        setError("Failed to load project data");
        setLoading(false);
        return;
      }

      const data = await dataRes.json();
      const statusInfo = STATUS_LABELS[data.project.status] || STATUS_LABELS.in_progress;

      setProjectData({
        project: data.project,
        org: data.org,
        summary: data.summary,
        statusInfo,
      });
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // If unlocked, show the full content
  if (projectData) {
    return (
      <PublicProjectContent
        hash={hash}
        project={projectData.project}
        org={projectData.org}
        summary={projectData.summary}
        statusInfo={projectData.statusInfo}
      />
    );
  }

  // Show password form
  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <p className="text-accent text-sm mb-4">{"<codeforfood/>"}</p>
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-xl font-bold">{projectName}</h1>
          <p className="text-muted text-sm mt-2">This project is password protected</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={loading || retryAfter !== null}
              className="w-full px-3 py-2 rounded bg-background border border-border focus:border-accent focus:outline-none disabled:opacity-50"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-danger text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim() || retryAfter !== null}
            className="w-full py-2 bg-accent text-background font-semibold rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Unlock"}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-8">
          {"// powered by <codeforfood/>"}
        </p>
      </div>
    </div>
  );
}
