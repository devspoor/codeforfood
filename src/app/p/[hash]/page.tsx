import { notFound } from "next/navigation";
import { getProjectByHash, getProjectSummary } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { PublicProjectContent } from "./PublicProjectContent";
import { ProtectedProjectGate } from "./ProtectedProjectGate";
import { getSubscriptionAdmin, isSubscriptionActive } from "@/lib/paddle/subscriptions";
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
    robots: { index: false, follow: false },
    openGraph: {
      title: `${project.name} | codeforfood`,
      description: `Project billing details for ${project.name}`,
      type: "website",
    },
  };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  in_progress: { label: "In Progress", color: "bg-neutral-500/20 text-foreground" },
  awaiting_payment: { label: "Awaiting Payment", color: "bg-accent/20 text-accent" },
  completed: { label: "Completed", color: "bg-success/20 text-success" },
  on_hold: { label: "On Hold", color: "bg-neutral-500/20 text-muted" },
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

  // Check owner's subscription status for ALL project types (protected and unprotected)
  const { data: projectOrg } = await supabase
    .from("projects")
    .select("organization_id, organizations!inner(user_id)")
    .eq("id", projectCheck.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerUserId = (projectOrg?.organizations as any)?.user_id;
  if (ownerUserId) {
    const subscription = await getSubscriptionAdmin(ownerUserId);
    if (!subscription || !isSubscriptionActive(subscription.status)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-warning/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold mb-2">Project temporarily unavailable</h1>
            <p className="text-muted text-sm">The project owner needs to activate their subscription</p>
          </div>
        </div>
      );
    }
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
      currency={project.currency || "USD"}
    />
  );
}
