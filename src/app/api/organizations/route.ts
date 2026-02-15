import { NextRequest, NextResponse } from "next/server";
import { getOrganizations, createOrganization, getCurrentUser } from "@/lib/db";
import { canUserCreateOrganization } from "@/lib/paddle/access";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgs = await getOrganizations();
  return NextResponse.json(orgs);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check subscription limits
  const canCreate = await canUserCreateOrganization(user.id);
  if (!canCreate) {
    return NextResponse.json(
      { error: "Organization limit reached. Upgrade your plan to create more.", code: "LIMIT_REACHED" },
      { status: 403 }
    );
  }

  try {
    const { name, description } = await request.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const org = await createOrganization({ name, description });
    if (!org) {
      return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
    }

    return NextResponse.json(org, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
