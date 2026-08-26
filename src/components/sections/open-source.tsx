"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpIcon, ChevronDownIcon, MicIcon, PlusIcon } from "lucide-react";
import { gsap } from "@/lib/gsap";

export function OpenSource() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".os-cta", { y: 24, autoAlpha: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".os-cta", start: "top 90%" } });
      gsap.from(".os-demo", { y: 32, autoAlpha: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: ".os-demo", start: "top 85%" } });
      gsap.from(".os-word", { yPercent: 110, autoAlpha: 0, duration: 0.7, stagger: 0.04, ease: "power4.out", scrollTrigger: { trigger: ".os-line", start: "top 82%" } });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} data-trail="dark" className="relative border-b-2 border-ink bg-exotic text-paper">
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-6 py-20 md:grid-cols-[1.05fr_0.95fr] md:px-10 lg:py-24">
        <div>
          <p className="label text-paper/80">Live Playground</p>
          <h2 className="os-line mt-6 font-serif text-[clamp(2.4rem,5.5vw,4.6rem)] leading-[0.95]">
            {"Talk to the frontier.".split(" ").map((w, i) => (
              <span key={i} className="os-word inline-block overflow-hidden">
                <span className="inline-block">{w}&nbsp;</span>
              </span>
            ))}
            <span className="block font-sans text-lg font-semibold uppercase tracking-[0.2em] text-paper/80 mt-4">No keys. No setup. Just prompt.</span>
          </h2>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-paper/80">
            Open playground, pick a model, start chatting. Streaming answers, thinking traces, file drops. Your keys, your data.
          </p>
          <div className="os-cta mt-8 flex flex-wrap gap-3">
            <Link href="/playground" className="inline-flex items-center border-2 border-paper bg-paper px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-exotic hover:bg-exotic hover:text-paper">
              Open Playground
            </Link>
            <Link href="/arena" className="inline-flex items-center border-2 border-paper px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-paper hover:bg-paper hover:text-exotic">
              View Arena
            </Link>
          </div>
        </div>

        <div className="os-demo group relative block">
          <div className="border-2 border-paper bg-paper p-3 shadow-[8px_8px_0_0_#000] text-ink">
            <div className="flex items-center gap-1.5 border-b-2 border-ink bg-paper px-3 py-2">
              <span className="size-2 rounded-full bg-exotic" />
              <span className="size-2 rounded-full bg-ink/20" />
              <span className="size-2 rounded-full bg-ink/20" />
              <span className="ml-3 font-mono text-xs text-ink/50">playground</span>
              <span className="ml-auto label text-[10px] text-ink/40">live</span>
            </div>
            <div className="space-y-3 p-4">
              <div className="ml-auto max-w-[85%] border-2 border-ink/15 bg-ink/[0.04] px-3 py-2 text-sm leading-relaxed">Summarize the frontier in one line.</div>
              <div className="max-w-[88%] border-2 border-ink bg-exotic px-3 py-2 text-sm leading-relaxed text-paper">The frontier is open. Indexed live, chat ready and ranked. Search, prompt, prove.</div>
              <div className="ml-auto max-w-[85%] border-2 border-ink/15 bg-ink/[0.04] px-3 py-2 text-sm leading-relaxed">Which model wins on speed?</div>
              <div className="max-w-[88%] border-2 border-ink bg-paper px-3 py-3 text-sm leading-relaxed">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex size-3.5 shrink-0">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-exotic/40" />
                    <span className="relative inline-flex size-3.5 rounded-full border-2 border-ink border-t-exotic pg-spin" />
                  </span>
                  <span className="text-xs text-ink/60">Thinking</span>
                  <span className="pg-dots text-ink/40" />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">Speed depends on task and context. Run a quick benchmark in the arena or ask for a focused comparison.</p>
              </div>
            </div>
            <div className="relative flex flex-col border-t-2 border-ink bg-paper">
              <textarea
                readOnly
                placeholder="How can I help you today?"
                rows={1}
                className="block w-full resize-none bg-transparent px-4 pt-3 text-[15px] leading-relaxed outline-none placeholder:text-ink/35"
              />
              <div className="flex items-center gap-1.5 px-2.5 pb-2 pt-1">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-ink/25 text-ink/60">
                  <PlusIcon className="size-4" />
                </span>
                <span className="ml-auto" />
                <span className="flex h-7 items-center gap-1 border border-ink/15 px-2 text-xs font-semibold text-ink/70">
                  auto
                  <ChevronDownIcon className="size-3.5 shrink-0" />
                </span>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-ink/25 text-ink/60">
                  <MicIcon className="size-3.5" />
                </span>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-exotic bg-exotic text-paper">
                  <ArrowUpIcon className="size-4" />
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 pb-2">
                <span className="ml-auto hidden items-center gap-1 text-[10px] text-ink/30 sm:flex">paste or + to attach / for skills</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
