"use client";

import { useState, useEffect, useCallback } from "react";
import type { Invoice, Milestone } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { InvoiceForm } from "./InvoiceForm";
import { InvoiceDetail } from "./InvoiceDetail";

interface Props {
  projectId: string;
  milestones: Milestone[];
  currency: string;
}

const STATUS_BADGES: Record<string, string> = {
  draft: "bg-neutral-500/20 text-muted",
  sent: "bg-accent/20 text-accent",
  paid: "bg-success/20 text-success",
  overdue: "bg-danger/20 text-danger",
  cancelled: "bg-neutral-500/20 text-muted",
};

function getInvoiceTotal(invoice: Invoice): number {
  return (invoice.items || []).reduce((sum, item) => sum + item.amount, 0);
}

export function InvoiceList({ projectId, milestones, currency }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/invoices`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(Array.isArray(data) ? data : data.data || []);
      } else {
        const data = await res.json().catch(() => null);
        setFetchError(data?.error || `Failed to load invoices (${res.status})`);
      }
    } catch {
      setFetchError("Network error loading invoices");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleSave = () => {
    setShowForm(false);
    fetchInvoices();
  };

  if (selectedInvoice) {
    return (
      <InvoiceDetail
        invoice={selectedInvoice}
        currency={currency}
        onUpdate={() => {
          fetchInvoices();
          setSelectedInvoice(null);
        }}
        onClose={() => setSelectedInvoice(null)}
      />
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Invoices</h3>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="text-xs text-accent hover:text-accent-hover transition-colors"
        >
          + Create Invoice
        </button>
      </div>

      {showForm && (
        <InvoiceForm
          projectId={projectId}
          milestones={milestones}
          currency={currency}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {fetchError && (
        <p className="text-sm text-danger py-2">{fetchError}</p>
      )}

      {loading ? (
        <p className="text-sm text-muted py-4 text-center">Loading invoices...</p>
      ) : invoices.length === 0 && !fetchError ? (
        <p className="text-sm text-muted py-4 text-center">No invoices yet</p>
      ) : (
        <div className="space-y-2">
          {invoices.map((invoice) => {
            const total = getInvoiceTotal(invoice);
            const badgeClass = STATUS_BADGES[invoice.status] || STATUS_BADGES.draft;

            return (
              <button
                key={invoice.id}
                type="button"
                onClick={() => setSelectedInvoice(invoice)}
                className="w-full flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2 text-left hover:border-muted transition-colors"
              >
                <span className="text-sm font-medium">{invoice.number}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${badgeClass}`}>
                  {invoice.status}
                </span>
                {invoice.client_name && (
                  <span className="text-sm text-muted truncate">{invoice.client_name}</span>
                )}
                <span className="text-sm font-medium ml-auto whitespace-nowrap">
                  {formatCurrency(total, currency)}
                </span>
                {invoice.due_date && (
                  <span className="text-xs text-muted whitespace-nowrap">
                    Due {formatDate(invoice.due_date)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
