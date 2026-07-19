import type { NextConfig } from "next";

const apiOrigin = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const supabaseOrigin = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");

/**
 * Content-Security-Policy. 'unsafe-inline' for script/style is a documented
 * trade-off: Next.js hydration and Tailwind runtime styles require it unless
 * a nonce pipeline is added (recorded as future work in docs/future-work.md).
 * connect-src is pinned to self + the API + Supabase (auth/storage);
 * img-src allows https: because product images live on external stores.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${apiOrigin} ${supabaseOrigin} ${supabaseOrigin ? supabaseOrigin.replace("https://", "wss://") : ""}`.trim(),
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
]
  .join("; ")
  .replace(/\s+/g, " ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@coloursense/contracts", "@coloursense/colour-engine"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
