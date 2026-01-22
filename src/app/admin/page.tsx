import Link from "next/link";
import { getOrganizations, getProjects, getProjectSummary } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import type { Project, ProjectStatus } from "@/lib/types";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  in_progress: { label: "In Progress", color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20" },
  awaiting_payment: { label: "Awaiting Payment", color: "text-amber-400", bgColor: "bg-amber-500/10 border-amber-500/20" },
  completed: { label: "Completed", color: "text-success", bgColor: "bg-success/10 border-success/20" },
  on_hold: { label: "On Hold", color: "text-gray-400", bgColor: "bg-gray-500/10 border-gray-500/20" },
};

export default async function AdminDashboard() {
  const organizations = await getOrganizations();
  const projects = await getProjects();

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-muted text-sm">Overview of all projects and payments</p>
        </div>
        <Link
          href="/admin/organizations/new"
          className="btn-glow inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Organization
        </Link>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value */}
        <div className="card-glow bg-card border border-border rounded-xl p-5 stat-card text-accent">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm text-muted">Total Value</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(totalStats.total)}</p>
        </div>

        {/* Received */}
        <div className="card-glow bg-card border border-border rounded-xl p-5 stat-card text-success">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm text-muted">Received</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(totalStats.paid)}</p>
        </div>

        {/* Outstanding */}
        <div className="card-glow bg-card border border-border rounded-xl p-5 stat-card text-danger">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm text-muted">Outstanding</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(totalStats.pending)}</p>
        </div>

        {/* Payment Rate */}
        <div className="card-glow bg-card border border-border rounded-xl p-5 stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-sm text-muted">Payment Rate</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{paymentRate}%</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card/50 border border-border rounded-lg p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold">{organizations.length}</p>
            <p className="text-xs text-muted">Organizations</p>
          </div>
        </div>
        <div className="bg-card/50 border border-border rounded-lg p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold">{projects.length}</p>
            <p className="text-xs text-muted">Projects</p>
          </div>
        </div>
        {totalStats.hours > 0 && (
          <>
            <div className="bg-card/50 border border-border rounded-lg p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold">{totalStats.hours.toFixed(1)}h</p>
                <p className="text-xs text-muted">Hours Logged</p>
              </div>
            </div>
            <div className="bg-card/50 border border-border rounded-lg p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold">{formatCurrency(totalStats.hourlyRevenue)}</p>
                <p className="text-xs text-muted">Hourly Revenue</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted">Overall Payment Progress</span>
          <span className="text-lg font-bold">{paymentRate}%</span>
        </div>
        <div className="h-3 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-success to-accent"
            style={{ width: `${paymentRate}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted mt-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success" />
            {formatCurrency(totalStats.paid)} received
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-danger" />
            {formatCurrency(totalStats.pending)} outstanding
          </span>
        </div>
      </div>

      {/* Status Breakdown + Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown */}
        {projects.length > 0 && (
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Projects by Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(Object.entries(STATUS_CONFIG) as [ProjectStatus, typeof STATUS_CONFIG[ProjectStatus]][]).map(([status, config]) => (
                <div
                  key={status}
                  className={`border rounded-xl p-4 ${config.bgColor}`}
                >
                  <p className={`text-sm mb-1 ${config.color}`}>{config.label}</p>
                  <p className="text-2xl font-bold">{statusCounts[status] || 0}</p>
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
                      <p className="font-bold text-accent">{formatCurrency(summary.totalAmount)}</p>
                      <p className="text-xs mt-0.5">
                        <span className="text-success">{formatCurrency(summary.paidAmount)}</span>
                        <span className="text-muted"> / </span>
                        <span className="text-danger">{formatCurrency(summary.remainingAmount)}</span>
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
                      {summary.totalHours.toFixed(1)}h logged
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
