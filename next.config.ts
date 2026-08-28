import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "cdn.simpleicons.org" },
      { protocol: "https", hostname: "cdn-avatars.huggingface.co" },
      { protocol: "https", hostname: "huggingface.co" },
      { protocol: "https", hostname: "www.google.com" },
      { protocol: "https", hostname: "svgl.app" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@phosphor-icons/react"],
  },
  headers: async () => {
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: `${scriptSrc}; style-src 'self' 'unsafe-inline'; default-src 'self'; img-src 'self' data: blob: https://cdn.simpleicons.org https://cdn-avatars.huggingface.co https://huggingface.co https://www.google.com https://svgl.app https://*.gstatic.com; font-src 'self' data:; connect-src 'self'; frame-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'`,
          },
        ],
      },
    {
      source: "/icons/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    },
    {
      source: "/apple-touch-icon.png",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    },
    ];
  },
  turbopack: {
    root: import.meta.dirname,
  },
};

export default withSerwist(nextConfig);
