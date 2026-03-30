import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectById, getOrganizationById, getProjectSummary, getTaskBoardData, createDefaultTaskColumns } from "@/lib/db";
import { formatCurrency, formatDate, formatHours } from "@/lib/format";
import { ProjectActions } from "@/components/ProjectActions";
import { MilestonesEditor } from "@/components/MilestonesEditor";
import { SecureNoteEditor } from "@/components/SecureNoteEditor";
import { CommentsEditor } from "@/components/CommentsEditor";
import { AttachmentsEditor } from "@/components/AttachmentsEditor";
import { ProjectSettingsEditor } from "@/components/ProjectSettingsEditor";
import { OperatingExpensesEditor } from "@/components/OperatingExpensesEditor";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { InvoiceList } from "@/components/invoices/InvoiceList";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  in_progress: { label: "In Progress", color: "bg-neutral-500/20 text-foreground" },
  awaiting_payment: { label: "Awaiting Payment", color: "bg-accent/20 text-accent" },
  completed: { label: "Completed", color: "bg-success/20 text-success" },
  on_hold: { label: "On Hold", color: "bg-neutral-500/20 text-muted" },
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

  // Fetch or initialize task board
  let taskBoardData = await getTaskBoardData(project.id);
  if (taskBoardData.columns.length === 0) {
    await createDefaultTaskColumns(project.id);
    taskBoardData = await getTaskBoardData(project.id);
  }
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
              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
                🔒 Protected
              </span>
            )}
          </div>
        </div>
        <ProjectActions projectId={project.id} organizationId={project.organization_id} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
          <p className="text-muted text-xs sm:text-sm mb-1">Total</p>
          <p className="text-lg sm:text-2xl font-bold text-accent font-mono">{formatCurrency(summary.totalAmount, project.currency || "USD")}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
          <p className="text-muted text-xs sm:text-sm mb-1">Paid</p>
          <p className="text-lg sm:text-2xl font-bold text-success font-mono">{formatCurrency(summary.paidAmount, project.currency || "USD")}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
          <p className="text-muted text-xs sm:text-sm mb-1">Remaining</p>
          <p className="text-lg sm:text-2xl font-bold text-danger font-mono">{formatCurrency(summary.remainingAmount, project.currency || "USD")}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
          <p className="text-muted text-xs sm:text-sm mb-1">Progress</p>
          <p className="text-lg sm:text-2xl font-bold font-mono">{summary.percentPaid}%</p>
        </div>
      </div>

      {/* Hours stats (if any hourly milestones) */}
      {summary.totalHours > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <p className="text-muted text-xs sm:text-sm mb-1">Hours Logged</p>
            <p className="text-lg sm:text-2xl font-bold font-mono">{formatHours(summary.totalHours)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <p className="text-muted text-xs sm:text-sm mb-1">Hourly Revenue</p>
            <p className="text-lg sm:text-2xl font-bold text-accent font-mono">{formatCurrency(summary.hourlyAmount, project.currency || "USD")}</p>
          </div>
        </div>
      )}

      {/* Units stats (if any per_unit milestones) */}
      {summary.totalUnits > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <p className="text-muted text-xs sm:text-sm mb-1">Units Logged</p>
            <p className="text-lg sm:text-2xl font-bold">{summary.totalUnits}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <p className="text-muted text-xs sm:text-sm mb-1">Per-Unit Revenue</p>
            <p className="text-lg sm:text-2xl font-bold text-accent">{formatCurrency(summary.unitAmount, project.currency || "USD")}</p>
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
            <MilestonesEditor projectId={project.id} milestones={project.milestones || []} currency={project.currency || "USD"} />
          </div>

          {/* Task Board */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Tasks</h2>
              <Link
                href={`/admin/projects/${project.id}/tasks`}
                className="text-sm text-accent hover:text-accent-hover transition-colors"
              >
                Full Screen →
              </Link>
            </div>
            <TaskBoard
              projectId={project.id}
              columns={taskBoardData.columns}
              tasks={taskBoardData.tasks.filter(t => !t.is_archived)}
              milestones={project.milestones || []}
            />
          </div>

          {/* Operating Expenses */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Operating Expenses</h2>
            <OperatingExpensesEditor projectId={project.id} expenses={project.operating_expenses || []} currency={project.currency || "USD"} />
          </div>

          {/* Invoices */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Invoices</h2>
            <InvoiceList
              projectId={project.id}
              milestones={project.milestones || []}
              currency={project.currency || "USD"}
            />
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
              projectHash={project.hash}
              status={project.status}
              hideAmounts={project.hide_amounts}
              hidePaid={project.hide_paid}
              showPaymentHistory={project.show_payment_history}
              showExpenses={project.show_expenses}
              showTasksBoard={project.tasks_board_public || false}
              tasksBoardEditable={project.tasks_board_editable || false}
              hasPassword={!!project.public_password_hash}
              currency={project.currency || "USD"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
