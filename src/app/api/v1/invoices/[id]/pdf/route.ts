import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentUser } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { InvoicePDF } from "@/components/invoices/InvoicePDF";
import { formatCurrency } from "@/lib/format";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // Fetch invoice with items
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Fetch items separately
    const { data: invoiceItems } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id)
      .order("order", { ascending: true });

    // Verify ownership: invoice -> project -> org -> user_id
    const { data: project } = await supabase
      .from("projects")
      .select("id, organization_id, organizations!inner(id, name, user_id, payment_methods(*))")
      .eq("id", invoice.project_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const org = project.organizations as any;
    if (org?.user_id !== user.id) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const orgName = org?.name || "Unknown";
    const paymentMethods = org?.payment_methods || [];
    const formatAmount = (amount: number) => formatCurrency(amount, invoice.currency);

    // Assign items to the invoice object for the PDF component
    const invoiceForPdf = {
      ...invoice,
      items: invoiceItems || [],
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
  } catch (error) {
    console.error("[GET /invoices/[id]/pdf] Error:", error);
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
  }
}
