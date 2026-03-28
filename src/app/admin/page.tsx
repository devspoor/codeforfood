import Link from "next/link";
import { getOrganizations, getProjects, getProjectSummary } from "@/lib/db";
import { formatCurrency, formatHours } from "@/lib/format";
import type { Project, ProjectStatus } from "@/lib/types";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { RevenueCharts } from "@/components/dashboard/RevenueCharts";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  in_progress: { label: "In Progress", color: "text-foreground", bgColor: "bg-neutral-500/10 border-neutral-500/20" },
  awaiting_payment: { label: "Awaiting Payment", color: "text-accent", bgColor: "bg-accent/10 border-accent/20" },
  completed: { label: "Completed", color: "text-success", bgColor: "bg-success/10 border-success/20" },
  on_hold: { label: "On Hold", color: "text-muted", bgColor: "bg-neutral-500/10 border-neutral-500/20" },
};

export default async function AdminDashboard() {
  const organizations = await getOrganizations();
  const projects = await getProjects();

  // Group stats by currency for multi-currency display
  const currencyStats = projects.reduce(
    (acc, project) => {
      const summary = getProjectSummary(project);
      const cur = project.currency || "USD";
      if (!acc[cur]) acc[cur] = { total: 0, paid: 0, pending: 0, hourlyRevenue: 0 };
      acc[cur].total += summary.totalAmount;
      acc[cur].paid += summary.paidAmount;
      acc[cur].pending += summary.remainingAmount;
      acc[cur].hourlyRevenue += summary.hourlyAmount;
      return acc;
    },
    {} as Record<string, { total: number; paid: number; pending: number; hourlyRevenue: number }>
  );
  const currencies = Object.keys(currencyStats);
  const singleCurrency = currencies.length === 1 ? currencies[0] : null;

  const totalStats = projects.reduce(
    (acc, project) => {
      const summary = getProjectSummary(project);
      return {
        total: acc.total + summary.totalAmount,
        paid: acc.paid + summary.paidAmount,
        pending: acc.pending + summary.remainingAmount,
        hours: acc.hours + summary.totalHours,
        hourlyRevenue: acc.hourlyRevenue + summary.hourlyAmount,
      };
    },
    { total: 0, paid: 0, pending: 0, hours: 0, hourlyRevenue: 0 }
  );

  const statusCounts = projects.reduce(
    (acc, project) => {
      const status = (project as Project & { status?: ProjectStatus }).status || "in_progress";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const paymentRate = totalStats.total > 0
    ? Math.round((totalStats.paid / totalStats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted text-sm">Overview of all projects and payments</p>
        </div>
        <Link
          href="/admin/organizations/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-background text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Organization
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6">
          {/* Total Value */}
          <div className="lg:col-span-1">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Total Value</p>
            <p className="text-lg sm:text-2xl font-bold text-accent tabular-nums font-mono">{singleCurrency ? formatCurrency(totalStats.total, singleCurrency) : currencies.map(c => formatCurrency(currencyStats[c].total, c)).join(" · ")}</p>
          </div>

          {/* Received */}
          <div className="lg:col-span-1">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Received</p>
            <p className="text-lg sm:text-2xl font-bold text-success tabular-nums font-mono">{singleCurrency ? formatCurrency(totalStats.paid, singleCurrency) : currencies.map(c => formatCurrency(currencyStats[c].paid, c)).join(" · ")}</p>
          </div>

          {/* Outstanding */}
          <div className="lg:col-span-1">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Outstanding</p>
            <p className="text-lg sm:text-2xl font-bold text-foreground tabular-nums font-mono">{singleCurrency ? formatCurrency(totalStats.pending, singleCurrency) : currencies.map(c => formatCurrency(currencyStats[c].pending, c)).join(" · ")}</p>
          </div>

          {/* Organizations */}
          <div className="lg:col-span-1">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Organizations</p>
            <p className="text-lg sm:text-2xl font-bold tabular-nums font-mono">{organizations.length}</p>
          </div>

          {/* Projects */}
          <div className="lg:col-span-1">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Projects</p>
            <p className="text-lg sm:text-2xl font-bold tabular-nums font-mono">{projects.length}</p>
          </div>

          {/* Payment Rate */}
          <div className="lg:col-span-1">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Payment Rate</p>
            <p className="text-lg sm:text-2xl font-bold tabular-nums font-mono">{paymentRate}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success" />
              {singleCurrency ? formatCurrency(totalStats.paid, singleCurrency) : currencies.map(c => formatCurrency(currencyStats[c].paid, c)).join(" · ")} received
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neutral-600" />
              {singleCurrency ? formatCurrency(totalStats.pending, singleCurrency) : currencies.map(c => formatCurrency(currencyStats[c].pending, c)).join(" · ")} outstanding
            </span>
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all duration-500"
              style={{ width: `${paymentRate}%` }}
            />
          </div>
        </div>

        {/* Hours Stats (if any) */}
        {totalStats.hours > 0 && (
          <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider mb-1">Hours Logged</p>
              <p className="text-xl font-bold tabular-nums font-mono">{formatHours(totalStats.hours)}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wider mb-1">Hourly Revenue</p>
              <p className="text-xl font-bold text-accent tabular-nums font-mono">{singleCurrency ? formatCurrency(totalStats.hourlyRevenue, singleCurrency) : currencies.map(c => formatCurrency(currencyStats[c].hourlyRevenue, c)).join(" · ")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Breakdown + Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown */}
        {projects.length > 0 && (
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 flex flex-col">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="size-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Projects by Status
            </h2>
            <div className="grid grid-cols-2 gap-3 flex-1">
              {(Object.entries(STATUS_CONFIG) as [ProjectStatus, typeof STATUS_CONFIG[ProjectStatus]][]).map(([status, config]) => (
                <div
                  key={status}
                  className={`border rounded-lg p-4 flex flex-col justify-center ${config.bgColor}`}
                >
                  <p className={`text-sm mb-1 ${config.color}`}>{config.label}</p>
                  <p className="text-2xl font-bold tabular-nums font-mono">{statusCounts[status] || 0}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Deadlines Widget */}
        <div className="lg:col-span-1">
          <UpcomingDeadlines />
        </div>
      </div>

      {/* Revenue Charts */}
      <RevenueCharts />

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Projects</h2>
          {projects.length > 5 && (
            <Link href="/admin/organizations" className="text-sm text-muted hover:text-accent transition-colors">
              View all
            </Link>
          )}
        </div>
        {projects.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-muted mb-2">No projects yet</p>
            <p className="text-sm text-muted/70 mb-6">Create an organization first, then add projects to it.</p>
            <Link
              href="/admin/organizations/new"
              className="inline-flex items-center gap-2 text-accent hover:text-accent-hover transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Organization
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 5).map((project) => {
              const org = organizations.find((o) => o.id === project.organization_id);
              const summary = getProjectSummary(project);
              const status = (project as Project & { status?: ProjectStatus }).status || "in_progress";
              const statusConfig = STATUS_CONFIG[status];

              return (
                <Link
                  key={project.id}
                  href={`/admin/projects/${project.id}`}
                  className="card-glow block bg-card border border-border rounded-xl p-4 hover:border-accent/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold truncate">{project.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusConfig.bgColor} ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted truncate">{org?.name || "Unknown org"}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-accent">{formatCurrency(summary.totalAmount, project.currency || "USD")}</p>
                      <p className="text-xs mt-0.5">
                        <span className="text-success">{formatCurrency(summary.paidAmount, project.currency || "USD")}</span>
                        <span className="text-muted"> / </span>
                        <span className="text-muted">{formatCurrency(summary.remainingAmount, project.currency || "USD")}</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success"
                        style={{ width: `${summary.percentPaid}%` }}
                      />
                    </div>
                  </div>
                  {summary.totalHours > 0 && (
                    <p className="text-xs text-muted mt-2 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatHours(summary.totalHours)} logged
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
