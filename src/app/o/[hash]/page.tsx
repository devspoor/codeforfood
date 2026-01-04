import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrganizationByHash, getProjectsByOrganization, getProjectSummary } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { CopyButton } from "@/components/CopyButton";

export const dynamic = "force-dynamic";

export default async function PublicOrganizationPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  const org = await getOrganizationByHash(hash);

  if (!org) {
    notFound();
  }

  const projects = await getProjectsByOrganization(org.id);
  const totals = projects.reduce(
    (acc, p) => {
      const s = getProjectSummary(p);
      return {
        total: acc.total + s.totalAmount,
        paid: acc.paid + s.paidAmount,
        remaining: acc.remaining + s.remainingAmount,
      };
    },
    { total: 0, paid: 0, remaining: 0 }
  );
  const percentPaid = totals.total > 0 ? Math.round((totals.paid / totals.total) * 100) : 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-pattern opacity-30" />
      </div>

      {/* Content */}
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 animate-fade-in-up">
            <div className="inline-block mb-4">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto">
                <span className="text-accent text-lg font-bold">{"</>"}</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{org.name}</h1>
            {org.description && (
              <p className="text-muted text-sm max-w-md mx-auto">{org.description}</p>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 animate-fade-in-up stagger-1 opacity-0">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-muted text-xs mb-1 uppercase tracking-wider">Total</p>
              <p className="text-lg sm:text-xl font-bold text-accent">{formatCurrency(totals.total)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-muted text-xs mb-1 uppercase tracking-wider">Paid</p>
              <p className="text-lg sm:text-xl font-bold text-success">{formatCurrency(totals.paid)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-muted text-xs mb-1 uppercase tracking-wider">Due</p>
              <p className="text-lg sm:text-xl font-bold text-danger">{formatCurrency(totals.remaining)}</p>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mb-10 animate-fade-in-up stagger-2 opacity-0">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-muted">Overall Progress</span>
                <span className="font-bold text-lg">{percentPaid}%</span>
              </div>
              <div className="h-3 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-success to-accent transition-all duration-500 progress-glow"
                  style={{ width: `${percentPaid}%` }}
                />
              </div>
              <p className="text-xs text-muted mt-3 text-center">
                {projects.length} project{projects.length !== 1 ? "s" : ""} total
              </p>
            </div>
          </div>

          {/* Projects */}
          <div className="mb-10 animate-fade-in-up stagger-3 opacity-0">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Projects
            </h2>
            {projects.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <p className="text-muted">No projects yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => {
                  const summary = getProjectSummary(project);
                  return (
                    <Link
                      key={project.id}
                      href={`/p/${project.hash}`}
                      className="card-glow block bg-card border border-border rounded-xl p-4 hover:border-accent/30"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{project.name}</p>
                          <p className="text-xs text-muted mt-0.5">
                            {summary.paidMilestones}/{summary.totalMilestones} milestones completed
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-accent">{formatCurrency(summary.totalAmount)}</p>
                          <p className="text-xs mt-0.5">
                            <span className="text-success">{formatCurrency(summary.paidAmount)}</span>
                            {summary.remainingAmount > 0 && (
                              <>
                                <span className="text-muted"> / </span>
                                <span className="text-danger">{formatCurrency(summary.remainingAmount)}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success transition-all"
                          style={{ width: `${summary.percentPaid}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Methods */}
          {org.payment_methods && org.payment_methods.length > 0 && totals.remaining > 0 && (
            <div className="mb-10 animate-fade-in-up stagger-4 opacity-0">
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
                          ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                          : pm.type === "bank"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
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
          <footer className="text-center pt-8 border-t border-border/50">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-muted hover:text-accent transition-colors text-xs"
            >
              <span>{"// powered by"}</span>
              <span className="text-accent font-semibold">{"<codeforfood/>"}</span>
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
