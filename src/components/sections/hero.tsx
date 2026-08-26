"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { SearchCommand } from "@/components/hub/search-command";
import { LogoMark } from "@/components/ui/logo-mark";
import { landingLogoUrl } from "@/lib/landing-logos";

const TICKERS: { name: string; slug: string }[] = [
  { name: "Meta", slug: "meta" },
  { name: "Gemini", slug: "googlegemini" },
  { name: "DeepSeek", slug: "deepseek" },
  { name: "Qwen", slug: "qwen" },
  { name: "Mistral", slug: "mistralai" },
  { name: "MiniMax", slug: "minimax" },
  { name: "Kimi", slug: "moonshotai" },
  { name: "NVIDIA", slug: "nvidia" },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const router = useRouter();

  const go = (query: string) => {
    router.push(`/hub?q=${encodeURIComponent(query)}`);
  };

  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const zoom = () => {
      el.style.setProperty("--hub-zoom", String(el.clientWidth / 1440));
    };
    zoom();
    window.addEventListener("resize", zoom);
    return () => window.removeEventListener("resize", zoom);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".hz-preview-img", {
        yPercent: -6,
        ease: "none",
        scrollTrigger: {
          trigger: ".hz-preview",
          start: "top 90%",
          end: "bottom top",
          scrub: true,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      data-trail="light"
      className="relative overflow-hidden bg-paper pt-20 text-ink"
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 text-center">
        <h1 className="font-serif text-[clamp(2.25rem,4.5vw,4rem)] italic leading-none text-ink/80">
          The front door to
        </h1>
        <h2 className="mt-3 font-sans text-[clamp(2.75rem,6.5vw,5.75rem)] font-extrabold leading-[0.98] tracking-[-0.03em]">
          <span className="block overflow-hidden pb-1">
            <span className="hz-line block">
              <span className="text-exotic">Open Source</span> AI.
            </span>
          </span>
        </h2>

        <p className="hz-sub mx-auto mt-7 max-w-xl text-lg leading-relaxed text-ink/60">
          Search the live frontier. Filter by task. Chat in the playground and rank in the arena.
        </p>

        <SearchCommand variant="hero" />

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {TICKERS.map((t, i) => (
            <button
              key={t.name}
              type="button"
              onClick={() => go(t.name)}
              style={{ "--hz-delay": `${4.8 + i * 0.05}s` } as React.CSSProperties}
              className="hz-tick flex cursor-pointer items-center gap-2 rounded-full border-2 border-ink/10 bg-paper py-1.5 pl-2 pr-4 transition-none hover:border-exotic hover:text-exotic"
            >
              <LogoMark
                name={t.name}
                src={landingLogoUrl(t.slug)}
                className="size-5 text-[8px]"
                fallbackClassName="bg-exotic text-paper"
              />
              <span className="font-sans text-sm font-semibold">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="hz-preview relative mx-auto mt-16 w-full max-w-[1400px] px-6 md:px-10">
        <div className="border-2 border-ink bg-paper">
          <div className="flex items-center gap-2 border-b-2 border-ink px-5 py-3">
            <span className="size-3 bg-exotic" />
            <span className="size-3 bg-ink/20" />
            <span className="size-3 bg-ink/20" />
            <span className="ml-4 flex-1 border border-ink/15 px-4 py-1 text-left font-sans text-xs text-ink/50">
              hub.vulpix.ai/models, live
            </span>
          </div>
            <div ref={frameRef} className="relative h-[420px] overflow-hidden md:h-[560px]">
              <div className="hz-preview-img absolute left-0 top-0 w-full">
                <iframe
                  src="/hub"
                  title="Vulpix live model index, scroll to explore"
                  loading="lazy"
                  tabIndex={-1}
                  className="block border-0 bg-paper"
                  style={{
                    width: "1440px",
                    height: "1400px",
                    transform: "scale(var(--hub-zoom, 0.9))",
                    transformOrigin: "top left",
                  }}
                />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-paper to-transparent" />
            </div>
        </div>
        <p className="label mt-5 text-center text-ink/40">
          Live index, interactive playground shipping next
        </p>
      </div>
    </section>
  );
}
