import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { encryptNote, hashPassword, validatePassword } from "@/lib/crypto";

// POST - Create or update secure note (owner only)
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
    const { note, password } = await request.json();

    if (!note || typeof note !== "string") {
      return NextResponse.json({ error: "Note is required" }, { status: 400 });
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
    }

    // Verify user owns the project
    const supabase = await createClient();
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, organization_id")
      .eq("id", id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify ownership through organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", project.organization_id)
      .eq("user_id", user.id)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Encrypt the note
    const encryptedData = encryptNote(note, password);
    const passwordHash = await hashPassword(password);

    // Save to database
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        secure_note_encrypted: JSON.stringify(encryptedData),
        secure_note_password_hash: passwordHash,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error saving secure note: database error");
      return NextResponse.json({ error: "Failed to save secure note" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    console.error("Error processing secure note: invalid request");
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// GET - Check if project has secure note (owner only, returns metadata only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const supabase = await createClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, organization_id, secure_note_encrypted")
    .eq("id", id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Verify ownership
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", project.organization_id)
    .eq("user_id", user.id)
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({
    hasSecureNote: !!project.secure_note_encrypted,
  });
}

// DELETE - Remove secure note (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const supabase = await createClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, organization_id")
    .eq("id", id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Verify ownership
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", project.organization_id)
    .eq("user_id", user.id)
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from("projects")
    .update({
      secure_note_encrypted: null,
      secure_note_password_hash: null,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to delete secure note" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
