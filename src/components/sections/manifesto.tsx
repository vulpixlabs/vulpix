"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "motion/react";
import { BlurFade } from "@/components/ui/blur-fade";

function NumberTicker({ value, suffix = "", delay = 0 }: { value: number; suffix?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 30, stiffness: 90 });
  const inView = useInView(ref, { once: true, margin: "-30px" });

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => mv.set(value), delay * 1000);
    return () => clearTimeout(t);
  }, [inView, mv, value, delay]);

  useEffect(() => {
    return spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = Math.round(v).toLocaleString("en-US") + suffix;
    });
  }, [spring, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

const STATS = [
  { value: 500, suffix: "k+", label: "models indexed", desc: "Every weight tracked live" },
  { value: 100, suffix: "k+", label: "datasets curated", desc: "Ready to train & eval" },
  { value: 50, suffix: "+", label: "tasks ready", desc: "From chat to vision" },
];

export function Manifesto() {
  return (
    <section data-trail="light" className="relative border-b border-ink/10 bg-paper text-ink">
      <div className="mx-auto w-full max-w-[1100px] px-6 py-20 md:px-10 lg:py-28">
        <BlurFade duration={0.5}>
          <p className="label text-exotic">The Manifesto</p>
        </BlurFade>

        {/* Cards grid */}
        <div className="mt-8 grid gap-4 lg:grid-cols-12">
          {/* Statement card - large */}
          <BlurFade duration={0.6} delay={0.06} className="lg:col-span-8">
            <div className="relative h-full border-2 border-ink bg-white p-7 shadow-[6px_6px_0_0_#000] md:p-8">
              <div className="absolute inset-x-0 top-0 h-1 bg-exotic" aria-hidden />
              <p className="font-serif text-[clamp(1.4rem,2.6vw,1.85rem)] leading-[1.35] tracking-tight text-ink">
                <span className="font-serif italic text-exotic">The frontier is open.</span> Vulpix is a live index of every
                model, dataset and weight the moment it ships, searchable by task, chat-ready in the playground, and ranked
                in the arena. <span className="font-serif italic">No gatekeeping.</span> No hidden endpoints. Just open
                intelligence, ready to build.
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-ink/10 pt-4">
                <span className="h-1.5 w-1.5 rounded-full bg-exotic" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Live index · open weights</span>
              </div>
            </div>
          </BlurFade>

          {/* Side principle card */}
          <BlurFade duration={0.6} delay={0.12} className="lg:col-span-4">
            <div className="flex h-full flex-col border-2 border-ink bg-exotic p-7 text-paper shadow-[6px_6px_0_0_#000] md:p-8">
              <p className="label text-paper/80">Principle</p>
              <p className="mt-4 text-[15px] font-medium leading-relaxed">
                One search bar, instant filters, one-click inference. Explore, then prove it in real time.
              </p>
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                {["Search", "Chat", "Rank"].map((k) => (
                  <span key={k} className="border border-paper/30 bg-paper/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-paper">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </BlurFade>

          {/* Stats cards */}
          {STATS.map((s, i) => (
            <BlurFade key={s.label} duration={0.5} delay={0.18 + i * 0.07} className="lg:col-span-4">
              <div className="group relative flex h-full flex-col border-2 border-ink bg-paper p-6 shadow-[4px_4px_0_0_#000] transition-transform hover:-translate-y-0.5 md:p-7">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-exotic opacity-60 group-hover:opacity-100" aria-hidden />
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">{s.desc}</p>
                <p className="mt-3 font-serif text-4xl leading-none tracking-tight text-ink md:text-[2.6rem]">
                  <NumberTicker value={s.value} suffix={s.suffix} delay={0.3 + i * 0.12} />
                </p>
                <p className="mt-1.5 text-xs font-medium tracking-wide text-ink/60">{s.label}</p>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.9, delay: 0.5 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-5 h-1 origin-left bg-exotic"
                  style={{ transformOrigin: "left" }}
                />
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
