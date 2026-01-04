import { NextRequest, NextResponse } from "next/server";
import { addPaymentHistoryEntry, getPaymentHistory, getCurrentUser, verifyProjectOwnership, verifyMilestoneOwnership } from "@/lib/db";

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
    if (!Number.isFinite(numAmount) || numAmount === 0) {
      return NextResponse.json({ error: "Amount must be a valid non-zero number" }, { status: 400 });
    }
    if (Math.abs(numAmount) > 999999999999) {
      return NextResponse.json({ error: "Amount exceeds maximum allowed value" }, { status: 400 });
    }

    const entry = await addPaymentHistoryEntry(milestoneId, {
      amount: numAmount,
      note: data.note,
    });

    if (!entry) {
      return NextResponse.json({ error: "Failed to add payment history" }, { status: 500 });
    }

    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
