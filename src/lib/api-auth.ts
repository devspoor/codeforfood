import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

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
 */
export async function withAuth(
  request: NextRequest,
  handler: (context: { user: User; supabase: ReturnType<typeof createApiClient> }) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = extractBearerToken(request);
  if (!token) {
    return apiUnauthorized();
  }

  const supabase = createApiClient(token);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return apiUnauthorized();
  }

  return handler({ user, supabase });
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
