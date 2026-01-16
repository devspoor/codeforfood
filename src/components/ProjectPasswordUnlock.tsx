"use client";

import { useState, useEffect } from "react";

interface Props {
  projectHash: string;
  projectName: string;
  onUnlock: () => void;
}

export function ProjectPasswordUnlock({ projectHash, projectName, onUnlock }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

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
      const res = await fetch(`/api/public/projects/${projectHash}/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        onUnlock();
      } else if (res.status === 429) {
        setRetryAfter(data.retryAfter);
        setError(`Too many attempts. Try again in ${Math.ceil(data.retryAfter / 60)} minutes.`);
      } else {
        const remaining = data.attemptsRemaining ?? 0;
        setError(remaining > 0 ? `Incorrect password. ${remaining} attempts remaining.` : "Incorrect password");
        setPassword("");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
