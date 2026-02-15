import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    NEXT_PUBLIC_PADDLE_ENV: process.env.NEXT_PUBLIC_PADDLE_ENV,
    NEXT_PUBLIC_PADDLE_PRICE_ID_PRO: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PRO,
    NEXT_PUBLIC_PADDLE_PRICE_ID_UNLIMITED: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_UNLIMITED,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  // Security headers
  async headers() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : "*.supabase.co";

    // Content Security Policy - defense in depth against XSS
    const cspDirectives = [
      "default-src 'self'",
      // Scripts: self + inline for Next.js hydration + eval for dev mode + Paddle
      process.env.NODE_ENV === "production"
        ? "script-src 'self' 'unsafe-inline' https://*.paddle.com https://static.cloudflareinsights.com"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.paddle.com https://static.cloudflareinsights.com",
      // Styles: self + inline for Tailwind/CSS-in-JS + Paddle
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.paddle.com",
      // Fonts: self + Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + Supabase storage + avatars + Paddle
      `img-src 'self' data: blob: https://*.supabase.co https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://*.paddle.com`,
      // Connect: API calls to self + Supabase + Paddle
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://*.paddle.com https://cloudflareinsights.com`,
      // Frame: Paddle checkout overlay
      "frame-src 'self' https://*.paddle.com",
      // Frame ancestors: none (same as X-Frame-Options: DENY)
      "frame-ancestors 'none'",
      // Form actions: only to self
      "form-action 'self'",
      // Base URI: only self
      "base-uri 'self'",
      // Object sources: none (no Flash/plugins)
      "object-src 'none'",
      // Upgrade insecure requests in production
      ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: cspDirectives,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
