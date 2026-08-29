import { type NextRequest, NextResponse } from "next/server";

const SHARE_COOKIE = "vulpix-share-target";
const MAX_SHARE_BYTES = 2_700;

function truncateUtf8(value: string) {
  const encoder = new TextEncoder();
  let bytes = 0;
  let result = "";
  for (const character of value) {
    const size = encoder.encode(character).byteLength;
    if (bytes + size > MAX_SHARE_BYTES) break;
    bytes += size;
    result += character;
  }
  return result;
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const text = [form.get("shareTitle"), form.get("shareText"), form.get("shareUrl")]
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    .map((value) => value.trim())
    .join("\n");
  const boundedText = truncateUtf8(text);
  const response = NextResponse.redirect(new URL("/playground?source=share", request.url), 303);
  if (boundedText) {
    response.cookies.set(SHARE_COOKIE, Buffer.from(boundedText).toString("base64url"), {
      httpOnly: true,
      maxAge: 60,
      path: "/",
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
    });
  } else {
    response.cookies.delete(SHARE_COOKIE);
  }
  return response;
}

export function GET(request: NextRequest) {
  const encoded = request.cookies.get(SHARE_COOKIE)?.value;
  let text = "";
  try {
    text = encoded ? Buffer.from(encoded, "base64url").toString("utf8") : "";
  } catch {
    text = "";
  }
  const response = NextResponse.json({ text }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.delete(SHARE_COOKIE);
  return response;
}
