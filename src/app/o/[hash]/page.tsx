import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getOrganizationByHash, getProjectsByOrganization, getProjectSummary } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { CopyButton } from "@/components/CopyButton";
import { getSubscriptionAdmin, isSubscriptionActive } from "@/lib/paddle/subscriptions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hash: string }>;
}): Promise<Metadata> {
  const { hash } = await params;
  const org = await getOrganizationByHash(hash);

  if (!org) {
    return {
      title: "Organization Not Found | codeforfood",
    };
  }

  return {
    title: `${org.name} | codeforfood`,
    description: org.description || `Projects and billing for ${org.name}`,
    robots: { index: false, follow: false },
    openGraph: {
      title: `${org.name} | codeforfood`,
      description: org.description || `Projects and billing for ${org.name}`,
      type: "website",
    },
  };
}

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

  // Check owner's subscription status (use admin client to bypass RLS on public pages)
  const subscription = await getSubscriptionAdmin(org.user_id)
  if (!subscription || !isSubscriptionActive(subscription.status)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-warning/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold mb-2">Page temporarily unavailable</h1>
          <p className="text-muted text-sm">The project owner needs to activate their subscription</p>
        </div>
      </div>
    )
  }

  const projects = await getProjectsByOrganization(org.id);
  // Group totals by currency
  const currencyTotals = projects.reduce(
    (acc, p) => {
      const s = getProjectSummary(p);
      const cur = p.currency || "USD";
      if (!acc[cur]) acc[cur] = { total: 0, paid: 0, remaining: 0 };
      acc[cur].total += s.totalAmount;
      acc[cur].paid += s.paidAmount;
      acc[cur].remaining += s.remainingAmount;
      return acc;
    },
    {} as Record<string, { total: number; paid: number; remaining: number }>
  );
  const currencies = Object.keys(currencyTotals);
  const singleCurrency = currencies.length === 1 ? currencies[0] : null;
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
            <Image
              src="/logo.png"
              alt="codeforfood"
              width={40}
              height={40}
              className="size-10 mx-auto mb-4"
            />
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{org.name}</h1>
            {org.description && (
              <p className="text-muted text-sm max-w-md mx-auto">{org.description}</p>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 animate-fade-in-up stagger-1 opacity-0">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-muted text-xs mb-1 uppercase tracking-wider">Total</p>
              <p className="text-lg sm:text-xl font-bold text-accent font-mono">{singleCurrency ? formatCurrency(totals.total, singleCurrency) : currencies.map(c => formatCurrency(currencyTotals[c].total, c)).join(" · ")}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-muted text-xs mb-1 uppercase tracking-wider">Paid</p>
              <p className="text-lg sm:text-xl font-bold text-success font-mono">{singleCurrency ? formatCurrency(totals.paid, singleCurrency) : currencies.map(c => formatCurrency(currencyTotals[c].paid, c)).join(" · ")}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-muted text-xs mb-1 uppercase tracking-wider">Due</p>
              <p className="text-lg sm:text-xl font-bold text-foreground font-mono">{singleCurrency ? formatCurrency(totals.remaining, singleCurrency) : currencies.map(c => formatCurrency(currencyTotals[c].remaining, c)).join(" · ")}</p>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mb-10 animate-fade-in-up stagger-2 opacity-0">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-muted">Overall Progress</span>
                <span className="font-bold text-lg font-mono">{percentPaid}%</span>
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
                          <p className="font-bold text-accent">{formatCurrency(summary.totalAmount, project.currency || "USD")}</p>
                          <p className="text-xs mt-0.5">
                            <span className="text-success">{formatCurrency(summary.paidAmount, project.currency || "USD")}</span>
                            {summary.remainingAmount > 0 && (
                              <>
                                <span className="text-muted"> / </span>
                                <span className="text-muted">{formatCurrency(summary.remainingAmount, project.currency || "USD")}</span>
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
                          ? "bg-accent/10 text-accent border border-accent/20"
                          : pm.type === "bank"
                          ? "bg-neutral-500/10 text-foreground border border-neutral-500/20"
                          : "bg-neutral-500/10 text-muted border border-neutral-500/20"
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
          <footer className="pt-8 border-t border-border/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-muted hover:text-accent transition-colors text-xs"
              >
                <span>{"// powered by"}</span>
                <span className="text-accent font-semibold">{"<codeforfood/>"}</span>
              </Link>
              <div className="flex items-center gap-4 text-xs text-muted/50">
                <Link href="/privacy" className="hover:text-muted transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-muted transition-colors">
                  Terms
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
