import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError, apiNotFound, handleApiError } from "@/lib/api-auth";
import { syncReminders } from "@/lib/reminders";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/invoices/[id]
 * Get invoice with items (ownership check)
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .eq("id", id)
      .single();

    if (error || !invoice) {
      return apiNotFound("Invoice");
    }

    // Verify ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, organizations!inner(user_id)")
      .eq("id", invoice.project_id)
      .eq("organizations.user_id", user.id)
      .single();

    if (!project) {
      return apiNotFound("Invoice");
    }

    return apiSuccess({
      ...invoice,
      items: (invoice.invoice_items || []).sort(
        (a: { order: number }, b: { order: number }) => a.order - b.order
      ),
      invoice_items: undefined,
    });
  });
}

/**
 * PATCH /api/v1/invoices/[id]
 * Update invoice fields
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const body = await request.json();

      // Get existing invoice
      const { data: invoice } = await supabase
        .from("invoices")
        .select("*, invoice_items(*)")
        .eq("id", id)
        .single();

      if (!invoice) {
        return apiNotFound("Invoice");
      }

      // Verify ownership
      const { data: project } = await supabase
        .from("projects")
        .select("id, organizations!inner(user_id)")
        .eq("id", invoice.project_id)
        .eq("organizations.user_id", user.id)
        .single();

      if (!project) {
        return apiNotFound("Invoice");
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
          return apiError(
            `Status must be one of: ${validStatuses.join(", ")}`
          );
        }
      }

      // Auto-set paid_at when marking as paid
      if (updates.status === "paid" && !updates.paid_at) {
        updates.paid_at = new Date().toISOString();
      }

      if (Object.keys(updates).length === 0) {
        return apiError("No valid fields to update");
      }

      const { data: updated, error: updateError } = await supabase
        .from("invoices")
        .update(updates)
        .eq("id", id)
        .select("*, invoice_items(*)")
        .single();

      if (updateError || !updated) {
        return apiError("Failed to update invoice");
      }

      // Sync reminders if due_date or client_email changed
      if (body.due_date !== undefined || body.client_email !== undefined) {
        await syncReminders(supabase, id, updated.due_date, updated.client_email);
      }

      return apiSuccess({
        ...updated,
        items: (updated.invoice_items || []).sort(
          (a: { order: number }, b: { order: number }) => a.order - b.order
        ),
        invoice_items: undefined,
      });
    } catch (error) {
      return handleApiError(error, "PATCH /api/v1/invoices/[id]");
    }
  });
}

/**
 * DELETE /api/v1/invoices/[id]
 * Delete invoice (only if status is "draft")
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    // Get existing invoice
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, project_id, status")
      .eq("id", id)
      .single();

    if (!invoice) {
      return apiNotFound("Invoice");
    }

    // Verify ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, organizations!inner(user_id)")
      .eq("id", invoice.project_id)
      .eq("organizations.user_id", user.id)
      .single();

    if (!project) {
      return apiNotFound("Invoice");
    }

    // Only allow deleting draft invoices
    if (invoice.status !== "draft") {
      return apiError("Only draft invoices can be deleted");
    }

    const { error: deleteError } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return apiError("Failed to delete invoice");
    }

    return apiSuccess({ success: true });
  });
}
