import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getCurrentUser, verifyProjectOwnership } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { syncReminders } from "@/lib/reminders";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/projects/[id]/invoices
 * List all invoices for a project
 */
export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const project = await verifyProjectOwnership(projectId, user);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const supabase = await createClient();

    // Fetch invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (invoicesError) {
      console.error("[GET /invoices] Supabase error:", invoicesError);
      return NextResponse.json({ error: `Failed to fetch invoices: ${invoicesError.message}` }, { status: 500 });
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch all items for these invoices
    const invoiceIds = invoices.map((inv) => inv.id);
    const { data: allItems, error: itemsError } = await supabase
      .from("invoice_items")
      .select("*")
      .in("invoice_id", invoiceIds)
      .order("order", { ascending: true });

    if (itemsError) {
      console.error("[GET /invoices] Items error:", itemsError);
      // Return invoices without items rather than failing completely
    }

    // Group items by invoice_id
    const itemsByInvoice = new Map<string, typeof allItems>();
    for (const item of allItems || []) {
      const existing = itemsByInvoice.get(item.invoice_id) || [];
      existing.push(item);
      itemsByInvoice.set(item.invoice_id, existing);
    }

    const result = invoices.map((inv) => ({
      ...inv,
      items: itemsByInvoice.get(inv.id) || [],
    }));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[GET /invoices] Error:", error);
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
  }
}

/**
 * POST /api/v1/projects/[id]/invoices
 * Create a new invoice with items
 */
export async function POST(
  request: NextRequest,
  { params }: Params
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const project = await verifyProjectOwnership(projectId, user);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { due_date, note, client_name, client_email, items } =
      await request.json();

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

    const supabase = await createClient();

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
    let count = 0;
    if (orgProjectIds.length > 0) {
      const { count: invoiceCount } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .in("project_id", orgProjectIds);
      count = invoiceCount || 0;
    }

    const invoiceNumber = `INV-${String(count + 1).padStart(3, "0")}`;
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
      console.error("[POST /invoices] Insert error:", invoiceError);
      return NextResponse.json({ error: `Failed to create invoice: ${invoiceError?.message || "unknown"}` }, { status: 500 });
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
      console.error("[POST /invoices] Items insert error:", itemsError);
      // Clean up the invoice if items failed
      await supabase.from("invoices").delete().eq("id", invoice.id);
      return NextResponse.json({ error: `Failed to create invoice items: ${itemsError.message}` }, { status: 500 });
    }

    // Sync payment reminders
    try {
      await syncReminders(supabase, invoice.id, invoice.due_date, invoice.client_email);
    } catch (reminderErr) {
      console.error("[POST /invoices] Reminder sync error:", reminderErr);
      // Non-fatal - invoice was still created
    }

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
    console.error("[POST /invoices] Error:", error);
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
  }
}
