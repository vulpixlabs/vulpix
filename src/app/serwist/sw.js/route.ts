import { createSerwistRoute } from "@serwist/turbopack";

const serwistRoute = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
});

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = false;

export async function GET(request: Request): Promise<Response> {
  return serwistRoute.GET(request, { params: Promise.resolve({ path: "sw.js" }) });
}
