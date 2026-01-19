import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyProjectOwnership, getTaskColumns, addTaskColumn } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await verifyProjectOwnership(id, user);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const columns = await getTaskColumns(id);
  return NextResponse.json(columns);
}

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
    const { name } = data;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json({ error: "Name too long (max 100 chars)" }, { status: 400 });
    }

    const column = await addTaskColumn(id, { name: name.trim() });
    if (!column) {
      return NextResponse.json({ error: "Failed to create column" }, { status: 500 });
    }

    return NextResponse.json(column, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
