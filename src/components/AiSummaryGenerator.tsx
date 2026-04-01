"use client";

import { useState } from "react";

interface Props {
  projectId: string;
  initialSummary?: string | null;
  initialGeneratedAt?: string | null;
}

export function AiSummaryGenerator({ projectId, initialSummary, initialGeneratedAt }: Props) {
  const [summary, setSummary] = useState(initialSummary || "");
  const [generatedAt, setGeneratedAt] = useState(initialGeneratedAt || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/ai/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate");
        return;
      }

      setSummary(data.summary);
      setGeneratedAt(data.generated_at);
    } catch {
      setError("Failed to generate summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {summary ? (
        <>
          <div className="bg-background border border-border rounded-lg p-4 prose prose-sm prose-invert max-w-none">
            <div className="text-sm whitespace-pre-wrap">{summary}</div>
          </div>
          {generatedAt && (
            <p className="text-xs text-muted">
              Generated {new Date(generatedAt).toLocaleDateString()}
            </p>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="text-sm text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Regenerating..." : "Regenerate"}
          </button>
        </>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate AI Summary"}
        </button>
      )}

      {error && <p className="text-danger text-sm">{error}</p>}
    </div>
  );
}
