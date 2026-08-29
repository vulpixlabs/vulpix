import { createSerwistRoute } from "@serwist/turbopack";

const serwistRoute = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
  globPatterns: [
    ".next/static/**/*.css",
    ".next/static/media/**/*.{woff2,ico}",
    "public/icons/*.png",
    "public/screenshots/*.png",
    "public/vulpix-logo.png",
    "public/apple-touch-icon.png",
    "public/~offline.html",
  ],
});

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = false;

export async function GET(request: Request): Promise<Response> {
  return serwistRoute.GET(request, { params: Promise.resolve({ path: "sw.js" }) });
}
