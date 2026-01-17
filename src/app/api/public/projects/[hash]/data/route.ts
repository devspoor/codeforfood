import { NextRequest, NextResponse } from "next/server";
import { getProjectByHash, getProjectSummary } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60; // 15 minutes

interface RateLimitResult {
  allowed: boolean;
  remaining_attempts: number;
  reset_in_seconds: number;
  is_blocked: boolean;
}

async function checkRateLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  key: string
): Promise<RateLimitResult | null> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_max_attempts: MAX_ATTEMPTS,
    p_window_seconds: WINDOW_SECONDS,
  });

  if (error || !data || data.length === 0) {
    // SECURITY: Deny by default if rate limit check fails
    return null;
  }

  return data[0];
}

/**
 * POST /api/public/projects/[hash]/data
 * Returns full project data after password verification
 * SECURITY: This endpoint verifies password before returning any data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;
  const supabase = await createClient();

  // Get client IP for rate limiting
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  const rateLimitKey = `project_data:${ip}:${hash}`;

  // Check rate limit - deny if check fails (fail closed)
  const rateLimit = await checkRateLimit(supabase, rateLimitKey);
  if (!rateLimit) {
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many attempts. Please try again later.",
        retryAfter: rateLimit.reset_in_seconds,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.reset_in_seconds) },
      }
    );
  }

  try {
    const { password } = await request.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    // Check if project exists and get password hash
    const { data: projectCheck } = await supabase
      .from("projects")
      .select("public_password_hash")
      .eq("hash", hash)
      .single();

    if (!projectCheck) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // If no password set, this endpoint shouldn't be used
    if (!projectCheck.public_password_hash) {
      return NextResponse.json(
        { error: "Project is not password protected" },
        { status: 400 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, projectCheck.public_password_hash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Password verified - fetch full project data
    const project = await getProjectByHash(hash);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get organization with payment methods
    const { data: org } = await supabase
      .from("organizations")
      .select("hash, name, payment_methods(id, label, type, value)")
      .eq("id", project.organization_id)
      .single();

    const summary = getProjectSummary(project);

    return NextResponse.json({
      project,
      org,
      summary,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
