import { NextRequest, NextResponse } from "next/server";
import { createBotClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { PaymentReminder } from "@/lib/email/templates/PaymentReminder";
import { formatCurrency, formatDate } from "@/lib/format";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createBotClient();

  // Fetch pending reminders that are due
  const { data: reminders, error } = await supabase
    .from("reminders")
    .select(`
      id,
      invoice_id,
      type,
      scheduled_for,
      invoices!inner (
        id,
        hash,
        number,
        status,
        due_date,
        client_email,
        client_name,
        currency,
        project_id,
        invoice_items (
          amount
        ),
        projects!inner (
          id,
          name,
          organization_id,
          organizations!inner (
            id,
            name
          )
        )
      )
    `)
    .is("sent_at", null)
    .lte("scheduled_for", new Date().toISOString());

  if (error) {
    console.error("Failed to fetch reminders:", error);
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
  }

  let processed = 0;
  let sent = 0;
  let skipped = 0;

  for (const reminder of reminders || []) {
    processed++;
    const invoice = reminder.invoices as unknown as {
      id: string;
      hash: string;
      number: string;
      status: string;
      due_date: string | null;
      client_email: string | null;
      client_name: string | null;
      currency: string;
      project_id: string;
      invoice_items: { amount: number }[];
      projects: {
        id: string;
        name: string;
        organization_id: string;
        organizations: {
          id: string;
          name: string;
        };
      };
    };

    // Skip paid/cancelled invoices (but still mark as sent)
    if (invoice.status === "paid" || invoice.status === "cancelled") {
      await supabase
        .from("reminders")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", reminder.id);
      skipped++;
      continue;
    }

    // Skip if no client email
    if (!invoice.client_email) {
      await supabase
        .from("reminders")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", reminder.id);
      skipped++;
      continue;
    }

    // Calculate total from items
    const total = (invoice.invoice_items || []).reduce(
      (sum: number, item: { amount: number }) => sum + item.amount,
      0
    );

    const isOverdue = reminder.type === "overdue";
    const orgName = invoice.projects.organizations.name;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://codeforfood.app";
    const invoiceUrl = `${baseUrl}/invoice/${invoice.hash}`;

    // Send email
    const result = await sendEmail({
      to: invoice.client_email,
      subject: isOverdue
        ? `Overdue: Invoice ${invoice.number} from ${orgName}`
        : `Payment Reminder: Invoice ${invoice.number} from ${orgName}`,
      react: PaymentReminder({
        orgName,
        invoiceNumber: invoice.number,
        totalAmount: formatCurrency(total, invoice.currency),
        dueDate: invoice.due_date ? formatDate(invoice.due_date) : undefined,
        isOverdue,
        invoiceUrl,
      }),
    });

    // Mark as sent regardless of email success
    await supabase
      .from("reminders")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", reminder.id);

    if (result.success) {
      sent++;

      // If overdue reminder and invoice isn't already overdue, update status
      if (isOverdue && invoice.status !== "overdue") {
        await supabase
          .from("invoices")
          .update({ status: "overdue" })
          .eq("id", invoice.id);
      }
    } else {
      skipped++;
    }
  }

  return NextResponse.json({ processed, sent, skipped });
}
