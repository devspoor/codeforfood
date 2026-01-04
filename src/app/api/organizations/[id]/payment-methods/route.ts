import { NextRequest, NextResponse } from "next/server";
import { addPaymentMethod, getOrganizationById, getCurrentUser } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const org = await getOrganizationById(id);
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { label, value, type } = await request.json();
    if (!label || !value) {
      return NextResponse.json({ error: "Label and value required" }, { status: 400 });
    }

    const pm = await addPaymentMethod(id, { label, value, type: type || "other" });
    if (!pm) {
      return NextResponse.json({ error: "Failed to add payment method" }, { status: 500 });
    }

    return NextResponse.json(pm, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
