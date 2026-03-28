import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getCurrentUser } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { syncReminders } from "@/lib/reminders";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/projects/[id]/invoices
 * List all invoices for a project
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Verify project ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, organization_id, organizations!inner(user_id)")
    .eq("id", projectId)
    .eq("organizations.user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 400 });
  }

  // Sort items by order within each invoice
  const result = (invoices || []).map((inv) => ({
    ...inv,
    items: (inv.invoice_items || []).sort(
      (a: { order: number }, b: { order: number }) => a.order - b.order
    ),
    invoice_items: undefined,
  }));

  return NextResponse.json({ data: result });
}

/**
 * POST /api/v1/projects/[id]/invoices
 * Create a new invoice with items
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  try {
    const { due_date, note, client_name, client_email, items } =
      await request.json();

    // Verify project ownership and get org info
    const { data: project } = await supabase
      .from("projects")
      .select("id, organization_id, currency, organizations!inner(user_id)")
      .eq("id", projectId)
      .eq("organizations.user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items array is required and must not be empty" }, { status: 400 });
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.description || typeof item.description !== "string") {
        return NextResponse.json({ error: `Item ${i + 1}: description is required` }, { status: 400 });
      }
      const qty =
        item.quantity !== undefined && item.quantity !== null
          ? item.quantity
          : 1;
      if (typeof qty !== "number" || !Number.isFinite(qty) || qty <= 0) {
        return NextResponse.json({ error: `Item ${i + 1}: quantity must be a positive number` }, { status: 400 });
      }
      const price = item.unit_price;
      if (
        price === undefined ||
        price === null ||
        typeof price !== "number" ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        return NextResponse.json({ error: `Item ${i + 1}: unit_price is required and must be non-negative` }, { status: 400 });
      }
    }

    // Generate invoice number: count existing invoices for the org + 1
    const orgId = project.organization_id;

    // Get all project IDs for this org
    const { data: orgProjects } = await supabase
      .from("projects")
      .select("id")
      .eq("organization_id", orgId);

    const orgProjectIds = (orgProjects || []).map(
      (p: { id: string }) => p.id
    );

    // Count existing invoices across all org projects
    const { count } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .in("project_id", orgProjectIds);

    const invoiceNumber = `INV-${String((count || 0) + 1).padStart(3, "0")}`;
    const hash = randomBytes(12).toString("base64url");

    // Insert invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        project_id: projectId,
        hash,
        number: invoiceNumber,
        due_date: due_date || null,
        note: note || null,
        client_name: client_name || null,
        client_email: client_email || null,
        currency: project.currency || "USD",
      })
      .select()
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Failed to create invoice" }, { status: 400 });
    }

    // Insert items
    const itemsToInsert = items.map(
      (
        item: {
          milestone_id?: string;
          description: string;
          quantity?: number;
          unit_price: number;
        },
        index: number
      ) => {
        const quantity =
          item.quantity !== undefined && item.quantity !== null
            ? item.quantity
            : 1;
        const amount =
          Math.round(quantity * item.unit_price * 100) / 100;
        return {
          invoice_id: invoice.id,
          milestone_id: item.milestone_id || null,
          description: item.description,
          quantity,
          unit_price: item.unit_price,
          amount,
          order: index,
        };
      }
    );

    const { data: insertedItems, error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      // Clean up the invoice if items failed
      await supabase.from("invoices").delete().eq("id", invoice.id);
      return NextResponse.json({ error: "Failed to create invoice items" }, { status: 400 });
    }

    // Sync payment reminders
    await syncReminders(supabase, invoice.id, invoice.due_date, invoice.client_email);

    return NextResponse.json(
      {
        data: {
          ...invoice,
          items: (insertedItems || []).sort(
            (a: { order: number }, b: { order: number }) => a.order - b.order
          ),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/v1/projects/[id]/invoices error:", error);
    return NextResponse.json({ error: "Request failed" }, { status: 400 });
  }
}
