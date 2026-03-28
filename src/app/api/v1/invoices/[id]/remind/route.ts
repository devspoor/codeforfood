import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { PaymentReminder } from "@/lib/email/templates/PaymentReminder";
import { formatCurrency } from "@/lib/format";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/invoices/[id]/remind
 * Send payment reminder email to client
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // Fetch invoice with items
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Fetch items separately
    const { data: invoiceItems } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id);

    // Fetch project with org name and verify ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, name, currency, organizations!inner(user_id, name)")
      .eq("id", invoice.project_id)
      .eq("organizations.user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Validate client email
    if (!invoice.client_email) {
      return NextResponse.json({ error: "Invoice has no client email address" }, { status: 400 });
    }

    // Cannot remind on paid invoices
    if (invoice.status === "paid") {
      return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 });
    }

    // Calculate total from items
    const items = invoiceItems || [];
    const total = items.reduce((sum: number, item: { amount: number }) => sum + (item.amount || 0), 0);

    // Determine if overdue
    const isOverdue = invoice.due_date
      ? new Date(invoice.due_date) < new Date()
      : false;

    // Format due date
    const dueDate = invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : undefined;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://codeforfood.app";
    const invoiceUrl = `${appUrl}/invoice/${invoice.hash}`;

    const orgName = (project.organizations as unknown as { name: string }).name;

    // Send email
    const result = await sendEmail({
      to: invoice.client_email,
      subject: isOverdue
        ? `Overdue: Invoice ${invoice.number} from ${orgName}`
        : `Reminder: Invoice ${invoice.number} from ${orgName}`,
      react: PaymentReminder({
        orgName,
        invoiceNumber: invoice.number,
        totalAmount: formatCurrency(total, project.currency || "USD"),
        dueDate,
        isOverdue,
        invoiceUrl,
      }),
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send reminder" }, { status: 500 });
    }

    return NextResponse.json({ data: { sent: true } });
  } catch (err) {
    console.error("[POST /invoices/[id]/remind] Error:", err);
    return NextResponse.json({ error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
