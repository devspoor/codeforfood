import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, transferProject } from "@/lib/db";

/**
 * POST /api/projects/[id]/transfer
 * Transfer project to a different organization
 */
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
    const { targetOrganizationId } = await request.json();

    if (!targetOrganizationId || typeof targetOrganizationId !== "string") {
      return NextResponse.json({ error: "targetOrganizationId is required" }, { status: 400 });
    }

    const project = await transferProject(id, targetOrganizationId);
    if (!project) {
      return NextResponse.json({ error: "Transfer failed. Make sure both organizations belong to you and are different." }, { status: 400 });
    }

    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
