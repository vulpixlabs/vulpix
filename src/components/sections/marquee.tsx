"use client";

import { LogoMark } from "@/components/ui/logo-mark";
import { landingLogoUrl } from "@/lib/landing-logos";

/* Model-labs only — authors actually indexed in Hugging Face (no infra like GitHub/Vercel/Cloudflare/Supabase).
   Dedup: Qwen (=Alibaba), Grok (=xAI) → satu logo model saja, putih ffffff. */
const COMPANIES: { name: string; slug: string }[] = [
  { name: "Qwen", slug: "qwen" },
  { name: "Llama", slug: "meta" },
  { name: "Gemini", slug: "googlegemini" },
  { name: "Gemma", slug: "google" },
  { name: "Mistral", slug: "mistralai" },
  { name: "DeepSeek", slug: "deepseek" },
  { name: "Phi", slug: "microsoft" },
  { name: "Flux", slug: "stabilityai" },
  { name: "Cohere", slug: "cohere" },
  { name: "Nemotron", slug: "nvidia" },
  { name: "GPT", slug: "openai" },
  { name: "Claude", slug: "anthropic" },
  { name: "Grok", slug: "xai" },
  { name: "Replicate", slug: "replicate" },
  { name: "Solar", slug: "upstage" },
  { name: "Yi", slug: "01dotai" },
  { name: "Databricks", slug: "databricks" },
  { name: "ElevenLabs", slug: "elevenlabs" },
];

function LogoItem({ name, slug }: { name: string; slug?: string }) {
  const src = slug ? landingLogoUrl(slug) : undefined;
  return (
    <span className="flex h-[52px] shrink-0 items-center gap-3 border border-paper/15 bg-paper/10 px-5 backdrop-blur-sm" title={name}>
      <LogoMark
        name={name}
        src={src}
        className="size-6 text-[8px]"
        imageClassName="w-auto brightness-0 invert opacity-100"
        fallbackClassName="border border-paper/30 bg-paper/10 text-paper"
        loading="eager"
      />
      <span className="font-sans text-xs font-semibold uppercase tracking-wide text-paper">{name}</span>
    </span>
  );
}

function Row({ hidden }: { hidden?: boolean }) {
  return (
    <div aria-hidden={hidden} className="flex shrink-0 items-center gap-4 pr-4">
      {COMPANIES.map((c) => (
        <LogoItem key={c.name} {...c} />
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <section
      data-trail="dark"
      className="relative overflow-hidden border-b-2 border-ink bg-exotic py-12 text-paper md:py-16"
    >
      <p className="label mb-10 px-6 text-paper/80 md:px-10">
        Powering the Frontier, 24 Labs, One Index
      </p>
      <div className="group flex w-max animate-marquee hover:[animation-play-state:paused]">
        <Row />
        <Row hidden />
      </div>
    </section>
  );
}
