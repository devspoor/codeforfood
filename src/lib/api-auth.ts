import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createRequestTimer, logRequest } from "./logger";
import { createClient as createServerClient } from "./supabase/server";

// Rate limiting configuration for authenticated API endpoints
const API_RATE_LIMIT_MAX_REQUESTS = 100; // requests per window
const API_RATE_LIMIT_WINDOW_SECONDS = 60; // 1 minute window

interface RateLimitResult {
  allowed: boolean;
  remaining_attempts: number;
  reset_in_seconds: number;
  is_blocked: boolean;
}

async function checkApiRateLimit(userId: string, endpoint: string): Promise<RateLimitResult | null> {
  try {
    const supabase = await createServerClient();
    // Rate limit key includes user ID and endpoint category
    const endpointCategory = endpoint.split("/").slice(0, 4).join("/"); // e.g., /api/v1/comments
    const rateLimitKey = `api:${userId}:${endpointCategory}`;

    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: rateLimitKey,
      p_max_attempts: API_RATE_LIMIT_MAX_REQUESTS,
      p_window_seconds: API_RATE_LIMIT_WINDOW_SECONDS,
    });

    if (error || !data || data.length === 0) {
      console.error("API rate limit check error:", error?.message);
      return null;
    }

    return data[0];
  } catch {
    return null;
  }
}

/**
 * Creates a Supabase client with Bearer token authentication for mobile API
 * Uses the access token from Authorization header
 */
export function createApiClient(accessToken: string) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
}

/**
 * Extracts Bearer token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * API response helpers
 */
export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function apiUnauthorized() {
  return apiError("Unauthorized", 401);
}

export function apiNotFound(resource: string = "Resource") {
  return apiError(`${resource} not found`, 404);
}

export function apiForbidden() {
  return apiError("Forbidden", 403);
}

/**
 * Wrapper for authenticated API routes
 * Validates Bearer token and provides user and supabase client
 * Includes automatic request logging with timing and rate limiting
 */
export async function withAuth(
  request: NextRequest,
  handler: (context: { user: User; supabase: ReturnType<typeof createApiClient> }) => Promise<NextResponse>
): Promise<NextResponse> {
  const timer = createRequestTimer();
  const method = request.method;
  const path = new URL(request.url).pathname;

  const token = extractBearerToken(request);
  if (!token) {
    logRequest({ method, path, status: 401, duration: timer() });
    return apiUnauthorized();
  }

  const supabase = createApiClient(token);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    logRequest({ method, path, status: 401, duration: timer() });
    return apiUnauthorized();
  }

  // Check per-user rate limit for API endpoints
  const rateLimit = await checkApiRateLimit(user.id, path);
  if (rateLimit === null) {
    // Fail closed - don't allow requests when rate limiting is unavailable
    console.error("API rate limit unavailable - failing closed for user:", user.id);
    logRequest({ method, path, status: 503, duration: timer(), userId: user.id });
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 503, headers: { "Retry-After": "60" } }
    );
  }
  if (!rateLimit.allowed) {
    logRequest({ method, path, status: 429, duration: timer(), userId: user.id });
    return NextResponse.json(
      {
        error: "Too many requests. Please slow down.",
        retryAfter: rateLimit.reset_in_seconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.reset_in_seconds),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimit.reset_in_seconds),
        },
      }
    );
  }

  try {
    const response = await handler({ user, supabase });
    // Add rate limit headers to successful responses
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining_attempts));
    response.headers.set("X-RateLimit-Reset", String(rateLimit.reset_in_seconds));
    logRequest({
      method,
      path,
      status: response.status,
      duration: timer(),
      userId: user.id,
    });
    return response;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    logRequest({
      method,
      path,
      status: 500,
      duration: timer(),
      userId: user.id,
      error: errorMessage,
    });
    throw err;
  }
}

/**
 * Type for API handler with auth context
 */
export type AuthenticatedHandler<T = unknown> = (context: {
  user: User;
  supabase: ReturnType<typeof createApiClient>;
  request: NextRequest;
  params?: Record<string, string>;
}) => Promise<NextResponse<T>>;

/**
 * Handles errors in API routes with proper logging
 * Returns appropriate error response based on error type
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  // Log error for debugging (never expose details to client)
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`API Error${context ? ` in ${context}` : ""}:`, {
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString(),
  });

  // Handle specific error types
  if (error instanceof SyntaxError) {
    // JSON parsing error
    return apiError("Invalid JSON in request body", 400);
  }

  if (error instanceof TypeError) {
    // Type-related errors (often from accessing properties on undefined)
    return apiError("Invalid request format", 400);
  }

  // Generic error - don't expose internal details
  return apiError("Request failed", 400);
}
