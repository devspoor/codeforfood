import { NextRequest, NextResponse } from "next/server";
import { updateMilestone, deleteMilestone, updateMilestonePaidAmount, getCurrentUser, verifyProjectOwnership } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, milestoneId } = await params;

    // Verify project ownership before modifying milestone (pass user to avoid duplicate auth call)
    const project = await verifyProjectOwnership(id, user);
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = await request.json();

    // Handle paid amount update
    if (data.paidAmount !== undefined) {
      const numPaidAmount = Number(data.paidAmount);
      if (!Number.isFinite(numPaidAmount) || numPaidAmount < 0) {
        return NextResponse.json({ error: "Paid amount must be a valid non-negative number" }, { status: 400 });
      }
      if (numPaidAmount > 999999999999) {
        return NextResponse.json({ error: "Paid amount exceeds maximum allowed value" }, { status: 400 });
      }
      const milestone = await updateMilestonePaidAmount(id, milestoneId, numPaidAmount);
      if (!milestone) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(milestone);
    }

    // Validate amount if provided
    if (data.amount !== undefined) {
      const numAmount = Number(data.amount);
      if (!Number.isFinite(numAmount) || numAmount < 0) {
        return NextResponse.json({ error: "Amount must be a valid non-negative number" }, { status: 400 });
      }
      if (numAmount > 999999999999) {
        return NextResponse.json({ error: "Amount exceeds maximum allowed value" }, { status: 400 });
      }
      data.amount = numAmount;
    }

    // Only allow specific fields to be updated
    const allowedFields = ["title", "description", "amount", "hourly_rate", "estimated_hours", "hours_limit"];
    const sanitizedData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        sanitizedData[key] = data[key];
      }
    }

    const milestone = await updateMilestone(id, milestoneId, sanitizedData);
    if (!milestone) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(milestone);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, milestoneId } = await params;

  // Verify project ownership before deleting milestone (pass user to avoid duplicate auth call)
  const project = await verifyProjectOwnership(id, user);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const deleted = await deleteMilestone(id, milestoneId);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
