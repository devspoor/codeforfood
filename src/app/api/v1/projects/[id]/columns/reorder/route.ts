import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyProjectOwnership, reorderTaskColumns } from "@/lib/db";

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
    const project = await verifyProjectOwnership(id, user);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const data = await request.json();
    const { columnIds } = data;

    if (!Array.isArray(columnIds) || columnIds.length === 0) {
      return NextResponse.json({ error: "columnIds array required" }, { status: 400 });
    }

    const success = await reorderTaskColumns(id, columnIds);
    if (!success) {
      return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
