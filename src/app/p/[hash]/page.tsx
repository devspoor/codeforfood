import { notFound } from "next/navigation";
import { getProjectByHash, getProjectSummary } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { PublicProjectContent } from "./PublicProjectContent";
import { ProtectedProjectGate } from "./ProtectedProjectGate";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hash: string }>;
}): Promise<Metadata> {
  const { hash } = await params;

  // Only fetch minimal data for metadata (name only, no sensitive data)
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("hash", hash)
    .single();

  if (!project) {
    return {
      title: "Project Not Found | codeforfood",
    };
  }

  return {
    title: `${project.name} | codeforfood`,
    description: `Project billing details for ${project.name}`,
    openGraph: {
      title: `${project.name} | codeforfood`,
      description: `Project billing details for ${project.name}`,
      type: "website",
    },
  };
}

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

  // First, check if project exists and if it's password protected
  // SECURITY: Only fetch minimal data to check protection status
  const supabase = await createClient();
  const { data: projectCheck } = await supabase
    .from("projects")
    .select("id, name, public_password_hash")
    .eq("hash", hash)
    .single();

  if (!projectCheck) {
    notFound();
  }

  const isProtected = !!projectCheck.public_password_hash;

  // SECURITY: If password protected, do NOT load any project data
  // Only show the password gate - data will be fetched client-side after unlock
  if (isProtected) {
    return (
      <ProtectedProjectGate
        hash={hash}
        projectName={projectCheck.name}
      />
    );
  }

  // Only load full project data for unprotected projects
  const project = await getProjectByHash(hash);

  if (!project) {
    notFound();
  }

  // Get organization for payment methods
  const { data: org } = await supabase
    .from("organizations")
    .select("*, payment_methods(*)")
    .eq("id", project.organization_id)
    .single();

  const summary = getProjectSummary(project);
  const statusInfo = STATUS_LABELS[project.status] || STATUS_LABELS.in_progress;

  return (
    <PublicProjectContent
      hash={hash}
      project={project}
      org={org}
      summary={summary}
      statusInfo={statusInfo}
    />
  );
}
