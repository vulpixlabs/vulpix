"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowUpRightIcon, CheckIcon } from "lucide-react";

const APIS = [
  {
    name: "Index API",
    desc: "Search the full catalog live — every model and dataset, the moment it ships.",
    href: "/hub",
    cta: "Open the Hub",
    points: ["505 models, 100k+ datasets", "Filter by task, modality, license", "Synced hourly from upstream"],
    accent: "#F54F1B",
  },
  {
    name: "Playground API",
    desc: "Prompt any open model with streaming responses, using your own key.",
    href: "/playground",
    cta: "Open Playground",
    points: ["Bring your own key, any provider", "Streaming, tools, attachments", "Chat history stored locally"],
    accent: "#FF8C4A",
  },
  {
    name: "Arena API",
    desc: "Compare models side by side on live benchmarks and daily activity.",
    href: "/arena",
    cta: "Enter the Arena",
    points: ["Artificial Analysis + Design Arena", "Real pricing and provider data", "30-day usage, updated daily"],
    accent: "#FFB37F",
  },
];

interface StackCardProps {
  api: (typeof APIS)[number];
  i: number;
  total: number;
  progress: MotionValue<number>;
}

function IndexMini() {
  const rows = ["qwen3-30b-a3b", "muse-spark-1.2", "gemma-3-27b", "deepseek-v4"];
  return (
    <div className="overflow-hidden border border-ink/10 bg-paper">
      <div className="flex items-center gap-1.5 border-b border-ink/10 bg-ink/[0.03] px-2 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-exotic animate-pulse" />
        <span className="font-mono text-[8px] uppercase tracking-widest text-ink/50">live index</span>
      </div>
      <div className="relative h-[64px] overflow-hidden">
        <motion.div
          className="flex flex-col"
          animate={{ y: [0, -18, -36, -54] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatType: "loop" }}
        >
          {[...rows, ...rows].map((r, idx) => (
            <div key={idx} className="flex items-center gap-2 px-2 py-[5px] text-[10px] font-mono text-ink/70">
              <span className="h-1 w-1 bg-exotic" /> {r}
              <span className="ml-auto text-[8px] text-ink/40">synced</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
function PlaygroundMini() {
  const text = "Explain quantum attention in one line…";
  return (
    <div className="border border-ink/10 bg-paper p-2">
      <div className="flex items-center gap-1.5 border border-ink/10 bg-ink/[0.03] px-2 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[#FF8C4A] animate-pulse" />
        <motion.span
          className="font-mono text-[9px] text-ink/70"
          initial={{ width: 0 }}
          whileInView={{ width: "auto" }}
          viewport={{ once: false }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ overflow: "hidden", whiteSpace: "nowrap", display: "inline-block" }}
        >
          {text}
        </motion.span>
        <motion.span
          className="ml-0.5 inline-block h-3 w-[2px] bg-exotic"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
      </div>
      <div className="mt-1.5 flex gap-1">
        {[0, 0.15, 0.3].map((d, i) => (
          <motion.span
            key={i}
            className="h-1 flex-1 bg-[#FF8C4A]/30"
            animate={{ scaleY: [0.6, 1, 0.6] }}
            transition={{ duration: 0.9, delay: d, repeat: Infinity }}
            style={{ transformOrigin: "bottom" }}
          />
        ))}
      </div>
    </div>
  );
}
function ArenaMini() {
  const bars = [62, 78, 54];
  return (
    <div className="border border-ink/10 bg-paper p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[8px] uppercase tracking-widest text-ink/50">elo board</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#FFB37F] animate-pulse" />
      </div>
      <div className="space-y-1.5">
        {bars.map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-10 font-mono text-[8px] text-ink/60">#{i + 1}</span>
            <div className="h-1.5 flex-1 bg-ink/10">
              <motion.div
                className="h-full"
                style={{ background: "#FFB37F" }}
                initial={{ width: `${w}%` }}
                animate={{ width: [`${w}%`, `${w + (i === 1 ? -10 : 8)}%`, `${w}%`] }}
                transition={{ duration: 2.2, delay: i * 0.2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <motion.span
              className="w-8 text-right font-mono text-[8px] text-ink/50"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.8, delay: i * 0.15, repeat: Infinity }}
            >
              {w + 1200}
            </motion.span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StackCard({ api, i, total, progress }: StackCardProps) {
  const container = useRef<HTMLDivElement>(null);
  const targetScale = 1 - (total - 1 - i) * 0.04;
  const scale = useTransform(progress, [i * 0.25, 1], [1, targetScale]);

  return (
    <div ref={container} className="sticky top-0 flex h-[68vh] items-start justify-center pt-14">
      <motion.div
        style={{ scale, top: `calc(4rem + ${i * 22}px)` }}
        className="relative flex min-h-[380px] w-full max-w-[880px] origin-top flex-col justify-between gap-8 rounded-2xl border border-ink/10 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] md:flex-row md:items-center md:p-10"
      >
        <div className="max-w-md">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: api.accent }} />
            <h3 className="text-2xl font-semibold tracking-tight text-ink">{api.name}</h3>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink/60">{api.desc}</p>
          <Link
            href={api.href}
            className="group mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline-offset-4 hover:text-exotic hover:underline"
          >
            {api.cta}
            <ArrowUpRightIcon className="size-4 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="flex flex-1 flex-col gap-3 md:max-w-[300px]">
          {i === 0 && <IndexMini />}
          {i === 1 && <PlaygroundMini />}
          {i === 2 && <ArenaMini />}
          <ul className="space-y-2.5">
            {api.points.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-ink/70">
                <CheckIcon className="mt-0.5 size-4 shrink-0" style={{ color: api.accent }} />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}

export function Ecosystem() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <section data-trail="light" className="relative border-b border-ink/10 bg-paper text-ink">
      <div className="mx-auto w-full max-w-[1100px] px-6 pt-20 md:px-10 lg:pt-24">
        <p className="label text-exotic">Ecosystem, Live</p>
        <h2 className="mt-6 max-w-2xl font-serif text-4xl leading-[1.05] md:text-5xl">
          <span className="italic text-exotic">Live</span> on the open frontier.
        </h2>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-ink/55">
          Listings, stats and playground calls streamed from upstream, not cached. What you see is
          the frontier as it ships.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-1.5 text-xs text-ink/60">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping bg-exotic/50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-exotic" />
          </span>
          Vulpix Core · 505 models live · synced hourly
        </div>
      </div>

      <div ref={container} className="relative pb-16">
        {APIS.map((api, i) => (
          <StackCard key={api.name} api={api} i={i} total={APIS.length} progress={scrollYProgress} />
        ))}
      </div>
    </section>
  );
}
