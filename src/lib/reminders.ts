import type { SupabaseClient } from "@supabase/supabase-js";

export async function syncReminders(
  supabase: SupabaseClient,
  invoiceId: string,
  dueDate: string | null,
  clientEmail: string | null
): Promise<void> {
  if (!dueDate || !clientEmail) {
    await supabase.from("reminders").delete().eq("invoice_id", invoiceId).is("sent_at", null);
    return;
  }

  await supabase.from("reminders").delete().eq("invoice_id", invoiceId).is("sent_at", null);

  const due = new Date(dueDate);
  const now = new Date();

  const reminders = [
    { type: "before_due", scheduled_for: new Date(due.getTime() - 3 * 24 * 60 * 60 * 1000) },
    { type: "on_due", scheduled_for: due },
    { type: "overdue", scheduled_for: new Date(due.getTime() + 7 * 24 * 60 * 60 * 1000) },
  ]
    .filter((r) => r.scheduled_for > now)
    .map((r) => ({
      invoice_id: invoiceId,
      type: r.type,
      scheduled_for: r.scheduled_for.toISOString(),
    }));

  if (reminders.length > 0) {
    await supabase.from("reminders").insert(reminders);
  }
}
