"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "@/lib/gsap";

const STRIP = "NOT FOUND · ERROR 404 · LOST IN THE FRONTIER · ";

function MarqueeRow({ reverse }: { reverse?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tween = gsap.fromTo(
      el,
      { xPercent: reverse ? -50 : 0 },
      {
        xPercent: reverse ? 0 : -50,
        duration: 24,
        ease: "none",
        repeat: -1,
      },
    );
    return () => {
      tween.kill();
    };
  }, [reverse]);

  const half = STRIP.repeat(6);
  return (
    <div className="overflow-hidden border-y-2 border-ink bg-exotic py-2.5" aria-hidden="true">
      <div ref={trackRef} className="flex w-max">
        <span className="label whitespace-nowrap text-paper">{half}</span>
        <span className="label whitespace-nowrap text-paper">{half}</span>
      </div>
    </div>
  );
}

export function NotFoundClient() {
  const rootRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from(".nf-char", {
        y: 140,
        rotation: 10,
        autoAlpha: 0,
        duration: 1,
        ease: "power4.out",
        stagger: 0.12,
        delay: 0.15,
      });
      gsap.from(".nf-heading", {
        yPercent: 120,
        duration: 0.9,
        ease: "power4.out",
        delay: 0.55,
      });
      gsap.from(".nf-sub", { autoAlpha: 0, y: 16, duration: 0.7, delay: 0.85, ease: "power3.out" });
      gsap.from(".nf-cta", {
        autoAlpha: 0,
        y: 14,
        duration: 0.6,
        stagger: 0.1,
        delay: 1,
        ease: "power3.out",
      });
      gsap.from(".nf-fox", {
        autoAlpha: 0,
        rotation: -20,
        duration: 0.9,
        delay: 0.4,
        ease: "back.out(2)",
      });
      gsap.from(".nf-strip", { autoAlpha: 0, duration: 0.8, delay: 0.2 });
    }, rootRef);

    const xTo = gsap.quickTo(numRef.current, "x", { duration: 0.7, ease: "power3" });
    const yTo = gsap.quickTo(numRef.current, "y", { duration: 0.7, ease: "power3" });
    const onMove = (e: MouseEvent) => {
      xTo((e.clientX / window.innerWidth - 0.5) * 26);
      yTo((e.clientY / window.innerHeight - 0.5) * 18);
    };
    window.addEventListener("mousemove", onMove);

    return () => {
      ctx.revert();
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  const shakeFox = () => {
    if (!numRef.current) return;
    const fox = rootRef.current?.querySelector(".nf-fox");
    if (fox) {
      gsap.fromTo(
        fox,
        { rotation: -8 },
        { rotation: 6, duration: 0.7, ease: "elastic.out(1.2, 0.28)" },
      );
    }
  };

  return (
    <div ref={rootRef} className="flex min-h-[calc(100dvh-5rem)] flex-col">
      <div className="nf-strip">
        <MarqueeRow />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-14 text-center">
        <div className="nf-fox cursor-pointer" onMouseEnter={shakeFox} onClick={shakeFox}>
          <Image
            src="/vulpix-logo.png"
            alt=""
            width={72}
            height={72}
            className="h-14 w-auto -rotate-6 md:h-16"
            priority
          />
        </div>

        <div ref={numRef} aria-hidden="true" className="select-none">
          <p className="font-serif text-[clamp(7rem,26vw,17rem)] italic leading-[0.85] text-exotic">
            {["4", "0", "4"].map((c, i) => (
              <span key={i} className="nf-char inline-block">
                {c}
              </span>
            ))}
          </p>
        </div>

        <h1 className="mt-2 overflow-hidden text-3xl font-bold tracking-tight text-ink md:text-5xl">
          <span className="nf-heading block">Lost in the frontier.</span>
        </h1>
        <p className="nf-sub mt-3 max-w-md text-sm text-ink/55 md:text-base">
          The page you are looking for was moved, renamed, or never existed in the index.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/hub"
            className="nf-cta border-2 border-ink bg-paper px-5 py-2.5 text-sm font-semibold text-ink shadow-[4px_4px_0_0_#000] transition-transform hover:-translate-y-0.5"
          >
            Back to Hub
          </Link>
          <Link
            href="/"
            className="nf-cta border-2 border-exotic bg-exotic px-5 py-2.5 text-sm font-semibold text-paper shadow-[4px_4px_0_0_#000] transition-transform hover:-translate-y-0.5"
          >
            Go Home
          </Link>
        </div>
      </div>

      <div className="nf-strip">
        <MarqueeRow reverse />
      </div>
    </div>
  );
}
