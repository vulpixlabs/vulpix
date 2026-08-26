"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { GlareHover } from "@/components/ui/glare-hover";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    monthly: 0,
    yearly: 0,
    tagline: "For exploring the frontier.",
    cta: "Start exploring",
    href: "/hub",
    features: [
      "Full model and dataset index",
      "Playground with your own key",
      "Arena comparison, live benchmarks",
      "Community support",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    monthly: 9,
    yearly: 7,
    tagline: "For builders who ship daily.",
    cta: "Go Pro",
    href: "/playground",
    features: [
      "Everything in Free",
      "Benchmark alerts and watchlists",
      "Priority sync, 10x API rate",
      "Saved arena lineups and presets",
      "Email support",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    monthly: null,
    yearly: null,
    tagline: "For teams running at scale.",
    cta: "Contact us",
    href: "mailto:hello@vulpixlabs.ai",
    features: [
      "Everything in Pro",
      "Dedicated Redis sync pipeline",
      "Self-hosting and SSO",
      "Uptime SLA and priority support",
    ],
    highlight: false,
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section data-trail="light" className="relative border-b border-ink/10 bg-paper text-ink">
      <div className="mx-auto w-full max-w-[1100px] px-6 py-24 md:px-10 lg:py-32">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <BlurFade duration={0.5}>
              <p className="label text-exotic">Pricing</p>
            </BlurFade>
            <BlurFade duration={0.6} delay={0.08}>
              <h2 className="mt-6 max-w-xl font-serif text-4xl leading-[1.05] md:text-5xl">
                Free to explore. <span className="italic text-exotic">Priced to scale.</span>
              </h2>
            </BlurFade>
          </div>
          <BlurFade duration={0.5} delay={0.16}>
            <div className="flex items-center gap-3 text-sm text-ink/60">
              <span className={cn(!yearly && "font-medium text-ink")}>Monthly</span>
              <Switch checked={yearly} onCheckedChange={setYearly} aria-label="Toggle yearly billing" />
              <span className={cn(yearly && "font-medium text-ink")}>Yearly</span>
              <Badge className="rounded-full border-none bg-exotic/10 text-[10px] font-medium text-exotic">
                −20%
              </Badge>
            </div>
          </BlurFade>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {PLANS.map((plan, i) => {
            const price = yearly ? plan.yearly : plan.monthly;
            const card = (
              <div
                className={cn(
                  "flex h-full flex-col rounded-2xl border bg-white p-8",
                  plan.highlight ? "border-exotic/60 shadow-[0_8px_30px_rgba(245,79,27,0.10)]" : "border-ink/10",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold tracking-tight text-ink">{plan.name}</h3>
                  {plan.highlight && (
                    <Badge className="rounded-full border-none bg-exotic text-[10px] font-medium text-white">
                      Most popular
                    </Badge>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-ink/55">{plan.tagline}</p>

                <div className="mt-6 flex items-baseline gap-1.5">
                  {price != null ? (
                    <>
                      <span className="text-4xl font-semibold tracking-tight text-ink">${price}</span>
                      <span className="text-sm text-ink/50">/ month{yearly && price > 0 ? ", billed yearly" : ""}</span>
                    </>
                  ) : (
                    <span className="text-4xl font-semibold tracking-tight text-ink">Custom</span>
                  )}
                </div>

                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-ink/70">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-exotic" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={cn(
                    "mt-8 w-full rounded-xl",
                    plan.highlight
                      ? "bg-exotic text-white hover:bg-exotic/90"
                      : "border-ink/15 bg-paper text-ink hover:bg-ink/5",
                    plan.highlight ? "" : "border",
                  )}
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            );

            return (
              <BlurFade key={plan.name} duration={0.55} delay={0.1 + i * 0.1}>
                <GlareHover
                  width="100%"
                  height="100%"
                  background="transparent"
                  color="#F54F1B"
                  opacity={0.08}
                  duration={600}
                  className={cn("h-full rounded-2xl", plan.highlight && "rounded-2xl")}
                >
                  {card}
                </GlareHover>
              </BlurFade>
            );
          })}
        </div>

        <BlurFade duration={0.5} delay={0.2}>
          <p className="mt-10 text-center text-xs text-ink/40">
            The index itself stays open, no account needed. Paid tiers add convenience, never
            lock the frontier.
          </p>
        </BlurFade>
      </div>
    </section>
  );
}
