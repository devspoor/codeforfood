import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { withAuth, apiNotFound } from "@/lib/api-auth";
import { InvoicePDF } from "@/components/invoices/InvoicePDF";
import { formatCurrency } from "@/lib/format";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return withAuth(request, async ({ user, supabase }) => {
    // Fetch invoice with items
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .eq("id", id)
      .single();

    if (invoiceError || !invoice) {
      return apiNotFound("Invoice");
    }

    // Sort items by order
    if (invoice.invoice_items) {
      invoice.invoice_items.sort((a: { order: number }, b: { order: number }) => a.order - b.order);
    }

    // Verify ownership: invoice -> project -> org -> user_id
    const { data: project } = await supabase
      .from("projects")
      .select("id, organization_id, organizations!inner(id, name, user_id, payment_methods(*))")
      .eq("id", invoice.project_id)
      .single();

    if (!project) {
      return apiNotFound("Project");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const org = project.organizations as any;
    if (org?.user_id !== user.id) {
      return apiNotFound("Invoice");
    }

    const orgName = org?.name || "Unknown";
    const paymentMethods = org?.payment_methods || [];
    const formatAmount = (amount: number) => formatCurrency(amount, invoice.currency);

    // Assign items to the invoice object for the PDF component
    const invoiceForPdf = {
      ...invoice,
      items: invoice.invoice_items,
    };

    const pdfElement = InvoicePDF({
      invoice: invoiceForPdf,
      orgName,
      paymentMethods,
      formatAmount,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(pdfElement as any);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=${invoice.number}.pdf`,
      },
    });
  });
}
