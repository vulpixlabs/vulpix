"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  attachTrailCanvas,
  startTrail,
  stopTrail,
} from "@/lib/trail-heat";

export function TrailCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/playground")) return;
    const cv = ref.current;
    if (!cv) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(window.innerWidth * dpr);
      cv.height = Math.round(window.innerHeight * dpr);
      cv.style.width = `${window.innerWidth}px`;
      cv.style.height = `${window.innerHeight}px`;
      cv.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    attachTrailCanvas(cv);
    startTrail();
    return () => {
      stopTrail();
      attachTrailCanvas(null);
      window.removeEventListener("resize", resize);
    };
  }, [pathname]);

  if (pathname?.startsWith("/playground")) return null;

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999]"
    />
  );
}
