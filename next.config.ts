import type { NextConfig } from "next";

// Spec section 18 ("Web security"): CSP, HSTS, X-Frame-Options DENY, Referrer-Policy,
// Permissions-Policy. 'unsafe-inline' on script-src/style-src is a deliberate, documented
// trade-off, not an oversight: Next.js's own hydration bootstrap and Tailwind's runtime both
// rely on inline script/style tags, and a nonce-based CSP (removing the need for
// 'unsafe-inline') is a separate, larger piece of work than this pass's NFR hardening scope.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const isDev = process.env.NODE_ENV !== "production";
const csp = [
  "default-src 'self'",
  // 'unsafe-eval' only in dev: React's dev-mode debugging (not production builds) uses eval()
  // to reconstruct call stacks. @vercel/analytics loads its script from va.vercel-scripts.com.
  `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // @vercel/analytics reports beacons to vercel-insights.com.
  `connect-src 'self' ${supabaseUrl} https://*.vercel-insights.com`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
