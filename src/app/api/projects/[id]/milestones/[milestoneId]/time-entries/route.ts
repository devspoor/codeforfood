import { NextRequest, NextResponse } from "next/server";
import { addTimeEntry, getCurrentUser, verifyMilestoneOwnership } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { milestoneId } = await params;

    // Verify milestone ownership before adding time entry (pass user to avoid duplicate auth call)
    const milestone = await verifyMilestoneOwnership(milestoneId, user);
    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    const { date, hours, description, paid_amount } = await request.json();

    if (!date || hours === undefined) {
      return NextResponse.json({ error: "Date and hours required" }, { status: 400 });
    }

    const numHours = Number(hours);
    if (!Number.isFinite(numHours) || numHours <= 0) {
      return NextResponse.json({ error: "Hours must be a positive number" }, { status: 400 });
    }

    if (numHours > 24) {
      return NextResponse.json({ error: "Hours cannot exceed 24 per entry" }, { status: 400 });
    }

    const numPaidAmount = paid_amount !== undefined ? Number(paid_amount) : 0;
    if (!Number.isFinite(numPaidAmount) || numPaidAmount < 0) {
      return NextResponse.json({ error: "Paid amount must be a non-negative number" }, { status: 400 });
    }

    const entry = await addTimeEntry(milestoneId, { date, hours: numHours, description, paid_amount: numPaidAmount });
    if (!entry) {
      return NextResponse.json({ error: "Failed to add time entry" }, { status: 500 });
    }

    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
