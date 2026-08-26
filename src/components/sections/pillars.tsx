"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Database,
  TerminalWindow,
  Trophy,
  MagnifyingGlass,
  Check,
  CircleNotch,
  Clock,
  Minus,
  Globe,
  Lightning,
} from "@phosphor-icons/react";
import { gsap } from "@/lib/gsap";

/* ── Brutalist theme tokens ──
   Orange scale only: #F54F1B / #FF8C4A / #FFB37F / #FFD1AD, ink text only */

const EXOTIC = "#F54F1B";

interface FeatCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

function FeatCard({ title, description, children, className = "" }: FeatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative flex flex-col gap-3 overflow-visible border border-ink/15 bg-white p-5 shadow-sm md:p-6 ${className}`}
    >
      <div className="z-10 flex flex-col gap-1.5">
        <h3 className="text-sm font-semibold tracking-tight text-ink">{title}</h3>
        <p className="max-w-[92%] text-xs leading-relaxed text-ink/60">{description}</p>
      </div>
      <div className="relative mt-3 w-full flex-1 min-h-0 overflow-visible border border-ink/15 bg-paper p-3">
        {children}
      </div>
    </motion.div>
  );
}

/* ── Card1: Index Pipeline ── */

type ActiveStep = "request" | "router" | "agent" | "memory" | "tools" | "response";

const VW = 320;
const VH = 240;

interface NodeConfig {
  id: string;
  x: number;
  y: number;
  icon?: React.ElementType;
  label?: string;
  type: "box" | "circle";
  bg: string;
  text: string;
}

const NODES: NodeConfig[] = [
  { id: "A", x: 50, y: 120, icon: MagnifyingGlass, label: "SEARCH", type: "box", bg: "#F54F1B", text: "#ffffff" },
  { id: "Router", x: 125, y: 120, type: "circle", bg: "#FF8C4A", text: "#ffffff" },
  { id: "C", x: 200, y: 120, icon: Brain, label: "INDEX", type: "box", bg: "#E04515", text: "#ffffff" },
  { id: "B", x: 280, y: 50, icon: Database, label: "HUB", type: "box", bg: "#FF8C4A", text: "#ffffff" },
  { id: "D", x: 280, y: 190, icon: Trophy, label: "ARENA", type: "box", bg: "#FFB37F", text: "#1a1a1a" },
];

interface FlowPath {
  id: string;
  d: string;
  activeSteps: ActiveStep[];
  color: string;
}

const PATHS: FlowPath[] = [
  { id: "a-to-router", d: "M 78 120 L 113 120", activeSteps: ["request"], color: EXOTIC },
  { id: "router-to-agent", d: "M 137 120 L 172 120", activeSteps: ["agent"], color: EXOTIC },
  { id: "agent-to-memory", d: "M 200 92 L 200 50 L 252 50", activeSteps: ["memory"], color: "#FF8C4A" },
  { id: "agent-to-tools", d: "M 200 148 L 200 190 L 252 190", activeSteps: ["tools"], color: "#FFB37F" },
  { id: "response-flow-1", d: "M 172 120 L 137 120", activeSteps: ["response"], color: EXOTIC },
  { id: "response-flow-2", d: "M 113 120 L 78 120", activeSteps: ["response"], color: EXOTIC },
];

const STEPS: ActiveStep[] = ["request", "router", "agent", "memory", "tools", "response"];

function PipelineCard() {
  const [step, setStep] = useState<ActiveStep>("request");

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % STEPS.length;
      setStep(STEPS[idx]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const isNodeActive = (nodeId: string) => {
    switch (step) {
      case "request":
        return nodeId === "A";
      case "router":
        return nodeId === "Router";
      case "agent":
        return nodeId === "C";
      case "memory":
        return nodeId === "C" || nodeId === "B";
      case "tools":
        return nodeId === "C" || nodeId === "D";
      case "response":
        return nodeId === "C" || nodeId === "Router" || nodeId === "A";
      default:
        return false;
    }
  };

  return (
    <div className="relative flex h-full w-full select-none items-center justify-center overflow-hidden bg-paper p-2">
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id="bento-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.75" fill="rgba(0,0,0,0.10)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bento-grid)" />
      </svg>

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <path d="M 78 120 L 113 120" fill="none" stroke="rgba(0,0,0,0.14)" strokeWidth="1" />
        <path d="M 137 120 L 172 120" fill="none" stroke="rgba(0,0,0,0.14)" strokeWidth="1" />
        <path d="M 200 92 L 200 50 L 252 50" fill="none" stroke="rgba(0,0,0,0.14)" strokeWidth="1" />
        <path d="M 200 148 L 200 190 L 252 190" fill="none" stroke="rgba(0,0,0,0.14)" strokeWidth="1" />

        {PATHS.map((p) => {
          if (!p.activeSteps.includes(step)) return null;
          return (
            <g key={p.id}>
              <motion.path
                d={p.d}
                fill="none"
                stroke={p.color}
                strokeWidth="3.5"
                strokeOpacity="0.25"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
              <motion.path
                d={p.d}
                fill="none"
                stroke={p.color}
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            </g>
          );
        })}

        {NODES.map((node) => {
          const isBox = node.type === "box";
          const w = isBox ? 56 : 24;
          const h = isBox ? 56 : 24;
          const isActive = isNodeActive(node.id);
          const Icon = node.icon;

          return (
            <foreignObject
              key={node.id}
              x={node.x - w / 2}
              y={node.y - h / 2}
              width={w}
              height={h}
              className="overflow-visible"
            >
              <div className="flex h-full w-full items-center justify-center">
                {isBox && Icon ? (
                  <div
                    className="flex h-full w-full flex-col items-center justify-center border-2 transition-transform duration-300"
                    style={{
                      background: node.bg,
                      borderColor: "rgba(0,0,0,0.85)",
                      transform: isActive ? "scale(1.06)" : "scale(1)",
                      color: node.text,
                    }}
                  >
                    <div className="mb-0.5 flex items-center justify-center">
                      <Icon className="h-5 w-5" weight="fill" />
                    </div>
                    <span className="select-none font-mono text-[8.5px] font-bold tracking-wider">
                      {node.label}
                    </span>
                  </div>
                ) : (
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-300"
                    style={{
                      background: isActive ? "rgba(255,140,74,0.25)" : "rgba(255,255,255,0.85)",
                      borderColor: isActive ? "#FF8C4A" : "rgba(0,0,0,0.25)",
                    }}
                  >
                    <motion.div
                      className="h-2.5 w-2.5 rounded-full border border-dashed"
                      style={{ borderColor: isActive ? "#FF8C4A" : "rgba(0,0,0,0.35)" }}
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    />
                  </div>
                )}
              </div>
            </foreignObject>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Card2: Live Index Monitor ── */

function MonitorCard() {
  const bars = [45, 75, 35, 85, 60, 95, 50];
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const [activeIdx, setActiveIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev === 0 ? 1 : 0));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: "Models indexed", value: "505", trend: "+12" },
    { label: "Benchmarks synced", value: "279", trend: "+6" },
  ];

  return (
    <div className="flex h-full w-full min-h-0 flex-col justify-between gap-3 p-2">
      <div className="flex gap-4 p-1.5">
        {stats.map((s, i) => {
          const isActive = i === activeIdx || hoveredIdx === i;
          return (
            <div key={i} className="relative min-h-[76px] flex-1 select-none overflow-visible pt-[0.35rem] pr-[0.35rem]">
              <div
                className="absolute inset-0 top-[0.35rem] left-0 right-[0.35rem] bottom-0 border border-ink/15 bg-ink/[0.03] text-ink/15"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)",
                }}
              />
              <motion.div
                className="absolute inset-0 flex h-full w-full cursor-pointer items-center justify-between gap-2.5 border border-ink/40 bg-paper p-3 backdrop-blur-[2px] transition-colors duration-300 hover:bg-exotic/5"
                animate={{
                  x: isActive ? "0.35rem" : "0rem",
                  y: isActive ? "-0.35rem" : "0rem",
                }}
                transition={{ type: "spring", stiffness: 200, damping: 16 }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="flex min-w-0 flex-col">
                  <span className="text-[8px] font-mono uppercase leading-none tracking-widest text-ink/60">
                    {s.label}
                  </span>
                  <span className="mt-1.5 text-base font-bold leading-none tracking-tight text-ink">
                    {s.value}
                  </span>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[8px] font-bold text-exotic">{s.trend}</span>
                    <span className="text-[8px] text-ink/40">prev week</span>
                  </div>
                </div>
                <div className="flex h-6 w-12 shrink-0 items-center justify-center">
                  <svg className="h-full w-full overflow-visible" viewBox="0 0 48 24">
                    <motion.path
                      d={
                        i === 0
                          ? "M 0 18 L 16 11 L 32 14 L 48 4"
                          : "M 0 4 L 16 12 L 32 8 L 48 18"
                      }
                      fill="none"
                      stroke="currentColor"
                      className="text-ink/30"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.15, ease: "easeOut" }}
                    />
                    {(i === 0
                      ? [
                          { x: 0, y: 18 },
                          { x: 16, y: 11 },
                          { x: 32, y: 14 },
                          { x: 48, y: 4 },
                        ]
                      : [
                          { x: 0, y: 4 },
                          { x: 16, y: 12 },
                          { x: 32, y: 8 },
                          { x: 48, y: 18 },
                        ]
                    ).map((pt, idx) => (
                      <motion.circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r="1.5"
                        className="fill-paper stroke-ink/40"
                        strokeWidth="1"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5 + idx * 0.08, duration: 0.25 }}
                      />
                    ))}
                  </svg>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      <div className="flex min-h-[90px] flex-1 min-h-0 shrink items-end gap-2.5 px-0.5">
        {bars.map((h, i) => (
          <div
            key={i}
            className="relative h-full flex-1 overflow-hidden border border-ink/20 bg-ink/[0.03] text-ink/15"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)",
            }}
          >
            <motion.div
              className="absolute bottom-0 left-0 right-0 border-t border-x border-exotic/80 bg-exotic"
              initial={{ height: "0%" }}
              animate={{
                height: [
                  `${h}%`,
                  `${Math.min(95, h + 15)}%`,
                  `${Math.max(10, h - 20)}%`,
                  `${Math.min(90, h + 8)}%`,
                  `${h}%`,
                ],
              }}
              transition={{
                repeat: Infinity,
                duration: 3 + (i % 3) * 0.8,
                ease: "easeInOut",
                delay: i * 0.1,
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2.5 px-0.5">
        {days.map((d, i) => (
          <p key={i} className="flex-1 text-center font-mono text-[8px] font-medium text-ink/50">
            {d}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ── Card3: Frontier Feed ── */

const STATUS_ICONS: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; gradient: string }
> = {
  done: { icon: Check, color: "text-exotic", bg: "bg-exotic/15", gradient: "bg-exotic" },
  running: { icon: CircleNotch, color: "text-ink", bg: "bg-ink/10", gradient: "bg-[#FF8C4A]" },
  waiting: { icon: Clock, color: "text-ink/70", bg: "bg-ink/5", gradient: "bg-[#FFB37F]" },
  idle: { icon: Minus, color: "text-ink/50", bg: "bg-ink/5", gradient: "bg-ink/30" },
};

const FEED_LOGS = [
  { agent: "GPT-5.6 Sol Pro", action: "Shipped to the index", status: "done", t: "0.2s" },
  { agent: "DeepSeek V4 Flash", action: "Benchmark synced, AA 71.2", status: "done", t: "1.4s" },
  { agent: "Ultra-FineWeb-L1", action: "Refreshing 1T tokens", status: "running", t: "3.1s" },
  { agent: "Arena", action: "Awaiting next matchup", status: "waiting", t: "-" },
  { agent: "Playground", action: "Idle, BYOK ready", status: "idle", t: "-" },
];

function FeedCard() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % FEED_LOGS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const getSlot = (i: number) => {
    const n = FEED_LOGS.length;
    let rel = i - activeIdx;
    if (rel > Math.floor(n / 2)) rel -= n;
    if (rel < -Math.floor(n / 2)) rel += n;
    return rel;
  };

  const Y: Record<string, number> = { "-2": -68, "-1": -38, "0": 0, "1": 38, "2": 68 };

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {FEED_LOGS.map((l, i) => {
        const slot = getSlot(i);
        const si = STATUS_ICONS[l.status];
        const abs = Math.abs(slot);
        const isActive = slot === 0;
        const isVisible = abs <= 2;
        const Icon = si.icon;

        const yOffset = Y[String(slot)] ?? (slot < 0 ? -120 : 120);
        const scale = isActive ? 1 : abs === 1 ? 0.93 : 0.87;
        const opacity = isActive ? 1 : abs === 1 ? 0.65 : 0.38;
        const zIndex = isActive ? 30 : abs === 1 ? 20 : 10;

        return (
          <motion.div
            key={l.agent}
            className="absolute left-0 right-0 mx-auto px-1.5"
            style={{ zIndex }}
            animate={{
              y: isVisible ? yOffset : slot < 0 ? -150 : 150,
              scale,
              opacity: isVisible ? opacity : 0,
            }}
            transition={{
              y: { type: "spring", stiffness: 500, damping: 35 },
              scale: { type: "spring", stiffness: 500, damping: 35 },
              opacity: { duration: 0.25, ease: "easeOut" },
            }}
          >
            <div
              className={`flex w-full items-center gap-2.5 border ${
                isActive ? "border-ink bg-paper px-3 py-2.5" : "border-ink/25 bg-paper px-2.5 py-1.5"
              }`}
            >
              <div
                className={`flex shrink-0 items-center justify-center border border-ink/60 font-bold text-white transition-all duration-300 ${si.gradient} ${
                  isActive ? "h-8 w-8" : "h-5 w-5"
                }`}
              >
                <Icon weight="bold" className={`${isActive ? "h-4 w-4" : "h-2.5 w-2.5"} ${l.status === "running" ? "animate-spin" : ""}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`font-mono font-semibold leading-none text-ink ${isActive ? "text-[10px]" : "text-[9px]"}`}>
                    {l.agent}
                  </span>
                  <span
                    className={`rounded-none px-1 py-0.5 font-mono uppercase tracking-wide ${si.bg} ${si.color} ${
                      isActive ? "text-[7px]" : "text-[6px]"
                    }`}
                  >
                    {l.status}
                  </span>
                </div>
                {isActive && (
                  <p className="mt-0.5 truncate text-[9px] leading-tight text-ink/60">{l.action}</p>
                )}
              </div>
              {isActive && (
                <span className="shrink-0 font-mono text-[9px] text-ink/50">{l.t}</span>
              )}
            </div>
          </motion.div>
        );
      })}

      <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
        {FEED_LOGS.map((_, i) => (
          <motion.div
            key={i}
            className="bg-ink/30"
            animate={{
              width: i === activeIdx ? 14 : 4,
              opacity: i === activeIdx ? 0.8 : 0.25,
            }}
            style={{ height: 3 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Card4: Sync Sources ── */

const NS_ICONS: Record<string, React.ElementType> = {
  index: Database,
  rankings: Globe,
  cache: Lightning,
  arena: Trophy,
};

const NS_COLORS: Record<string, { bar: string; dot: string; badge: string; solid: string }> = {
  index: { bar: "#F54F1B", dot: "bg-exotic", badge: "bg-exotic/15 text-exotic", solid: "#F54F1B" },
  rankings: { bar: "#FF8C4A", dot: "bg-[#FF8C4A]", badge: "bg-[#FF8C4A]/15 text-[#c2551a]", solid: "#FF8C4A" },
  cache: { bar: "#FFB37F", dot: "bg-[#FFB37F]", badge: "bg-[#FFB37F]/20 text-[#a34a10]", solid: "#FFB37F" },
  arena: { bar: "#FFD1AD", dot: "bg-[#FFD1AD]", badge: "bg-[#FFD1AD]/25 text-[#8a4a1a]", solid: "#FFD1AD" },
};

const RETRIEVAL_QUERIES = [
  { ns: "index", q: "meta/muse-spark-1.2 metadata", t: "0.2s" },
  { ns: "rankings", q: "benchmarks intelligence + design", t: "1.1s" },
  { ns: "cache", q: "models:all:combined, 505 ids", t: "2.4s" },
  { ns: "rankings", q: "rankings-daily, 30 days", t: "4.0s" },
  { ns: "index", q: "open model hub sync", t: "5.8s" },
  { ns: "cache", q: "providers cache gpt-oss-120b", t: "7.2s" },
];

function SourcesCard() {
  const namespaces = [
    { name: "index", hits: 505, fill: 92 },
    { name: "rankings", hits: 279, fill: 64 },
    { name: "cache", hits: 9, fill: 30 },
    { name: "arena", hits: 3, fill: 12 },
  ];

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => (prev + 1) % RETRIEVAL_QUERIES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const activeNs = RETRIEVAL_QUERIES[tick].ns;
  const recentQueries = [0, 1, 2, 3].map(
    (offset) => RETRIEVAL_QUERIES[(tick - offset + RETRIEVAL_QUERIES.length) % RETRIEVAL_QUERIES.length],
  );

  return (
    <div className="flex h-full w-full min-h-0 gap-4 px-3 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0 pr-2 min-h-0">
        <p className="mb-3 font-mono text-[8px] uppercase tracking-widest text-ink/50">Sources</p>

        <div className="flex flex-1 flex-col gap-3">
          {namespaces.map((ns, i) => {
            const c = NS_COLORS[ns.name];
            const isActive = ns.name === activeNs;
            const Icon = NS_ICONS[ns.name] ?? Database;

            return (
              <div key={ns.name} className="group relative flex items-center gap-3">
                <div
                  className="relative flex h-[36px] w-[36px] shrink-0 items-center justify-center border-2 border-ink/70 transition-all duration-500"
                  style={{
                    background: isActive ? c.solid : "#ffffff",
                    transform: isActive ? "scale(1.05)" : "scale(1)",
                    color: isActive ? "#ffffff" : "rgba(0,0,0,0.45)",
                  }}
                >
                  <Icon size={16} weight={isActive ? "fill" : "regular"} className="relative z-10" />
                </div>

                <span
                  className={`w-20 shrink-0 font-mono text-[10px] transition-colors duration-300 ${
                    isActive ? "font-semibold text-ink" : "text-ink/50"
                  }`}
                >
                  {ns.name}
                </span>

                <div className="relative h-1.5 min-w-0 flex-1 overflow-hidden bg-ink/10">
                  <motion.div
                    className="absolute bottom-0 left-0 top-0"
                    style={{ background: c.bar }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${ns.fill}%`, opacity: isActive ? 1 : 0.3 }}
                    transition={{
                      width: { duration: 1.2, delay: i * 0.1, type: "spring", bounce: 0.2 },
                      opacity: { duration: 0.4 },
                    }}
                  >
                    {isActive && (
                      <motion.div
                        className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      />
                    )}
                  </motion.div>
                </div>

                <div
                  className={`flex w-10 items-center justify-end gap-1.5 transition-all duration-500 ${
                    isActive ? "scale-105 opacity-100" : "scale-100 opacity-60"
                  }`}
                >
                  <span className={`font-mono text-[9px] font-medium ${isActive ? "text-ink" : "text-ink/50"}`}>
                    {ns.hits}
                  </span>
                  {isActive && (
                    <motion.div
                      className={`h-1 w-1 rounded-full ${c.dot}`}
                      animate={{ opacity: [1, 0.2, 1], scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-3">
          <div className="relative flex h-2 w-2 items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full bg-exotic/40"
              animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            <div className="h-1.5 w-1.5 rounded-full bg-exotic" />
          </div>
          <span className="font-mono text-[8px] font-medium tracking-wide text-ink/50">
            Live sync active, 6h cadence
          </span>
        </div>
      </div>

      <div className="w-px shrink-0 self-stretch bg-ink/15" />

      <div className="flex w-[168px] shrink-0 flex-col gap-0 min-h-0 lg:w-[172px]">
        <p className="mb-2.5 font-mono text-[8px] uppercase tracking-widest text-ink/50">Sync Log</p>

        <div className="flex flex-1 flex-col gap-1.5 overflow-hidden min-h-0">
          {recentQueries.map((q, qi) => {
            const c = NS_COLORS[q.ns];
            return (
              <motion.div
                key={`${q.ns}-${q.q}-${qi}`}
                className="border border-ink/20 bg-ink/[0.03] px-2.5 py-2"
                initial={{ opacity: 0, y: -8 }}
                animate={{
                  opacity: qi === 0 ? 1 : qi === 1 ? 0.8 : qi === 2 ? 0.5 : 0.25,
                  y: 0,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 35, delay: qi * 0.05 }}
              >
                <div className="mb-1 flex items-center gap-1">
                  <span className={`px-1.5 py-0.5 font-mono text-[6.5px] font-semibold uppercase ${c.badge}`}>
                    {q.ns}
                  </span>
                  <span className="ml-auto font-mono text-[7px] tabular-nums text-ink/40">{q.t}</span>
                </div>
                <p className="truncate font-mono text-[8px] leading-tight text-ink/75">{q.q}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Card5: API Inspector ── */

function ApiCard() {
  const apis = [
    { name: "GET /api/models", calls: 505, icon: Globe, latency: "73ms", color: "#F54F1B" },
    { name: "GET /arena/benchmarks", calls: 279, icon: Brain, latency: "68ms", color: "#FF8C4A" },
    { name: "GET /arena/activity", calls: 30, icon: Database, latency: "45ms", color: "#FFB37F" },
    { name: "POST /cron/sync", calls: 4, icon: TerminalWindow, latency: "12s", color: "#FFD1AD" },
  ];

  return (
    <div className="flex h-full w-full items-center justify-center p-2">
      <div className="grid w-full grid-cols-2 gap-3">
        {apis.map((t, i) => {
          const Icon = t.icon;
          return (
            <motion.div
              key={i}
              className="relative flex flex-col justify-between border border-ink/30 bg-paper p-3 transition-all duration-300 hover:border-ink hover:shadow-[3px_3px_0_0_#000]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex h-[28px] w-[28px] items-center justify-center border border-ink/60 text-white transition-transform duration-300 group-hover:scale-105"
                  style={{ background: t.color, color: i >= 2 ? "#1a1a1a" : "#ffffff" }}
                >
                  <Icon weight="fill" className="relative z-10 h-3.5 w-3.5" />
                </div>

                <div className="mt-0.5 flex flex-col items-end gap-0.5">
                  <span className="text-[12px] font-bold leading-none text-ink">{t.calls}</span>
                  <span className="text-[7px] font-mono uppercase leading-none tracking-widest text-ink/50">
                    Calls
                  </span>
                </div>
              </div>

              <div className="mt-2 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-medium tracking-tight text-ink">{t.name}</span>
                  <span className="font-mono text-[8px] tabular-nums text-ink/50">{t.latency}</span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden bg-ink/10">
                  <motion.div
                    className="absolute bottom-0 left-0 top-0"
                    style={{ background: t.color }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${Math.max((t.calls / 505) * 100, 6)}%` }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Section ── */

const CARDS = [
  {
    title: "Index Pipeline",
    description: "Every ship flows through search, router, index, then lands in the hub and arena.",
    visual: <PipelineCard />,
    colSpan: "",
  },
  {
    title: "Live Index Monitor",
    description: "Real counts from the combined live index, refreshed every hour.",
    visual: <MonitorCard />,
    colSpan: "",
  },
  {
    title: "Frontier Feed",
    description: "What shipped, what synced, what is waiting, straight from upstream.",
    visual: <FeedCard />,
    colSpan: "",
  },
  {
    title: "Sync Sources",
    description: "Upstream index every 6 hours, live rankings hourly, combined in cache.",
    visual: <SourcesCard />,
    colSpan: "lg:col-span-2",
  },
  {
    title: "API Inspector",
    description: "Public endpoints with real payload counts and response latency.",
    visual: <ApiCard />,
    colSpan: "",
  },
];

export function Pillars() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".bento-head", {
        y: 32,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: ".bento-head", start: "top 88%" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      data-trail="light"
      className="relative border-b border-ink/10 bg-paper text-ink"
    >
      <div className="mx-auto w-full max-w-[1200px] px-6 py-24 md:px-10 lg:py-32">
        <div className="bento-head">
          <p className="label text-exotic">What is Vulpix</p>
          <h2 className="mt-6 max-w-3xl font-serif text-[clamp(2.75rem,5.5vw,5rem)] leading-[0.95]">
            One engine. The <span className="italic text-exotic">whole</span> frontier.
          </h2>
        </div>

        <div className="bento-grid mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:auto-rows-fr lg:items-stretch">
          {CARDS.map((card) => {
            const isLastRow = card.title === "Sync Sources" || card.title === "API Inspector";
            return (
              <FeatCard
                key={card.title}
                title={card.title}
                description={card.description}
                className={`bento-card ${isLastRow ? "h-[400px] md:h-[420px]" : "h-[340px] md:h-[360px]"} ${card.colSpan}`}
              >
                {card.visual}
              </FeatCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
