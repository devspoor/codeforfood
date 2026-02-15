import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrganizationById, getProjectsByOrganization, getProjectSummary } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { OrganizationActions } from "@/components/OrganizationActions";
import { PaymentMethodsEditor } from "@/components/PaymentMethodsEditor";
import { NewProjectForm } from "@/components/NewProjectForm";

export const dynamic = "force-dynamic";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await getOrganizationById(id);

  if (!org) {
    notFound();
  }

  const projects = await getProjectsByOrganization(org.id);
  const publicUrl = `/o/${org.hash}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Link href="/admin/organizations" className="text-muted hover:text-foreground transition-colors text-sm">
            &larr; Back to Organizations
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold mt-2">{org.name}</h1>
          {org.description && <p className="text-muted mt-1 text-sm sm:text-base">{org.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <span className="text-muted">Created {formatDate(org.created_at)}</span>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover transition-colors"
            >
              /o/{org.hash}
            </a>
          </div>
        </div>
        <OrganizationActions orgId={org.id} />
      </div>

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Projects</h2>
        </div>

        <NewProjectForm organizationId={org.id} />

        {projects.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center mt-4">
            <p className="text-muted">No projects yet. Create one above.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {projects.map((project) => {
              const summary = getProjectSummary(project);
              return (
                <Link
                  key={project.id}
                  href={`/admin/projects/${project.id}`}
                  className="block bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{project.name}</p>
                      <p className="text-sm text-muted">
                        {summary.paidMilestones}/{summary.totalMilestones} milestones paid
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold font-mono">{formatCurrency(summary.totalAmount)}</p>
                      <p className="text-sm font-mono">
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
                  <div className="mt-3">
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success transition-all"
                        style={{ width: `${summary.percentPaid}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted">
                    /p/{project.hash}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Payment Methods</h2>
        <PaymentMethodsEditor organizationId={org.id} paymentMethods={org.payment_methods || []} />
      </div>
    </div>
  );
}
