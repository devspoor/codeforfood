import { NextRequest, NextResponse } from "next/server";
import { getPaymentHistory, getCurrentUser, verifyProjectOwnership, verifyMilestoneOwnership, recordPaymentAtomically } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, milestoneId } = await params;

  const project = await verifyProjectOwnership(id, user);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const history = await getPaymentHistory(milestoneId);
  return NextResponse.json(history);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, milestoneId } = await params;

    const project = await verifyProjectOwnership(id, user);
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const milestone = await verifyMilestoneOwnership(milestoneId, user);
    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    const data = await request.json();

    if (data.amount === undefined || data.amount === null) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    const numAmount = Number(data.amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }
    if (numAmount > 999999999999) {
      return NextResponse.json({ error: "Amount exceeds maximum allowed value" }, { status: 400 });
    }

    // Always use atomic operation to prevent race conditions
    // Legacy non-atomic path has been removed for data integrity
    const result = await recordPaymentAtomically(milestoneId, {
      amount: numAmount,
      note: data.note,
    }, user);

    if (!result) {
      return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
    }

    return NextResponse.json({
      entry: result.entry,
      milestone: {
        id: result.milestone.id,
        paid_amount: result.milestone.paid_amount,
        is_paid: result.milestone.is_paid,
        paid_at: result.milestone.paid_at,
      },
    });
  } catch (err) {
    console.error("Payment history POST error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
