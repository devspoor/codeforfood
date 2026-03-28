import { NextRequest, NextResponse } from "next/server";
import { getProjectById, updateProject, deleteProject, getCurrentUser, verifyProjectOwnership } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership before returning project data (pass user to avoid duplicate auth call)
  const ownership = await verifyProjectOwnership(id, user);
  if (!ownership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const project = await getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(project);
}

const VALID_STATUSES = ["in_progress", "awaiting_payment", "completed", "on_hold"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json();

    // Validate and sanitize input
    const allowedFields = ["name", "description", "status", "hide_amounts", "hide_paid", "show_payment_history", "show_expenses", "tasks_board_public", "currency"];
    const sanitizedData: Record<string, unknown> = {};

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        if (key === "status" && !VALID_STATUSES.includes(data[key])) {
          return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }
        if ((key === "hide_amounts" || key === "hide_paid" || key === "show_payment_history" || key === "show_expenses" || key === "tasks_board_public") && typeof data[key] !== "boolean") {
          return NextResponse.json({ error: `${key} must be a boolean` }, { status: 400 });
        }
        if (key === "currency" && (typeof data[key] !== "string" || data[key].length !== 3)) {
          return NextResponse.json({ error: "Currency must be a 3-letter code" }, { status: 400 });
        }
        sanitizedData[key] = data[key];
      }
    }

    const project = await updateProject(id, sanitizedData as Parameters<typeof updateProject>[1]);
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteProject(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
