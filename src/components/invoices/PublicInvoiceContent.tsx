"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { CopyButton } from "@/components/CopyButton";
import type { Invoice, InvoiceItem, PaymentMethod } from "@/lib/types";

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  draft: { label: "Draft", classes: "bg-neutral-500/10 text-muted border-neutral-500/20" },
  sent: { label: "Sent", classes: "bg-accent/10 text-accent border-accent/20" },
  paid: { label: "Paid", classes: "bg-success/10 text-success border-success/20" },
  overdue: { label: "Overdue", classes: "bg-danger/10 text-danger border-danger/20" },
  cancelled: { label: "Cancelled", classes: "bg-neutral-500/10 text-muted border-neutral-500/20" },
};

interface Props {
  invoice: Invoice & { invoice_items: InvoiceItem[] };
  orgName: string;
  paymentMethods: PaymentMethod[];
}

export function PublicInvoiceContent({ invoice, orgName, paymentMethods }: Props) {
  const items = invoice.invoice_items || [];
  const total = items.reduce((sum, item) => sum + Number(item.amount), 0);
  const statusInfo = STATUS_STYLES[invoice.status] || STATUS_STYLES.draft;
  const currency = invoice.currency || "USD";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-pattern opacity-30" />
      </div>

      {/* Content */}
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">INVOICE</h1>
            <div className="flex items-center justify-center gap-3">
              <span className="text-lg font-mono text-muted">{invoice.number}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full border ${statusInfo.classes}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* From / To / Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted uppercase tracking-wider mb-2">From</p>
              <p className="font-semibold">{orgName}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted uppercase tracking-wider mb-2">To</p>
              <p className="font-semibold">{invoice.client_name || "—"}</p>
              {invoice.client_email && (
                <p className="text-sm text-muted">{invoice.client_email}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted uppercase tracking-wider mb-1">Issued</p>
              <p className="font-medium font-mono">
                {invoice.issued_at ? formatDate(invoice.issued_at) : "—"}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted uppercase tracking-wider mb-1">Due Date</p>
              <p className="font-medium font-mono">
                {invoice.due_date ? formatDate(invoice.due_date) : "—"}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border text-xs text-muted uppercase tracking-wider">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>

              {/* Table Rows */}
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/50 last:border-b-0"
                >
                  <div className="col-span-6 text-sm">{item.description}</div>
                  <div className="col-span-2 text-right text-sm font-mono">{item.quantity}</div>
                  <div className="col-span-2 text-right text-sm font-mono">
                    {formatCurrency(Number(item.unit_price), currency)}
                  </div>
                  <div className="col-span-2 text-right text-sm font-mono">
                    {formatCurrency(Number(item.amount), currency)}
                  </div>
                </div>
              ))}

              {/* Total Row */}
              <div className="grid grid-cols-12 gap-2 px-4 py-4 bg-accent/5 border-t border-accent/20">
                <div className="col-span-10 text-right font-semibold">Total</div>
                <div className="col-span-2 text-right font-bold text-lg text-accent font-mono">
                  {formatCurrency(total, currency)}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          {paymentMethods.length > 0 && invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Payment Methods
              </h2>
              <div className="space-y-3">
                {paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className="bg-card border border-border rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold">{pm.label}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full uppercase tracking-wide ${
                        pm.type === "crypto"
                          ? "bg-accent/10 text-accent border border-accent/20"
                          : pm.type === "bank"
                          ? "bg-neutral-500/10 text-foreground border border-neutral-500/20"
                          : "bg-neutral-500/10 text-muted border border-neutral-500/20"
                      }`}>
                        {pm.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm bg-background/50 px-3 py-2.5 rounded-lg border border-border font-mono break-all">
                        {pm.value}
                      </code>
                      <CopyButton text={pm.value} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          {invoice.note && (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[350ms]">
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted uppercase tracking-wider mb-2">Note</p>
                <p className="text-sm whitespace-pre-wrap">{invoice.note}</p>
              </div>
            </div>
          )}

          {/* Download PDF Button */}
          <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[400ms]">
            <a
              href={`/api/v1/invoices/${invoice.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-background font-semibold rounded-xl hover:bg-accent/90 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </a>
          </div>

          {/* Footer */}
          <footer className="pt-8 border-t border-border/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-muted hover:text-accent transition-colors text-xs"
              >
                <span>{"// powered by"}</span>
                <span className="text-accent font-semibold">{"<codeforfood/>"}</span>
              </Link>
              <div className="flex items-center gap-4 text-xs text-muted/50">
                <Link href="/privacy" className="hover:text-muted transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-muted transition-colors">
                  Terms
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
