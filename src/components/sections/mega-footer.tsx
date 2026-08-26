"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { gsap } from "@/lib/gsap";

const COLUMNS: {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}[] = [
  {
    title: "Explore",
    links: [
      { label: "Models", href: "/hub" },
      { label: "Datasets", href: "/hub?view=datasets" },
      { label: "Playground", href: "/playground" },
      { label: "Arena", href: "/arena" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "/arena", external: false },
      { label: "Index API", href: "/hub", external: false },
      { label: "Arena API (mock)", href: "/arena", external: false },
    ],
  },
  {
    title: "Index",
    links: [
      { label: "Text Generation", href: "/hub?task=text-generation" },
      { label: "Computer Vision", href: "/hub?task=image-classification" },
      { label: "Audio", href: "/hub?task=automatic-speech-recognition" },
    ],
  },
];

export function MegaFooter() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".foot-cta", {
        y: 48,
        autoAlpha: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".foot-cta", start: "top 88%" },
      });
      gsap.from(".foot-col", {
        y: 32,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".foot-cols", start: "top 90%" },
      });
      gsap.from(".foot-mark", {
        yPercent: 40,
        autoAlpha: 0,
        duration: 1.2,
        ease: "power4.out",
        scrollTrigger: { trigger: ".foot-mark", start: "top 95%" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <footer ref={ref} data-trail="light" className="relative overflow-hidden bg-paper text-ink">
      <div className="mx-auto w-full max-w-[1200px] px-6 pt-20 md:px-10">
        <div className="foot-cta flex flex-wrap items-end justify-between gap-8 border-2 border-ink bg-paper p-8 shadow-[6px_6px_0_0_#000] md:p-10">
          <div>
            <p className="label text-exotic">Start now, no sign-up</p>
            <h2 className="mt-3 max-w-xl font-serif text-[clamp(2.4rem,5vw,4.3rem)] leading-[0.95]">
              Ready to explore the <span className="italic text-exotic">frontier?</span>
            </h2>
          </div>
          <Link
            href="/hub"
            className="inline-flex items-center gap-3 border-2 border-exotic bg-exotic px-8 py-4 font-sans text-xs font-semibold uppercase tracking-[0.25em] text-paper transition-none hover:bg-paper hover:text-exotic"
          >
            Enter Hub
            <ArrowUpRightIcon className="size-4" />
          </Link>
        </div>

        <div className="foot-cols grid gap-10 py-14 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title} className="foot-col">
              <p className="label text-ink/50">{col.title}</p>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex items-center gap-2 font-sans text-lg font-semibold tracking-tight text-ink transition-none hover:text-exotic"
                      >
                        {l.label}
                        <ArrowUpRightIcon className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="group inline-flex items-center gap-2 font-sans text-lg font-semibold tracking-tight text-ink transition-none hover:text-exotic"
                      >
                        {l.label}
                        <ArrowUpRightIcon className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden px-2 py-6">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden>
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>
        <h2 className="foot-mark relative select-none text-center font-serif text-[clamp(4rem,17.5vw,17rem)] leading-[0.82] tracking-[-0.02em]">
          Vulpix<span className="italic text-exotic">Labs</span>
        </h2>
      </div>

      <div className="border-t-2 border-ink">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-6 md:px-10">
          <p className="label text-ink/60">© 2026 VulpixLabs</p>
          <p className="label text-ink/60">Data streams live</p>
        </div>
      </div>
    </footer>
  );
}
