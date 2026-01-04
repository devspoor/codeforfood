import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptNote, verifyPassword } from "@/lib/crypto";
import type { SecureNoteEncrypted } from "@/lib/types";

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60; // 15 minutes

interface RateLimitResult {
  allowed: boolean;
  remaining_attempts: number;
  reset_in_seconds: number;
  is_blocked: boolean;
}

async function checkRateLimit(supabase: Awaited<ReturnType<typeof createClient>>, key: string): Promise<RateLimitResult> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_max_attempts: MAX_ATTEMPTS,
    p_window_seconds: WINDOW_SECONDS,
  });

  if (error || !data || data.length === 0) {
    // On error, allow the request but log it (without exposing error details)
    console.error("Rate limit check error: database unavailable");
    return { allowed: true, remaining_attempts: MAX_ATTEMPTS - 1, reset_in_seconds: WINDOW_SECONDS, is_blocked: false };
  }

  return data[0];
}

async function resetRateLimit(supabase: Awaited<ReturnType<typeof createClient>>, key: string): Promise<void> {
  await supabase.rpc("reset_rate_limit", { p_key: key });
}

// POST - Unlock secure note with password (public)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;
  const supabase = await createClient();

  // Get client IP for rate limiting
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  const rateLimitKey = `secure_note:${ip}:${hash}`;

  // Check rate limit using database
  const rateLimit = await checkRateLimit(supabase, rateLimitKey);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many attempts. Please try again later.",
        retryAfter: rateLimit.reset_in_seconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.reset_in_seconds),
        },
      }
    );
  }

  try {
    const { password } = await request.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("secure_note_encrypted, secure_note_password_hash")
      .eq("hash", hash)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.secure_note_encrypted || !project.secure_note_password_hash) {
      return NextResponse.json({ error: "No secure note exists" }, { status: 404 });
    }

    // Verify password using bcrypt
    const isValid = await verifyPassword(password, project.secure_note_password_hash);
    if (!isValid) {
      return NextResponse.json(
        {
          error: "Invalid password",
          attemptsRemaining: rateLimit.remaining_attempts,
        },
        { status: 401 }
      );
    }

    // Decrypt the note
    try {
      const encryptedData: SecureNoteEncrypted = JSON.parse(project.secure_note_encrypted);
      const decryptedNote = decryptNote(encryptedData, password);

      // Reset rate limit on successful unlock
      await resetRateLimit(supabase, rateLimitKey);

      return NextResponse.json({ note: decryptedNote });
    } catch {
      console.error("Decryption error: invalid password or corrupted data");
      return NextResponse.json({ error: "Failed to decrypt note" }, { status: 500 });
    }
  } catch {
    console.error("Error unlocking secure note: invalid request");
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// GET - Check if project has secure note (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;

  const supabase = await createClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("secure_note_encrypted")
    .eq("hash", hash)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    hasSecureNote: !!project.secure_note_encrypted,
  });
}
