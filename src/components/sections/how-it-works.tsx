"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const STEPS = [
  {
    n: "01",
    title: "Search",
    desc: "Query the live index by name, task or modality. Results stream as you type, no refresh, no stale cache.",
  },
  {
    n: "02",
    title: "Filter",
    desc: "Narrow by task, format and license until the right contender stands alone. The taxonomy does the digging.",
  },
  {
    n: "03",
    title: "Prove",
    desc: "Chat in the playground or rank in the arena. One prompt, live proof, mock now, verified next.",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hiw-head", {
        y: 56,
        autoAlpha: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".hiw-head", start: "top 85%" },
      });

      gsap.fromTo(
        ".hiw-progress",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          transformOrigin: "top",
          scrollTrigger: {
            trigger: ".hiw-steps",
            start: "top 70%",
            end: "bottom 60%",
            scrub: true,
          },
        }
      );

      gsap.utils.toArray<HTMLElement>(".hiw-step").forEach((step) => {
        gsap.from(step, {
          x: -64,
          autoAlpha: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: step, start: "top 82%" },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      data-trail="light"
      className="relative border-b-2 border-ink bg-paper text-ink"
    >
      <div className="mx-auto w-full max-w-[1200px] px-6 py-28 md:px-10 lg:py-36">
        <div className="hiw-head">
          <p className="label text-exotic">How It Works</p>
          <h2 className="mt-6 font-serif text-[clamp(2.75rem,5.5vw,5rem)] leading-[0.95]">
            Search. Filter. <span className="italic text-exotic">Prove.</span>
          </h2>
        </div>

        <div className="hiw-steps relative mt-20 grid gap-16 md:grid-cols-[80px_1fr] md:gap-12">
          <div className="relative hidden md:block">
            <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-ink/15" />
            <div className="hiw-progress absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-exotic" />
          </div>

          <div className="space-y-8">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="hiw-step group flex cursor-default items-stretch border-2 border-ink bg-paper transition-colors duration-75 hover:bg-exotic hover:text-paper"
              >
                <span className="flex w-24 shrink-0 items-center justify-center border-r-2 border-ink font-serif text-5xl italic transition-colors duration-75 group-hover:border-paper group-hover:text-paper md:w-28 md:text-6xl">
                  {s.n}
                </span>
                <div className="p-8">
                  <h3 className="font-sans text-2xl font-bold uppercase tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink/70 transition-colors duration-75 group-hover:text-paper/85">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
