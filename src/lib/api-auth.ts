import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createRequestTimer, logRequest } from "./logger";

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
 * Includes automatic request logging with timing
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

  try {
    const response = await handler({ user, supabase });
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
