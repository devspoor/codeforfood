import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError, apiNotFound, handleApiError } from "@/lib/api-auth";
import { sendEmail } from "@/lib/email/send";
import { InvoiceSent } from "@/lib/email/templates/InvoiceSent";
import { formatCurrency } from "@/lib/format";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/invoices/[id]/send
 * Send invoice email to client and mark as sent
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    try {
      // Fetch invoice with items
      const { data: invoice, error } = await supabase
        .from("invoices")
        .select("*, invoice_items(*)")
        .eq("id", id)
        .single();

      if (error || !invoice) {
        return apiNotFound("Invoice");
      }

      // Fetch project with org name and verify ownership
      const { data: project } = await supabase
        .from("projects")
        .select("id, name, currency, organizations!inner(user_id, name)")
        .eq("id", invoice.project_id)
        .eq("organizations.user_id", user.id)
        .single();

      if (!project) {
        return apiNotFound("Invoice");
      }

      // Validate client email
      if (!invoice.client_email) {
        return apiError("Invoice has no client email address");
      }

      // Calculate total from items
      const items = invoice.invoice_items || [];
      const total = items.reduce((sum: number, item: { amount: number }) => sum + (item.amount || 0), 0);

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
        subject: `Invoice ${invoice.number} from ${orgName}`,
        react: InvoiceSent({
          orgName,
          invoiceNumber: invoice.number,
          totalAmount: formatCurrency(total, project.currency || "USD"),
          dueDate,
          invoiceUrl,
        }),
      });

      if (!result.success) {
        return apiError(result.error || "Failed to send email");
      }

      // Update invoice status to sent and set issued_at
      await supabase
        .from("invoices")
        .update({
          status: "sent",
          issued_at: new Date().toISOString(),
        })
        .eq("id", id);

      return apiSuccess({ sent: true });
    } catch (err) {
      return handleApiError(err, "POST /api/v1/invoices/[id]/send");
    }
  });
}
