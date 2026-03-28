import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicInvoiceContent } from "@/components/invoices/PublicInvoiceContent";
import { getSubscriptionAdmin, isSubscriptionActive } from "@/lib/paddle/subscriptions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hash: string }>;
}): Promise<Metadata> {
  const { hash } = await params;

  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("number")
    .eq("hash", hash)
    .single();

  if (!invoice) {
    return {
      title: "Invoice Not Found | codeforfood",
    };
  }

  return {
    title: `Invoice ${invoice.number} | codeforfood`,
    description: `Invoice ${invoice.number}`,
    robots: { index: false, follow: false },
    openGraph: {
      title: `Invoice ${invoice.number} | codeforfood`,
      description: `Invoice ${invoice.number}`,
      type: "website",
    },
  };
}

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;

  const supabase = await createClient();

  // Fetch invoice with items
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("hash", hash)
    .single();

  if (!invoice) {
    notFound();
  }

  // Sort items by order
  if (invoice.invoice_items) {
    invoice.invoice_items.sort((a: { order: number }, b: { order: number }) => a.order - b.order);
  }

  // Get project -> org -> user for subscription check and org name / payment methods
  const { data: project } = await supabase
    .from("projects")
    .select("id, organization_id, organizations!inner(id, name, user_id, payment_methods(*))")
    .eq("id", invoice.project_id)
    .single();

  if (!project) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const org = project.organizations as any;
  const ownerUserId = org?.user_id;

  // Check owner's subscription status
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
            <h1 className="text-xl font-semibold mb-2">Invoice temporarily unavailable</h1>
            <p className="text-muted text-sm">The invoice owner needs to activate their subscription</p>
          </div>
        </div>
      );
    }
  }

  return (
    <PublicInvoiceContent
      invoice={invoice}
      orgName={org?.name || "Unknown"}
      paymentMethods={org?.payment_methods || []}
    />
  );
}
