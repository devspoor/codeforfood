"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Project, ProjectSummary, Milestone, TimeEntry, Comment, Attachment, PaymentHistoryEntry, OperatingExpense } from "@/lib/types";
import { formatCurrency, formatDate, formatHours } from "@/lib/format";
import { exportMilestonesToCSV } from "@/lib/exportCsv";
import { CopyButton } from "@/components/CopyButton";
import { SecureNoteUnlock } from "@/components/SecureNoteUnlock";
import { PublicTaskBoard } from "@/components/tasks/PublicTaskBoard";

// Helper functions moved outside component to avoid recreation
const getMilestoneTotal = (m: Milestone) => {
  if (m.type === "hourly") {
    const hours = (m.time_entries || []).reduce((sum, e) => sum + Number(e.hours), 0);
    return hours * Number(m.hourly_rate || 0);
  }
  return m.amount;
};

const getTotalHours = (m: Milestone) => {
  return (m.time_entries || []).reduce((sum, e) => sum + Number(e.hours), 0);
};

const getPaidAmount = (m: Milestone) => {
  if (m.type === "hourly") {
    return (m.time_entries || []).reduce((sum, e) => sum + Number(e.paid_amount || 0), 0);
  }
  return m.paid_amount || 0;
};

interface Props {
  hash: string;
  project: Project;
  org: {
    hash: string;
    name: string;
    payment_methods?: Array<{ id: string; label: string; type: string; value: string }>;
  } | null;
  summary: ProjectSummary;
  statusInfo: { label: string; color: string };
}

const ATTACHMENT_ICONS: Record<string, { icon: string; color: string }> = {
  figma: { icon: "M12 2L7 7h3v6H7l5 5 5-5h-3V7h3L12 2z", color: "text-muted" },
  github: { icon: "M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z", color: "text-muted" },
  demo: { icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z", color: "text-success" },
  document: { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "text-muted" },
  link: { icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1", color: "text-accent" },
};

const STATUS_STYLES: Record<string, string> = {
  in_progress: "bg-neutral-500/10 text-foreground border-neutral-500/20",
  awaiting_payment: "bg-accent/10 text-accent border-accent/20",
  completed: "bg-success/10 text-success border-success/20",
  on_hold: "bg-neutral-500/10 text-muted border-neutral-500/20",
};

export function PublicProjectContent({ hash, project, org, summary, statusInfo }: Props) {
  // Memoize sorted milestones
  const sortedMilestones = useMemo(() =>
    [...(project.milestones || [])].sort((a, b) => a.order - b.order),
    [project.milestones]
  );

  // Calculate unpaid hours
  const unpaidHours = useMemo(() => {
    let hours = 0;
    (project.milestones || []).forEach(m => {
      if (m.type === "hourly") {
        (m.time_entries || []).forEach(e => {
          const entryAmount = Number(e.hours) * Number(m.hourly_rate || 0);
          const entryPaid = Number(e.paid_amount || 0);
          if (entryPaid < entryAmount) {
            hours += Number(e.hours) - (entryPaid / Number(m.hourly_rate || 1));
          }
        });
      }
    });
    return hours;
  }, [project.milestones]);

  const hideAmounts = project.hide_amounts;
  const hidePaid = project.hide_paid;
  const showPaymentHistory = project.show_payment_history;
  const showExpenses = project.show_expenses;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-pattern opacity-30" />
      </div>

      {/* Content */}
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <Image
              src="/logo.png"
              alt="codeforfood"
              width={40}
              height={40}
              className="size-10 mx-auto mb-4"
            />
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold">{project.name}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_STYLES[project.status] || STATUS_STYLES.in_progress}`}>
                {statusInfo.label}
              </span>
            </div>
            {org && (
              <Link
                href={`/o/${org.hash}`}
                className="inline-flex items-center gap-1.5 text-muted hover:text-accent transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>by {org.name}</span>
              </Link>
            )}
            {project.description && (
              <p className="text-muted mt-3 text-sm max-w-md mx-auto whitespace-pre-wrap">{project.description}</p>
            )}
          </div>

          {/* Summary Cards */}
          {!hideAmounts && (
            <div className={`grid gap-3 sm:gap-4 mb-8 ${hidePaid ? 'grid-cols-2' : 'grid-cols-3'}`}>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-muted text-xs mb-1 uppercase tracking-wider">Total</p>
                <p className="text-lg sm:text-xl font-bold text-accent font-mono">{formatCurrency(summary.totalAmount)}</p>
              </div>
              {!hidePaid && (
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="text-muted text-xs mb-1 uppercase tracking-wider">Paid</p>
                  <p className="text-lg sm:text-xl font-bold text-success font-mono">{formatCurrency(summary.paidAmount)}</p>
                </div>
              )}
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-muted text-xs mb-1 uppercase tracking-wider">Due</p>
                <p className="text-lg sm:text-xl font-bold text-danger font-mono">{formatCurrency(summary.remainingAmount)}</p>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {!hideAmounts && !hidePaid && (
            <div className="mb-10">
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-muted">Payment Progress</span>
                  <span className="font-bold text-lg font-mono">{summary.percentPaid}%</span>
                </div>
                <div className="h-3 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-success to-accent"
                    style={{ width: `${summary.percentPaid}%` }}
                  />
                </div>
                <p className="text-xs text-muted mt-3 text-center">
                  {summary.paidMilestones} of {summary.totalMilestones} milestones completed
                </p>
              </div>
            </div>
          )}

          {/* Hours Summary */}
          {summary.totalHours > 0 && !hideAmounts && (
            <div className="mb-8">
              <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-muted text-xs mb-1 uppercase tracking-wider">Hours Logged</p>
                  <p className="text-xl font-bold font-mono">{formatHours(summary.totalHours)}</p>
                </div>
                {unpaidHours > 0 && (
                  <div className="text-center border-l border-border pl-6">
                    <p className="text-muted text-xs mb-1 uppercase tracking-wider">Unpaid</p>
                    <p className="text-xl font-bold text-danger font-mono">{formatHours(unpaidHours)}</p>
                  </div>
                )}
                {summary.hourlyAmount > 0 && (
                  <div className="text-center border-l border-border pl-6">
                    <p className="text-muted text-xs mb-1 uppercase tracking-wider">Billed</p>
                    <p className="text-xl font-bold text-accent font-mono">{formatCurrency(summary.hourlyAmount)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tasks Board */}
          {project.tasks_board_public && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Tasks
              </h2>
              <PublicTaskBoard hash={hash} />
            </div>
          )}

          {/* Milestones */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Milestones
              </h2>
              {sortedMilestones.length > 0 && (
                <button
                  onClick={() => exportMilestonesToCSV(sortedMilestones, `${project.name || "project"}-milestones`)}
                  className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  CSV
                </button>
              )}
            </div>
            <div className="space-y-3">
              {sortedMilestones.map((m, index) => {
                  const isHourly = m.type === "hourly";
                  const total = getMilestoneTotal(m);
                  const paidAmount = getPaidAmount(m);
                  const remaining = total - paidAmount;
                  const percent = total > 0 ? Math.round((paidAmount / total) * 100) : 0;
                  const isFullyPaid = isHourly ? (paidAmount >= total && total > 0) : m.is_paid;
                  const isPartial = paidAmount > 0 && paidAmount < total;
                  const totalHours = getTotalHours(m);

                  return (
                    <div
                      key={m.id}
                      className={`bg-card border rounded-xl p-4 transition-all ${
                        hidePaid
                          ? "border-border"
                          : isFullyPaid
                          ? "border-success/30 bg-success/5"
                          : isPartial
                          ? "border-accent/30 bg-accent/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              hidePaid
                                ? "bg-border text-muted"
                                : isFullyPaid
                                ? "bg-success text-background"
                                : isPartial
                                ? "bg-accent text-background"
                                : "bg-border text-muted"
                            }`}
                          >
                            {!hidePaid && isFullyPaid ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={`font-semibold ${!hidePaid && isFullyPaid ? "text-success" : ""}`}>
                                {m.title}
                              </p>
                              {isHourly && (
                                <span className="text-xs bg-neutral-500/10 text-muted px-2 py-0.5 rounded-full border border-neutral-500/20">
                                  HOURLY
                                </span>
                              )}
                              {!hidePaid && isPartial && (
                                <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20">
                                  PARTIAL
                                </span>
                              )}
                            </div>
                            {m.description && (
                              <p className="text-sm text-muted mt-1 whitespace-pre-wrap">{m.description}</p>
                            )}
                            {isHourly && (
                              <p className="text-xs text-muted mt-1">
                                {!hideAmounts && `${formatCurrency(Number(m.hourly_rate || 0))}/hr`}
                                {!hideAmounts && " - "}
                                {formatHours(totalHours)} logged
                              </p>
                            )}
                          </div>
                        </div>
                        {!hideAmounts && (
                          <div className="text-right flex-shrink-0">
                            <p className={`font-bold text-lg ${!hidePaid && isFullyPaid ? "text-success" : "text-accent"}`}>
                              {formatCurrency(total)}
                            </p>
                            {!hidePaid && !isHourly && isFullyPaid && m.paid_at && (
                              <p className="text-xs text-muted">{formatDate(m.paid_at)}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      {!hidePaid && !hideAmounts && (isPartial || isFullyPaid) && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-success">{formatCurrency(paidAmount)} paid</span>
                            {!isFullyPaid && (
                              <span className="text-muted">{formatCurrency(remaining)} remaining</span>
                            )}
                          </div>
                          <div className="h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                              className={`h-full ${isFullyPaid ? "bg-success" : "bg-accent"}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Payment history */}
                      {!isHourly && showPaymentHistory && !hideAmounts && (m.payment_history || []).length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border">
                          <p className="text-xs text-muted mb-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Payment History
                          </p>
                          <div className="space-y-1">
                            {(m.payment_history || []).map((entry: PaymentHistoryEntry) => (
                              <div
                                key={entry.id}
                                className="flex items-center justify-between text-xs bg-background/50 rounded-lg px-2.5 py-1.5"
                              >
                                <span className="text-muted">{formatDate(entry.created_at)}</span>
                                <span className={entry.amount >= 0 ? "text-success font-medium" : "text-danger font-medium"}>
                                  {entry.amount >= 0 ? "+" : ""}{formatCurrency(entry.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Time entries */}
                      {isHourly && (m.time_entries || []).length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border">
                          <p className="text-xs text-muted mb-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Time Log
                          </p>
                          <div className="space-y-1.5">
                            {(m.time_entries || []).map((entry: TimeEntry) => {
                              const entryAmount = Number(entry.hours) * Number(m.hourly_rate || 0);
                              const entryPaid = Number(entry.paid_amount || 0);
                              const entryFullyPaid = entryPaid >= entryAmount && entryAmount > 0;
                              return (
                                <div
                                  key={entry.id}
                                  className={`text-sm bg-background/50 rounded-lg px-3 py-2 ${entryFullyPaid ? "border-l-2 border-success" : entryPaid > 0 ? "border-l-2 border-accent" : ""}`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                      <span className="text-muted">{entry.date}</span>
                                      <span className="font-medium">{formatHours(Number(entry.hours))}</span>
                                    </div>
                                    {!hideAmounts && !hidePaid && (
                                      <span className={`flex-shrink-0 ${entryFullyPaid ? "text-success font-medium" : entryPaid > 0 ? "text-accent font-medium" : "text-muted"}`}>
                                        {formatCurrency(entryPaid)}/{formatCurrency(entryAmount)}
                                      </span>
                                    )}
                                    {!hideAmounts && hidePaid && (
                                      <span className="text-muted flex-shrink-0">{formatCurrency(entryAmount)}</span>
                                    )}
                                  </div>
                                  {entry.description && (
                                    <p className="text-muted mt-1 whitespace-pre-wrap">{entry.description}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Operating Expenses */}
          {showExpenses && (project.operating_expenses || []).length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                </svg>
                Operating Expenses
              </h2>
              <div className="space-y-2">
                {(project.operating_expenses || []).map((exp: OperatingExpense) => (
                  <div key={exp.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{exp.name}</span>
                          <span className="text-xs text-muted">{formatDate(exp.date)}</span>
                        </div>
                        {exp.description && (
                          <p className="text-sm text-muted mt-1 whitespace-pre-wrap">{exp.description}</p>
                        )}
                      </div>
                      {!hideAmounts && (
                        <span className="font-bold text-danger ml-4">
                          {formatCurrency(exp.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {!hideAmounts && (
                <div className="mt-4 flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl">
                  <span className="text-sm text-muted">Total Expenses</span>
                  <span className="font-bold text-danger">{formatCurrency(summary.totalExpenses)}</span>
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          {(project.comments || []).length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Updates
              </h2>
              <div className="space-y-3">
                {(project.comments || []).map((c: Comment) => (
                  <div key={c.id} className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted mb-2 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(c.created_at)}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {(project.attachments || []).length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Resources
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(project.attachments || []).map((a: Attachment) => {
                  const iconConfig = ATTACHMENT_ICONS[a.type] || ATTACHMENT_ICONS.link;
                  return (
                    <a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card-glow flex items-center gap-3 bg-card border border-border rounded-xl p-3.5 hover:border-accent/30"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-card flex items-center justify-center ${iconConfig.color}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconConfig.icon} />
                        </svg>
                      </div>
                      <span className="font-medium text-sm truncate">{a.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Secure Note */}
          {project.secure_note_encrypted && (
            <div className="mb-10">
              <SecureNoteUnlock projectHash={hash} />
            </div>
          )}

          {/* Payment Methods */}
          {org && org.payment_methods && org.payment_methods.length > 0 && summary.remainingAmount > 0 && !hideAmounts && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Payment Methods
              </h2>
              <div className="space-y-3">
                {org.payment_methods.map((pm) => (
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

          {/* Footer */}
          <footer className="pt-8 border-t border-border/50">
            <p className="text-xs text-muted mb-4 text-center">Last updated: {formatDate(project.updated_at)}</p>
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
