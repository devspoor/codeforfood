import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { syncReminders } from "@/lib/reminders";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/invoices/[id]
 * Get invoice with items (ownership check)
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, organizations!inner(user_id)")
    .eq("id", invoice.project_id)
    .eq("organizations.user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Fetch reminders for this invoice
  const { data: reminders } = await supabase
    .from("reminders")
    .select("id, type, scheduled_for, sent_at")
    .eq("invoice_id", id)
    .order("scheduled_for", { ascending: true });

  return NextResponse.json({
    data: {
      ...invoice,
      items: (invoice.invoice_items || []).sort(
        (a: { order: number }, b: { order: number }) => a.order - b.order
      ),
      invoice_items: undefined,
      reminders: reminders || [],
    },
  });
}

/**
 * PATCH /api/v1/invoices/[id]
 * Update invoice fields
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  try {
    const body = await request.json();

    // Get existing invoice
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .eq("id", id)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Verify ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, organizations!inner(user_id)")
      .eq("id", invoice.project_id)
      .eq("organizations.user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Build update object with only allowed fields
    const allowedFields = [
      "status",
      "due_date",
      "note",
      "client_name",
      "client_email",
      "issued_at",
      "paid_at",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Validate status if provided
    if (updates.status !== undefined) {
      const validStatuses = ["draft", "sent", "paid", "overdue", "cancelled"];
      if (!validStatuses.includes(updates.status as string)) {
        return NextResponse.json(
          { error: `Status must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Auto-set paid_at when marking as paid
    if (updates.status === "paid" && !updates.paid_at) {
      updates.paid_at = new Date().toISOString();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", id)
      .select("*, invoice_items(*)")
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: "Failed to update invoice" }, { status: 400 });
    }

    // Sync reminders if due_date or client_email changed
    if (body.due_date !== undefined || body.client_email !== undefined) {
      await syncReminders(supabase, id, updated.due_date, updated.client_email);
    }

    return NextResponse.json({
      data: {
        ...updated,
        items: (updated.invoice_items || []).sort(
          (a: { order: number }, b: { order: number }) => a.order - b.order
        ),
        invoice_items: undefined,
      },
    });
  } catch (error) {
    console.error("PATCH /api/v1/invoices/[id] error:", error);
    return NextResponse.json({ error: "Request failed" }, { status: 400 });
  }
}

/**
 * DELETE /api/v1/invoices/[id]
 * Delete invoice (only if status is "draft")
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Get existing invoice
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, project_id, status")
    .eq("id", id)
    .single();

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, organizations!inner(user_id)")
    .eq("id", invoice.project_id)
    .eq("organizations.user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Only allow deleting draft invoices
  if (invoice.status !== "draft") {
    return NextResponse.json({ error: "Only draft invoices can be deleted" }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 400 });
  }

  return NextResponse.json({ data: { success: true } });
}
