"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const words = name.trim().split(/[\s/._-]+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

interface LogoMarkProps {
  name: string;
  src?: string | null;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  loading?: "eager" | "lazy";
}

/**
 * Renders a remote logo with an in-DOM monogram fallback.
 *
 * Brand CDNs and avatar providers are intentionally treated as optional. If a
 * request is blocked, unavailable, or returns an invalid image, the broken
 * image node is removed and an identifiable local mark takes its place.
 */
export function LogoMark({
  name,
  src,
  className,
  imageClassName,
  fallbackClassName,
  loading = "lazy",
}: LogoMarkProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !src || failedSrc === src;

  if (failed) {
    return (
      <span
        aria-hidden="true"
        data-logo-fallback={name}
        className={cn(
          "inline-grid shrink-0 place-items-center overflow-hidden bg-exotic font-sans font-black leading-none text-paper",
          className,
          fallbackClassName,
        )}
      >
        {initials(name)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading={loading}
      decoding="async"
      className={cn("shrink-0 object-contain", className, imageClassName)}
      onError={() => setFailedSrc(src)}
    />
  );
}
