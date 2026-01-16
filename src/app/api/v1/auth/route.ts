import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_SECONDS = 15 * 60; // 15 minutes
const MAX_REFRESH_ATTEMPTS = 10;
const REFRESH_WINDOW_SECONDS = 5 * 60; // 5 minutes

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface RateLimitResult {
  allowed: boolean;
  remaining_attempts: number;
  reset_in_seconds: number;
}

async function checkLoginRateLimit(ip: string, email: string): Promise<RateLimitResult | null> {
  try {
    const supabase = await createServerClient();
    const rateLimitKey = `auth_login:${ip}:${email.toLowerCase()}`;

    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: rateLimitKey,
      p_max_attempts: MAX_LOGIN_ATTEMPTS,
      p_window_seconds: LOGIN_WINDOW_SECONDS,
    });

    if (error || !data || data.length === 0) {
      console.error("Rate limit check error:", error?.message);
      return null;
    }

    return data[0];
  } catch {
    return null;
  }
}

async function resetLoginRateLimit(ip: string, email: string): Promise<void> {
  try {
    const supabase = await createServerClient();
    const rateLimitKey = `auth_login:${ip}:${email.toLowerCase()}`;
    await supabase.rpc("reset_rate_limit", { p_key: rateLimitKey });
  } catch {
    // Ignore reset errors
  }
}

async function checkRefreshRateLimit(ip: string): Promise<RateLimitResult | null> {
  try {
    const supabase = await createServerClient();
    const rateLimitKey = `auth_refresh:${ip}`;

    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: rateLimitKey,
      p_max_attempts: MAX_REFRESH_ATTEMPTS,
      p_window_seconds: REFRESH_WINDOW_SECONDS,
    });

    if (error || !data || data.length === 0) {
      console.error("Refresh rate limit check error:", error?.message);
      return null;
    }

    return data[0];
  } catch {
    return null;
  }
}

/**
 * POST /api/v1/auth
 * Login with email/password and get access/refresh tokens
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { email, password, refresh_token } = await request.json();

    // Refresh token flow
    if (refresh_token) {
      // Basic validation of refresh token format and length
      if (typeof refresh_token !== "string" || refresh_token.length < 10 || refresh_token.length > 2048) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      // Apply rate limiting to prevent abuse of compromised refresh tokens
      const forwardedFor = request.headers.get("x-forwarded-for");
      const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

      const refreshRateLimit = await checkRefreshRateLimit(ip);
      if (refreshRateLimit === null) {
        return NextResponse.json(
          { error: "Service temporarily unavailable. Please try again later." },
          { status: 503, headers: { "Retry-After": "60" } }
        );
      }
      if (!refreshRateLimit.allowed) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429, headers: { "Retry-After": String(refreshRateLimit.reset_in_seconds) } }
        );
      }

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token,
      });

      if (error || !data.session) {
        // Don't expose specific error messages - could reveal token state
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      return NextResponse.json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at,
        user: {
          id: data.user?.id,
          email: data.user?.email,
          created_at: data.user?.created_at,
        },
      });
    }

    // Email/password login - apply rate limiting
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

    // Check rate limit
    const rateLimit = await checkLoginRateLimit(ip, email);
    if (rateLimit === null) {
      // Fail closed - don't allow login attempts when rate limiting is unavailable
      // This prevents brute-force attacks during database outages
      console.error("Rate limit check unavailable for auth - failing closed");
      return NextResponse.json(
        { error: "Service temporarily unavailable. Please try again later." },
        { status: 503, headers: { "Retry-After": "60" } }
      );
    }
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again later.",
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Never expose specific error messages or attempt counts to prevent user enumeration
      // Supabase may return "User not found" or "Invalid credentials" which reveals info
      // attemptsRemaining was removed as it helps attackers calibrate brute-force attacks
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Reset rate limit on successful login
    await resetLoginRateLimit(ip, email);

    return NextResponse.json({
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_in: data.session?.expires_in,
      expires_at: data.session?.expires_at,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        created_at: data.user?.created_at,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

/**
 * DELETE /api/v1/auth
 * Sign out (invalidate refresh token)
 */
export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );

  const { error } = await client.auth.signOut();

  if (error) {
    // Don't expose specific error messages
    return NextResponse.json({ error: "Logout failed" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
