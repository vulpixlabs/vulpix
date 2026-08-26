"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";

const WORDS = ["Indexing models", "Syncing benchmarks", "Ranking the frontier", "Opening the gates"];
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

let played = false;

export function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useIsoLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (played || reduced) {
      document.documentElement.classList.add("hz-instant");
      setDone(true);
      return;
    }
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    document.documentElement.style.overflow = "hidden";

    let master: gsap.core.Timeline | null = null;
    let safety: ReturnType<typeof setTimeout> | null = null;

    const finish = () => {
      if (safety) clearTimeout(safety);
      played = true;
      document.documentElement.style.overflow = "";
      setDone(true);
    };

    const counter = { v: 0 };
    master = gsap.timeline({ onComplete: finish });

    master.fromTo(
      wordRef.current,
      { yPercent: 110 },
      { yPercent: 0, duration: 0.3, ease: "power3.out" },
      0.05,
    );
    master.fromTo(
      logoRef.current,
      { clipPath: "inset(0 100% 0 0)" },
      { clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: "power3.out" },
      0.1,
    );
    master.to(
      counter,
      {
        v: 100,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
          if (numRef.current) {
            numRef.current.textContent = String(Math.round(counter.v)).padStart(2, "0");
          }
        },
      },
      0,
    );
    master.fromTo(
      barRef.current,
      { scaleX: 0 },
      { scaleX: 1, duration: 2, ease: "power2.inOut" },
      0,
    );

    for (let i = 1; i < WORDS.length; i++) {
      const at = 0.15 + i * 0.48;
      master
        .to(wordRef.current, { yPercent: -110, duration: 0.26, ease: "power2.in" }, at)
        .call(
          () => {
            if (wordRef.current) wordRef.current.textContent = WORDS[i];
          },
          [],
          at + 0.27,
        )
        .fromTo(
          wordRef.current,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.26, ease: "power3.out" },
          at + 0.28,
        );
    }

    master.to(
      rootRef.current?.querySelectorAll(".pl-fade") ?? [],
      { autoAlpha: 0, y: -14, duration: 0.25, ease: "power2.in" },
      2.25,
    );
    master.to(orangeRef.current, { yPercent: -100, duration: 0.75, ease: "power4.inOut" }, 2.4);
    master.to(paperRef.current, { yPercent: -100, duration: 0.75, ease: "power4.inOut" }, 2.52);

    safety = setTimeout(finish, 6000);

    return () => {
      if (safety) clearTimeout(safety);
      master?.kill();
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (done) return null;

  return (
    <div ref={rootRef} className="fixed inset-0 z-[9998] h-dvh">
      <div ref={paperRef} className="absolute inset-0 bg-paper" />
      <div
        ref={orangeRef}
        className="absolute inset-0 flex flex-col justify-between overflow-hidden bg-exotic p-6 md:p-14"
      >
        <div ref={logoRef} className="pl-fade flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Image
            src="/vulpix-logo.png"
            alt="Vulpix"
            width={380}
            height={70}
            priority
            unoptimized
            className="h-12 w-auto brightness-0 invert md:h-16"
          />
          <p className="label text-sm text-paper md:text-lg">The intelligent gateway to AI</p>
        </div>
        <div className="pointer-events-none flex items-center justify-center px-2">
          <div className="pl-fade overflow-hidden py-1">
            <span
              ref={wordRef}
              className="block text-center text-3xl font-bold uppercase tracking-tight text-paper sm:text-4xl md:text-6xl [overflow-wrap:anywhere]"
            >
              {WORDS[0]}
            </span>
          </div>
        </div>
        <div className="pl-fade flex flex-wrap items-end justify-end gap-2">
          <span
            ref={numRef}
            className="font-serif text-[clamp(5rem,20vw,20rem)] leading-[0.8] text-paper"
          >
            00
          </span>
          <span className="label mb-3 ml-1 text-paper/80 sm:mb-5 md:mb-12">% Loaded</span>
        </div>
        <div className="absolute bottom-0 left-0 h-1 w-full bg-paper/25">
          <div ref={barRef} className="h-full w-full origin-left bg-paper" />
        </div>
      </div>
    </div>
  );
}
