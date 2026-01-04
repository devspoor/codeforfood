"use client";

import { useState } from "react";
import { CopyButton } from "./CopyButton";

interface SecureNoteUnlockProps {
  projectHash: string;
}

export function SecureNoteUnlock({ projectHash }: SecureNoteUnlockProps) {
  const [password, setPassword] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/public/projects/${projectHash}/secure-note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setRetryAfter(data.retryAfter);
          setError(`Too many attempts. Try again in ${Math.ceil(data.retryAfter / 60)} minutes.`);
        } else if (res.status === 401) {
          const remaining = data.attemptsRemaining ?? 0;
          setError(`Invalid password. ${remaining} attempts remaining.`);
        } else {
          setError(data.error || "Failed to unlock");
        }
        return;
      }

      setNote(data.note);
      setPassword("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLock = () => {
    setNote(null);
    setTimeout(() => setError(null), 0);
  };

  // If note is unlocked, show it
  if (note) {
    return (
      <div className="bg-card border border-accent/50 rounded-lg overflow-hidden">
        <div className="bg-accent/10 px-4 py-3 flex items-center justify-between border-b border-accent/30">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
              />
            </svg>
            <span className="font-semibold text-sm">Secure Note</span>
          </div>
          <div className="flex items-center gap-2">
            <CopyButton text={note} />
            <button
              onClick={handleLock}
              className="px-3 py-1.5 text-sm bg-muted/20 hover:bg-muted/30 rounded border border-border transition-colors"
            >
              Lock
            </button>
          </div>
        </div>
        <div className="p-4">
          <pre className="whitespace-pre-wrap break-words text-sm font-mono bg-background/50 rounded p-3 border border-border">
            {note}
          </pre>
        </div>
      </div>
    );
  }

  // Show unlock form
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-5 h-5 text-accent"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <h3 className="font-semibold">Secure Note Available</h3>
      </div>
      <p className="text-muted text-sm mb-4">
        This project has a password-protected note. Enter the password to view it.
      </p>
      <form onSubmit={handleUnlock} className="space-y-3">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            disabled={loading || retryAfter !== null}
            className="w-full px-3 py-2 pr-10 bg-background border border-border rounded focus:outline-none focus:border-accent disabled:opacity-50"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-1"
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {error && (
          <p className="text-danger text-sm">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !password.trim() || retryAfter !== null}
          className="w-full px-4 py-2 bg-accent text-background font-semibold rounded hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Unlocking..." : "Unlock Note"}
        </button>
      </form>
    </div>
  );
}
