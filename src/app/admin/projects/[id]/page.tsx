import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectById, getOrganizationById, getProjectSummary } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { ProjectActions } from "@/components/ProjectActions";
import { MilestonesEditor } from "@/components/MilestonesEditor";
import { SecureNoteEditor } from "@/components/SecureNoteEditor";
import { CommentsEditor } from "@/components/CommentsEditor";
import { AttachmentsEditor } from "@/components/AttachmentsEditor";
import { ProjectSettingsEditor } from "@/components/ProjectSettingsEditor";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  in_progress: { label: "In Progress", color: "bg-blue-500/20 text-blue-400" },
  awaiting_payment: { label: "Awaiting Payment", color: "bg-yellow-500/20 text-yellow-400" },
  completed: { label: "Completed", color: "bg-success/20 text-success" },
  on_hold: { label: "On Hold", color: "bg-gray-500/20 text-gray-400" },
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const org = await getOrganizationById(project.organization_id);
  const summary = getProjectSummary(project);
  const publicUrl = `/p/${project.hash}`;
  const statusInfo = STATUS_LABELS[project.status] || STATUS_LABELS.in_progress;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Link
            href={`/admin/organizations/${project.organization_id}`}
            className="text-muted hover:text-foreground transition-colors text-sm"
          >
            &larr; Back to {org?.name || "Organization"}
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
            <h1 className="text-xl sm:text-2xl font-bold">{project.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          {project.description && <p className="text-muted mt-1 text-sm sm:text-base">{project.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <span className="text-muted">Created {formatDate(project.created_at)}</span>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover transition-colors"
            >
              /p/{project.hash}
            </a>
            {project.public_password_hash && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                🔒 Protected
              </span>
            )}
          </div>
        </div>
        <ProjectActions projectId={project.id} organizationId={project.organization_id} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted text-sm mb-1">Total</p>
          <p className="text-2xl font-bold text-accent">{formatCurrency(summary.totalAmount)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted text-sm mb-1">Paid</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(summary.paidAmount)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted text-sm mb-1">Remaining</p>
          <p className="text-2xl font-bold text-danger">{formatCurrency(summary.remainingAmount)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted text-sm mb-1">Progress</p>
          <p className="text-2xl font-bold">{summary.percentPaid}%</p>
        </div>
      </div>

      {/* Hours stats (if any hourly milestones) */}
      {summary.totalHours > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-muted text-sm mb-1">Hours Logged</p>
            <p className="text-2xl font-bold">{summary.totalHours.toFixed(1)}h</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-muted text-sm mb-1">Hourly Revenue</p>
            <p className="text-2xl font-bold text-accent">{formatCurrency(summary.hourlyAmount)}</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div>
        <div className="h-4 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-success"
            style={{ width: `${summary.percentPaid}%` }}
          />
        </div>
        <p className="text-sm text-muted mt-2">
          {summary.paidMilestones} of {summary.totalMilestones} milestones paid
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content - 2 columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Milestones */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Milestones</h2>
            <MilestonesEditor projectId={project.id} milestones={project.milestones || []} />
          </div>

          {/* Comments */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Comments</h2>
            <CommentsEditor projectId={project.id} comments={project.comments || []} />
          </div>

          {/* Secure Note */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Secure Note</h2>
            <SecureNoteEditor projectId={project.id} />
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-8">
          {/* Attachments */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Links & Resources</h2>
            <AttachmentsEditor projectId={project.id} attachments={project.attachments || []} />
          </div>

          {/* Project Settings */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Settings</h2>
            <ProjectSettingsEditor
              projectId={project.id}
              status={project.status}
              hideAmounts={project.hide_amounts}
              hidePaid={project.hide_paid}
              showPaymentHistory={project.show_payment_history}
              hasPassword={!!project.public_password_hash}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
