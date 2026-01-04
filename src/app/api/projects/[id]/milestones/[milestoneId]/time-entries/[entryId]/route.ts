import { NextRequest, NextResponse } from "next/server";
import { deleteTimeEntry, updateTimeEntry, getCurrentUser, verifyTimeEntryOwnership } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { entryId } = await params;

    // Verify time entry ownership before modifying (pass user to avoid duplicate auth call)
    const ownership = await verifyTimeEntryOwnership(entryId, user);
    if (!ownership) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = await request.json();

    const allowedFields = ["date", "hours", "description", "paid_amount"];
    const sanitizedData: Record<string, unknown> = {};

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        if (key === "hours") {
          const numHours = Number(data[key]);
          if (!Number.isFinite(numHours) || numHours <= 0) {
            return NextResponse.json({ error: "Hours must be a positive number" }, { status: 400 });
          }
          if (numHours > 24) {
            return NextResponse.json({ error: "Hours cannot exceed 24 per entry" }, { status: 400 });
          }
          sanitizedData[key] = numHours;
        } else if (key === "paid_amount") {
          const numPaidAmount = Number(data[key]);
          if (!Number.isFinite(numPaidAmount) || numPaidAmount < 0) {
            return NextResponse.json({ error: "Paid amount must be a non-negative number" }, { status: 400 });
          }
          sanitizedData[key] = numPaidAmount;
        } else {
          sanitizedData[key] = data[key];
        }
      }
    }

    const entry = await updateTimeEntry(entryId, sanitizedData as { date?: string; hours?: number; description?: string; paid_amount?: number });
    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entryId } = await params;

  // Verify time entry ownership before deleting (pass user to avoid duplicate auth call)
  const ownership = await verifyTimeEntryOwnership(entryId, user);
  if (!ownership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const deleted = await deleteTimeEntry(entryId);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
