"use client";

import { useState, useEffect } from "react";

interface TelegramStatus {
  connected: boolean;
  username?: string;
  linkedAt?: string;
}

export function TelegramConnect() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/v1/telegram");
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error("Failed to fetch telegram status:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setLinkLoading(true);
    try {
      const res = await fetch("/api/v1/telegram", { method: "POST" });
      const data = await res.json();

      if (data.deepLink) {
        window.open(data.deepLink, "_blank");
        // Poll for connection status
        const pollInterval = setInterval(async () => {
          const statusRes = await fetch("/api/v1/telegram");
          const statusData = await statusRes.json();
          if (statusData.connected) {
            setStatus(statusData);
            clearInterval(pollInterval);
          }
        }, 2000);

        // Stop polling after 2 minutes
        setTimeout(() => clearInterval(pollInterval), 120000);
      }
    } catch (e) {
      console.error("Failed to create link:", e);
    } finally {
      setLinkLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect Telegram?")) return;

    try {
      await fetch("/api/v1/telegram", { method: "DELETE" });
      setStatus({ connected: false });
    } catch (e) {
      console.error("Failed to disconnect:", e);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-4 p-4 bg-background/50 border border-border rounded-lg">
        <div className="size-10 rounded-lg bg-border animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-border rounded w-32 animate-pulse" />
          <div className="h-3 bg-border rounded w-48 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 p-4 bg-background/50 border border-border rounded-lg">
      {/* Telegram Icon */}
      <div className="size-10 rounded-lg bg-[#26A5E4]/10 border border-[#26A5E4]/20 flex items-center justify-center flex-shrink-0">
        <svg className="size-5 text-[#26A5E4]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground">Telegram</h3>

        {status?.connected ? (
          <div className="mt-1">
            <p className="text-sm text-success flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-success" />
              Connected as @{status.username || "unknown"}
            </p>
            <button
              onClick={handleDisconnect}
              className="mt-3 px-3 py-1.5 text-sm border border-danger/30 text-danger rounded-lg hover:bg-danger/10 transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="mt-1">
            <p className="text-sm text-muted">
              Connect to use bot commands in chats
            </p>
            <button
              onClick={handleConnect}
              disabled={linkLoading}
              className="mt-3 px-3 py-1.5 text-sm bg-accent text-background font-medium rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {linkLoading ? "Opening..." : "Connect"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
