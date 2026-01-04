import { NextRequest, NextResponse } from "next/server";
import { setProjectPassword, getCurrentUser, verifyProjectOwnership } from "@/lib/db";
import bcrypt from "bcryptjs";

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

    // Verify project ownership before setting password (pass user to avoid duplicate auth call)
    const project = await verifyProjectOwnership(id, user);
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { password } = await request.json();

    let passwordHash: string | null = null;

    if (password && password.trim()) {
      // Validate password strength
      if (password.length < 4) {
        return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
      }
      if (password.length > 100) {
        return NextResponse.json({ error: "Password too long" }, { status: 400 });
      }

      passwordHash = bcrypt.hashSync(password, 10);
    }

    const success = await setProjectPassword(id, passwordHash);
    if (!success) {
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }

    return NextResponse.json({ success: true, protected: !!passwordHash });
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

  // Verify project ownership before removing password (pass user to avoid duplicate auth call)
  const project = await verifyProjectOwnership(id, user);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const success = await setProjectPassword(id, null);
  if (!success) {
    return NextResponse.json({ error: "Failed to remove password" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
