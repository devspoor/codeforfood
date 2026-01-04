import { notFound } from "next/navigation";
import { getProjectByHash, getProjectSummary } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { PublicProjectContent } from "./PublicProjectContent";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  in_progress: { label: "In Progress", color: "bg-blue-500/20 text-blue-400" },
  awaiting_payment: { label: "Awaiting Payment", color: "bg-yellow-500/20 text-yellow-400" },
  completed: { label: "Completed", color: "bg-success/20 text-success" },
  on_hold: { label: "On Hold", color: "bg-gray-500/20 text-gray-400" },
};

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  const project = await getProjectByHash(hash);

  if (!project) {
    notFound();
  }

  // Get organization for payment methods
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("*, payment_methods(*)")
    .eq("id", project.organization_id)
    .single();

  const summary = getProjectSummary(project);
  const statusInfo = STATUS_LABELS[project.status] || STATUS_LABELS.in_progress;
  const isProtected = project.public_password_hash === "protected";

  // If password protected, render client component that handles unlock
  if (isProtected) {
    return (
      <PublicProjectContent
        hash={hash}
        project={project}
        org={org}
        summary={summary}
        statusInfo={statusInfo}
        isProtected={true}
      />
    );
  }

  return (
    <PublicProjectContent
      hash={hash}
      project={project}
      org={org}
      summary={summary}
      statusInfo={statusInfo}
      isProtected={false}
    />
  );
}
