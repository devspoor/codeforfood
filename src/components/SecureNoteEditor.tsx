"use client";

import { useState, useEffect } from "react";

interface SecureNoteEditorProps {
  projectId: string;
}

export function SecureNoteEditor({ projectId }: SecureNoteEditorProps) {
  const [hasNote, setHasNote] = useState<boolean | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkNote = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/secure-note`);
        if (res.ok) {
          const data = await res.json();
          setHasNote(data.hasSecureNote);
        }
      } catch {
        console.error("Failed to check secure note");
      }
    };
    checkNote();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setSuccess(null);

    if (!note.trim()) {
      setError("Note content is required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!/[a-zA-Z]/.test(password)) {
      setError("Password must contain at least one letter");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/secure-note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save secure note");
        return;
      }

      setSuccess("Secure note saved successfully!");
      setHasNote(true);
      setIsEditing(false);
      setNote("");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete the secure note? This cannot be undone.")) {
      return;
    }

    // Optimistic update
    setHasNote(false);
    setSuccess("Secure note deleted");
    setTimeout(() => setSuccess(null), 3000);

    const res = await fetch(`/api/projects/${projectId}/secure-note`, {
      method: "DELETE",
    });

    if (!res.ok) {
      // Rollback on error
      setHasNote(true);
      setSuccess(null);
      const data = await res.json();
      setError(data.error || "Failed to delete secure note");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTimeout(() => {
      setNote("");
      setPassword("");
      setConfirmPassword("");
      setError(null);
    }, 0);
  };

  if (hasNote === null) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-5 h-5 bg-border rounded"></div>
          <div className="h-4 bg-border rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
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
          <h3 className="font-semibold">Secure Note</h3>
          {hasNote && (
            <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded">
              Active
            </span>
          )}
        </div>
        {hasNote && !isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-accent hover:text-accent-hover"
            >
              Update
            </button>
            <button
              onClick={handleDelete}
              className="text-sm text-danger hover:text-danger/80"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {success && (
        <div className="mb-4 p-3 bg-success/10 border border-success/30 rounded text-success text-sm">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">
          {error}
        </div>
      )}

      {!isEditing && !hasNote && (
        <div>
          <p className="text-muted text-sm mb-4">
            Add a password-protected note to share sensitive information (credentials, API keys, etc.) with your client.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-accent text-background font-semibold rounded hover:bg-accent-hover transition-colors"
          >
            Add Secure Note
          </button>
        </div>
      )}

      {!isEditing && hasNote && (
        <p className="text-muted text-sm">
          A secure note is attached to this project. Clients can view it on the public page by entering the password you set.
        </p>
      )}

      {isEditing && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Note Content
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter sensitive information here (credentials, API keys, etc.)"
              rows={5}
              className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-accent font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Password {hasNote && <span className="text-muted font-normal">(new password)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars, letter + number"
                className="w-full px-3 py-2 pr-10 bg-background border border-border rounded focus:outline-none focus:border-accent"
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
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-accent text-background font-semibold rounded hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving..." : hasNote ? "Update Note" : "Save Note"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-muted/20 rounded hover:bg-muted/30 transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-muted">
            The note will be encrypted with AES-256-GCM. Share the password with your client separately.
          </p>
        </form>
      )}
    </div>
  );
}
