import { NextRequest, NextResponse } from "next/server";
import { getProjects, createProject, getOrganizationById, getCurrentUser } from "@/lib/db";
import { canUserCreateProject } from "@/lib/paddle/access";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await getProjects();
    return NextResponse.json(projects);
  } catch {
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { organizationId, name, description, currency } = await request.json();
    if (!organizationId || !name) {
      return NextResponse.json({ error: "Organization ID and name required" }, { status: 400 });
    }

    if (currency !== undefined && (typeof currency !== "string" || currency.length !== 3)) {
      return NextResponse.json({ error: "Currency must be a 3-letter code" }, { status: 400 });
    }

    const org = await getOrganizationById(organizationId);
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check subscription limits
    const canCreate = await canUserCreateProject(user.id, organizationId);
    if (!canCreate) {
      return NextResponse.json(
        { error: "Project limit reached for this organization. Upgrade your plan to create more.", code: "LIMIT_REACHED" },
        { status: 403 }
      );
    }

    const project = await createProject({ organizationId, name, description, currency });
    if (!project) {
      return NextResponse.json({ error: "Failed to create project. Check that the organization exists and try again." }, { status: 500 });
    }

    return NextResponse.json(project, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
