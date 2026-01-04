import { NextRequest, NextResponse } from "next/server";
import { verifyProjectPassword } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

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
    console.error("Rate limit check error: database unavailable");
    return { allowed: true, remaining_attempts: MAX_ATTEMPTS - 1, reset_in_seconds: WINDOW_SECONDS, is_blocked: false };
  }

  return data[0];
}

async function resetRateLimit(supabase: Awaited<ReturnType<typeof createClient>>, key: string): Promise<void> {
  await supabase.rpc("reset_rate_limit", { p_key: key });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;
  const supabase = await createClient();

  // Get client IP for rate limiting
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  const rateLimitKey = `project_password:${ip}:${hash}`;

  // Check rate limit
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

    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const valid = await verifyProjectPassword(hash, password);

    if (!valid) {
      return NextResponse.json(
        {
          error: "Invalid password",
          attemptsRemaining: rateLimit.remaining_attempts,
        },
        { status: 401 }
      );
    }

    // Reset rate limit on success
    await resetRateLimit(supabase, rateLimitKey);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
