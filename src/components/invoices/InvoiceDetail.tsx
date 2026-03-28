"use client";

import { useState } from "react";
import type { Invoice } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { AlertDialog } from "@/components/AlertDialog";

interface Props {
  invoice: Invoice;
  currency: string;
  onUpdate: () => void;
  onClose: () => void;
}

const STATUS_BADGES: Record<string, string> = {
  draft: "bg-neutral-500/20 text-muted",
  sent: "bg-accent/20 text-accent",
  paid: "bg-success/20 text-success",
  overdue: "bg-danger/20 text-danger",
  cancelled: "bg-neutral-500/20 text-muted",
};

export function InvoiceDetail({ invoice, currency, onUpdate, onClose }: Props) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const total = (invoice.items || []).reduce((sum, item) => sum + item.amount, 0);
  const badgeClass = STATUS_BADGES[invoice.status] || STATUS_BADGES.draft;

  const handleSend = async () => {
    setActionLoading("send");
    try {
      await fetch(`/api/v1/invoices/${invoice.id}/send`, { method: "POST" });
      onUpdate();
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async () => {
    setActionLoading("paid");
    try {
      await fetch(`/api/v1/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      onUpdate();
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemind = async () => {
    setActionLoading("remind");
    try {
      await fetch(`/api/v1/invoices/${invoice.id}/remind`, { method: "POST" });
      onUpdate();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/invoices/${invoice.id}`, { method: "DELETE" });
      if (res.ok) {
        setShowDeleteDialog(false);
        onUpdate();
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{invoice.number}</h3>
            <span className={`text-xs px-2 py-0.5 rounded ${badgeClass}`}>
              {invoice.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted">
            {invoice.issued_at && <span>Issued {formatDate(invoice.issued_at)}</span>}
            {invoice.due_date && <span>Due {formatDate(invoice.due_date)}</span>}
            {invoice.paid_at && <span>Paid {formatDate(invoice.paid_at)}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted hover:text-foreground transition-colors text-sm"
        >
          &larr; Back
        </button>
      </div>

      {/* Client info */}
      {(invoice.client_name || invoice.client_email) && (
        <div className="text-sm">
          {invoice.client_name && <p>{invoice.client_name}</p>}
          {invoice.client_email && <p className="text-muted">{invoice.client_email}</p>}
        </div>
      )}

      {/* Items table */}
      <div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted text-xs">
              <th className="text-left py-2 font-medium">Description</th>
              <th className="text-right py-2 font-medium w-16">Qty</th>
              <th className="text-right py-2 font-medium w-28">Unit Price</th>
              <th className="text-right py-2 font-medium w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item) => (
              <tr key={item.id} className="border-b border-border/50">
                <td className="py-2">{item.description}</td>
                <td className="py-2 text-right text-muted">{item.quantity}</td>
                <td className="py-2 text-right text-muted">{formatCurrency(item.unit_price, currency)}</td>
                <td className="py-2 text-right">{formatCurrency(item.amount, currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="py-2 text-right font-bold">Total</td>
              <td className="py-2 text-right font-bold">{formatCurrency(total, currency)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Note */}
      {invoice.note && (
        <div className="text-sm">
          <p className="text-muted text-xs mb-1">Note</p>
          <p>{invoice.note}</p>
        </div>
      )}

      {/* Reminder Schedule */}
      {invoice.due_date && (
        <div>
          <p className="text-xs text-muted mb-2 font-medium">Reminder Schedule</p>
          <div className="space-y-1">
            {[
              { type: "before_due" as const, label: "3 days before due" },
              { type: "on_due" as const, label: "On due date" },
              { type: "overdue" as const, label: "7 days after due" },
            ].map((row) => {
              const reminder = (invoice.reminders || []).find((r) => r.type === row.type);
              return (
                <div key={row.type} className="flex items-center justify-between text-xs">
                  <span className="text-muted">{row.label}</span>
                  <span>
                    {reminder ? (
                      reminder.sent_at ? (
                        <span className="text-success">Sent {formatDate(reminder.sent_at)}</span>
                      ) : (
                        <span className="text-accent">{formatDate(reminder.scheduled_for)}</span>
                      )
                    ) : (
                      <span className="text-muted">--</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        {(invoice.status === "draft" || invoice.client_email) && (
          <button
            type="button"
            onClick={handleSend}
            disabled={actionLoading === "send"}
            className="px-3 py-1.5 text-xs bg-accent text-background rounded hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {actionLoading === "send" ? "Sending..." : "Send to Client"}
          </button>
        )}

        {invoice.status !== "paid" && (
          <button
            type="button"
            onClick={handleMarkPaid}
            disabled={actionLoading === "paid"}
            className="px-3 py-1.5 text-xs bg-success/20 text-success rounded hover:bg-success/30 transition-colors disabled:opacity-50"
          >
            {actionLoading === "paid" ? "..." : "Mark as Paid"}
          </button>
        )}

        {(invoice.status === "sent" || invoice.status === "overdue") && (
          <button
            type="button"
            onClick={handleRemind}
            disabled={actionLoading === "remind"}
            className="px-3 py-1.5 text-xs border border-border rounded hover:border-muted transition-colors disabled:opacity-50"
          >
            {actionLoading === "remind" ? "Sending..." : "Send Reminder"}
          </button>
        )}

        <a
          href={`/api/v1/invoices/${invoice.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-xs border border-border rounded hover:border-muted transition-colors"
        >
          Download PDF
        </a>

        {invoice.status === "draft" && (
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="px-3 py-1.5 text-xs text-danger border border-danger/30 rounded hover:bg-danger/10 transition-colors ml-auto"
          >
            Delete
          </button>
        )}
      </div>

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice ${invoice.number}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}
