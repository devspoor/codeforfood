import Link from "next/link";
import { getOrganizationsWithProjects, getProjectSummary } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  // Single optimized query instead of N+1 queries
  const organizations = await getOrganizationsWithProjects();

  const orgsWithProjects = organizations.map((org) => {
    const totals = org.projects.reduce(
      (acc, p) => {
        const s = getProjectSummary(p);
        return {
          total: acc.total + s.totalAmount,
          paid: acc.paid + s.paidAmount,
        };
      },
      { total: 0, paid: 0 }
    );
    return { org, projects: org.projects, totals };
  });

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Organizations</h1>
          <p className="text-muted text-sm">Manage your client organizations</p>
        </div>
        <Link
          href="/admin/organizations/new"
          className="btn-glow inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Organization
        </Link>
      </div>

      {/* Organizations List */}
      {organizations.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-foreground font-medium mb-2">No organizations yet</p>
          <p className="text-sm text-muted mb-6">Create your first organization to start tracking projects</p>
          <Link
            href="/admin/organizations/new"
            className="inline-flex items-center gap-2 text-accent hover:text-accent-hover transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create your first organization
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {orgsWithProjects.map(({ org, projects, totals }) => {
            const progressPercent = totals.total > 0 ? Math.round((totals.paid / totals.total) * 100) : 0;

            return (
              <Link
                key={org.id}
                href={`/admin/organizations/${org.id}`}
                className="card-glow block bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-accent/30 overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 min-w-0">
                  {/* Left side */}
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1 overflow-hidden">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-neutral-500/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg truncate">{org.name}</h3>
                      {org.description && (
                        <p className="text-sm text-muted truncate mt-0.5">{org.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {projects.length} project{projects.length !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          {(org.payment_methods || []).length} payment method{(org.payment_methods || []).length !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(org.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Stats */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 sm:text-right shrink-0">
                    <div className="min-w-0">
                      <p className="text-base sm:text-xl font-bold text-accent font-mono truncate">{formatCurrency(totals.total)}</p>
                      <p className="text-xs text-success font-mono truncate">{formatCurrency(totals.paid)} paid</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold font-mono">{progressPercent}%</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {totals.total > 0 && (
                  <div className="mt-4">
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Public link hint */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs bg-card-hover px-2 py-1 rounded text-muted font-mono">
                    /o/{org.hash}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
