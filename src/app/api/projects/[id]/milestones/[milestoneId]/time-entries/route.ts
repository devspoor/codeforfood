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

    const { date, hours, units, description, paid_amount } = await request.json();

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Validate date format (YYYY-MM-DD)
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Date must be in YYYY-MM-DD format" }, { status: 400 });
    }

    // Validate date is a real date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    // Either hours or units must be provided
    if (hours === undefined && units === undefined) {
      return NextResponse.json({ error: "Either hours or units required" }, { status: 400 });
    }

    let numHours: number | undefined;
    let numUnits: number | undefined;

    if (hours !== undefined) {
      numHours = Number(hours);
      if (!Number.isFinite(numHours) || numHours <= 0) {
        return NextResponse.json({ error: "Hours must be a positive number" }, { status: 400 });
      }
      if (numHours > 24) {
        return NextResponse.json({ error: "Hours cannot exceed 24 per entry" }, { status: 400 });
      }
      // Validate against hours_limit if set
      if (milestone.hours_limit && milestone.hours_limit > 0) {
        const existingHours = (milestone.time_entries || []).reduce(
          (sum, e) => sum + Number(e.hours || 0), 0
        );
        if (existingHours + numHours > milestone.hours_limit) {
          const remaining = Math.max(0, milestone.hours_limit - existingHours);
          return NextResponse.json(
            { error: `Would exceed hours limit. Remaining: ${remaining.toFixed(1)}h of ${milestone.hours_limit}h` },
            { status: 400 }
          );
        }
      }
    }

    if (units !== undefined) {
      numUnits = Number(units);
      if (!Number.isFinite(numUnits) || numUnits <= 0) {
        return NextResponse.json({ error: "Units must be a positive number" }, { status: 400 });
      }
      // Validate against units_limit if set
      if (milestone.units_limit && milestone.units_limit > 0) {
        const existingUnits = (milestone.time_entries || []).reduce(
          (sum, e) => sum + Number(e.units || 0), 0
        );
        if (existingUnits + numUnits > milestone.units_limit) {
          const remaining = Math.max(0, milestone.units_limit - existingUnits);
          return NextResponse.json(
            { error: `Would exceed units limit. Remaining: ${remaining} of ${milestone.units_limit}` },
            { status: 400 }
          );
        }
      }
    }

    const numPaidAmount = paid_amount !== undefined ? Number(paid_amount) : 0;
    if (!Number.isFinite(numPaidAmount) || numPaidAmount < 0) {
      return NextResponse.json({ error: "Paid amount must be a non-negative number" }, { status: 400 });
    }

    const entry = await addTimeEntry(milestoneId, { date, hours: numHours, units: numUnits, description, paid_amount: numPaidAmount });
    if (!entry) {
      return NextResponse.json({ error: "Failed to add entry" }, { status: 500 });
    }

    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
