import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_DOMAIN = process.env.PUBLIC_DOMAIN || "codefor.food";
const ADMIN_DOMAIN = process.env.ADMIN_DOMAIN || "my.codefor.food";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * CSRF protection: validates Origin header for state-changing requests
 */
function validateCsrf(request: NextRequest): boolean {
  const method = request.method;

  // Only check state-changing methods
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return true;
  }

  // Skip CSRF for public API endpoints (they use other protections like rate limiting)
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/api/public/")) {
    return true;
  }

  // Skip CSRF for Telegram webhook (uses secret token header for auth)
  if (pathname.startsWith("/api/telegram/")) {
    return true;
  }

  // Skip CSRF for Paddle webhook (uses signature header for auth)
  if (pathname.startsWith("/api/webhooks/paddle")) {
    return true;
  }

  // Mobile API v1 uses Bearer token authentication (not cookies)
  // Bearer tokens are passed via Authorization header which browsers don't auto-include
  // in cross-origin requests, making traditional CSRF attacks impossible.
  // However, we still validate Origin as defense-in-depth against misconfiguration.
  if (pathname.startsWith("/api/v1/")) {
    const origin = request.headers.get("origin");
    // If no origin (direct API call from mobile app / curl), allow
    if (!origin) {
      return true;
    }
    // If origin present (browser request), validate it
    try {
      const originUrl = new URL(origin);
      const originHost = originUrl.host;
      const host = request.headers.get("host");
      const isValidLocalhost = !IS_PRODUCTION && /^localhost(:\d+)?$/.test(originHost);

      if (
        originHost === host ||
        originHost === ADMIN_DOMAIN ||
        originHost === `www.${ADMIN_DOMAIN}` ||
        isValidLocalhost
      ) {
        return true;
      }
    } catch {
      return false;
    }
    // Reject browser requests from unknown origins
    return false;
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  // In development, allow requests without origin (e.g., from API clients)
  if (!IS_PRODUCTION && !origin) {
    return true;
  }

  // Origin must match host
  if (origin) {
    try {
      const originUrl = new URL(origin);
      const originHost = originUrl.host;

      // Allow if origin matches current host or known domains
      // Note: localhost check uses regex to ensure it's actually localhost (not localhost.evil.com)
      const isValidLocalhost = !IS_PRODUCTION && /^localhost(:\d+)?$/.test(originHost);

      if (
        originHost === host ||
        originHost === ADMIN_DOMAIN ||
        originHost === PUBLIC_DOMAIN ||
        originHost === `www.${ADMIN_DOMAIN}` ||
        originHost === `www.${PUBLIC_DOMAIN}` ||
        isValidLocalhost
      ) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

function isAdminDomain(host: string): boolean {
  // In production, don't treat localhost as admin domain
  if (IS_PRODUCTION) {
    return host === ADMIN_DOMAIN || host === `www.${ADMIN_DOMAIN}`;
  }
  return host === ADMIN_DOMAIN || host === `www.${ADMIN_DOMAIN}` || host.startsWith("localhost");
}

function isPublicDomain(host: string): boolean {
  return host === PUBLIC_DOMAIN || host === `www.${PUBLIC_DOMAIN}`;
}

export async function updateSession(request: NextRequest) {
  // CSRF protection for API routes
  if (request.nextUrl.pathname.startsWith("/api/") && !validateCsrf(request)) {
    return NextResponse.json(
      { error: "CSRF validation failed" },
      { status: 403 }
    );
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Domain-based routing
  const isAdmin = isAdminDomain(host);
  const isPublic = isPublicDomain(host);

  // Public domain: redirect admin routes to admin domain
  if (isPublic && (pathname.startsWith("/admin") || pathname === "/login" || pathname.startsWith("/auth"))) {
    const url = new URL(request.url);
    url.host = ADMIN_DOMAIN;
    url.port = "";
    return NextResponse.redirect(url);
  }

  // Admin domain: redirect public routes to public domain
  if (isAdmin && !pathname.startsWith("localhost") && (pathname.startsWith("/p/") || pathname.startsWith("/o/"))) {
    const url = new URL(request.url);
    url.host = PUBLIC_DOMAIN;
    url.port = "";
    return NextResponse.redirect(url);
  }

  // Admin domain: redirect root to /admin
  if (isAdmin && pathname === "/" && !host.startsWith("localhost")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  // Public domain: block admin/login routes (404)
  if (isPublic && (pathname.startsWith("/admin") || pathname === "/login")) {
    return NextResponse.rewrite(new URL("/not-found", request.url));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip auth check if Supabase is not configured
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes (only on admin domain)
  if (
    !user &&
    pathname.startsWith("/admin")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users from login to admin
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
