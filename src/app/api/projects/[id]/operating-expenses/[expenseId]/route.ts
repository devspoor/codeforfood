import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, updateOperatingExpense, deleteOperatingExpense, verifyOperatingExpenseOwnership } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { expenseId } = await params;

    // Verify expense ownership
    const existingExpense = await verifyOperatingExpenseOwnership(expenseId, user);
    if (!existingExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const data = await request.json();
    const { name, amount, date, description } = data;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (!Number.isFinite(numAmount) || numAmount < 0) {
        return NextResponse.json({ error: "Amount must be a valid non-negative number" }, { status: 400 });
      }
      if (numAmount > 999999999999) {
        return NextResponse.json({ error: "Amount exceeds maximum allowed value" }, { status: 400 });
      }
      updateData.amount = numAmount;
    }

    if (date !== undefined) {
      updateData.date = date;
    }

    if (description !== undefined) {
      updateData.description = description.trim() || null;
    }

    const expense = await updateOperatingExpense(expenseId, updateData);
    if (!expense) {
      return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
    }

    return NextResponse.json(expense);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { expenseId } = await params;

    // Verify expense ownership
    const existingExpense = await verifyOperatingExpenseOwnership(expenseId, user);
    if (!existingExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const success = await deleteOperatingExpense(expenseId);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
