import { NextRequest, NextResponse } from "next/server";
import { addMilestone, getCurrentUser, verifyProjectOwnership } from "@/lib/db";

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

    // Verify project ownership before adding milestone (pass user to avoid duplicate auth call)
    const project = await verifyProjectOwnership(id, user);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const data = await request.json();
    const { title, description, type = "fixed", amount, hourly_rate, estimated_hours, hours_limit, unit_rate, unit_label, estimated_units, units_limit, due_date, is_recurring, recurrence_interval, recurrence_next_date, recurrence_end_date } = data;

    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    // Validate based on milestone type
    if (type === "fixed") {
      if (amount === undefined) {
        return NextResponse.json({ error: "Amount required for fixed milestone" }, { status: 400 });
      }
      const numAmount = Number(amount);
      if (!Number.isFinite(numAmount) || numAmount < 0) {
        return NextResponse.json({ error: "Amount must be a valid non-negative number" }, { status: 400 });
      }
      if (numAmount > 999999999999) {
        return NextResponse.json({ error: "Amount exceeds maximum allowed value" }, { status: 400 });
      }

      const milestone = await addMilestone(id, { title, description, type: "fixed", amount: numAmount, due_date: due_date || null, is_recurring: is_recurring || false, recurrence_interval: is_recurring ? recurrence_interval : null, recurrence_next_date: is_recurring ? recurrence_next_date : null, recurrence_end_date: is_recurring && recurrence_end_date ? recurrence_end_date : null });
      if (!milestone) {
        console.error("addMilestone returned null for project", id, "type: fixed, amount:", numAmount);
        return NextResponse.json({ error: "Failed to add milestone" }, { status: 500 });
      }
      return NextResponse.json(milestone, { status: 201 });

    } else if (type === "hourly") {
      if (hourly_rate === undefined) {
        return NextResponse.json({ error: "Hourly rate required for hourly milestone" }, { status: 400 });
      }
      const numRate = Number(hourly_rate);
      if (!Number.isFinite(numRate) || numRate < 0) {
        return NextResponse.json({ error: "Hourly rate must be a valid non-negative number" }, { status: 400 });
      }

      const milestone = await addMilestone(id, {
        title,
        description,
        type: "hourly",
        hourly_rate: numRate,
        estimated_hours: estimated_hours ? Number(estimated_hours) : undefined,
        hours_limit: hours_limit ? Number(hours_limit) : undefined,
        due_date: due_date || null,
        is_recurring: is_recurring || false,
        recurrence_interval: is_recurring ? recurrence_interval : null,
        recurrence_next_date: is_recurring ? recurrence_next_date : null,
        recurrence_end_date: is_recurring && recurrence_end_date ? recurrence_end_date : null,
      });
      if (!milestone) {
        return NextResponse.json({ error: "Failed to add milestone" }, { status: 500 });
      }
      return NextResponse.json(milestone, { status: 201 });

    } else if (type === "per_unit") {
      if (unit_rate === undefined) {
        return NextResponse.json({ error: "Unit rate required for per_unit milestone" }, { status: 400 });
      }
      const numRate = Number(unit_rate);
      if (!Number.isFinite(numRate) || numRate < 0) {
        return NextResponse.json({ error: "Unit rate must be a valid non-negative number" }, { status: 400 });
      }

      const milestone = await addMilestone(id, {
        title,
        description,
        type: "per_unit",
        unit_rate: numRate,
        unit_label: unit_label || "unit",
        estimated_units: estimated_units ? Number(estimated_units) : undefined,
        units_limit: units_limit ? Number(units_limit) : undefined,
        due_date: due_date || null,
        is_recurring: is_recurring || false,
        recurrence_interval: is_recurring ? recurrence_interval : null,
        recurrence_next_date: is_recurring ? recurrence_next_date : null,
        recurrence_end_date: is_recurring && recurrence_end_date ? recurrence_end_date : null,
      });
      if (!milestone) {
        return NextResponse.json({ error: "Failed to add milestone" }, { status: 500 });
      }
      return NextResponse.json(milestone, { status: 201 });

    } else {
      return NextResponse.json({ error: "Invalid milestone type" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
