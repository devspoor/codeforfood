import { NextRequest, NextResponse } from "next/server";
import { addOperatingExpense, getCurrentUser, verifyProjectOwnership } from "@/lib/db";

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

    // Verify project ownership before adding expense
    const project = await verifyProjectOwnership(id, user);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const data = await request.json();
    const { name, amount, date, description } = data;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (amount === undefined) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount < 0) {
      return NextResponse.json({ error: "Amount must be a valid non-negative number" }, { status: 400 });
    }

    if (numAmount > 999999999999) {
      return NextResponse.json({ error: "Amount exceeds maximum allowed value" }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const expense = await addOperatingExpense(id, {
      name: name.trim(),
      amount: numAmount,
      date,
      description: description?.trim() || undefined,
    });

    if (!expense) {
      return NextResponse.json({ error: "Failed to add expense" }, { status: 500 });
    }

    return NextResponse.json(expense, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
