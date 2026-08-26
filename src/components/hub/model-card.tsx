"use client";

import Link from "next/link";
import { DownloadIcon, HeartIcon, ZapIcon } from "lucide-react";
import type { HFModel } from "@/lib/hf";
import { formatNum, formatParams, timeAgo } from "@/lib/hf";
import { brandLogo } from "@/lib/brand-logos";
import { LogoMark } from "@/components/ui/logo-mark";

export function Avatar({
  author,
  id,
  className = "size-8",
}: {
  author?: string;
  id: string;
  className?: string;
}) {
  const brand = brandLogo(author);
  const src = brand?.url ?? (author ? `/api/hf/avatar/${encodeURIComponent(author)}?v=3` : null);

  return (
    <span
      className={`${className} grid shrink-0 place-items-center overflow-hidden border border-ink/15 bg-paper`}
    >
      <LogoMark
        name={author ?? id}
        src={src}
        className="size-full text-xs"
        imageClassName="object-cover"
        fallbackClassName="border border-ink/20 bg-paper text-ink"
      />
    </span>
  );
}

export function ModelCard({ m }: { m: HFModel }) {
  const parts = m.id.split("/");
  const author = parts.length > 1 ? parts[0] : "";
  const name = parts.length > 1 ? parts.slice(1).join("/") : m.id;
  const params = formatParams(m.safetensors?.total);
  const inference = !!m.inferenceProviderMapping;

  return (
    <Link
      href={`/hub/model/${encodeURIComponent(m.id)}`}
      className="group flex flex-col gap-3 border-2 border-ink/10 bg-paper p-5 transition-colors duration-75 hover:border-exotic"
    >
      <div className="flex items-center gap-3">
        <Avatar author={author} id={m.id} />
        <span className="truncate font-mono text-sm font-semibold group-hover:text-exotic">
          {author && <span className="text-ink/50">{author}/</span>}
          {name}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {m.pipeline_tag && (
          <span className="border border-ink/15 px-2 py-0.5 text-xs text-ink/70">
            {m.pipeline_tag}
          </span>
        )}
        {params && (
          <span className="border border-ink/15 px-2 py-0.5 text-xs text-ink/70">
            {params} params
          </span>
        )}
        {m.library_name && (
          <span className="border border-ink/15 px-2 py-0.5 text-xs text-ink/70">
            {m.library_name}
          </span>
        )}
        {inference && (
          <span className="flex items-center gap-1 bg-exotic px-2 py-0.5 text-xs font-bold text-paper">
            <ZapIcon className="size-3" /> Inference
          </span>
        )}
      </div>
      <div className="mt-auto flex items-center gap-5 text-xs text-ink/60">
        <span className="flex items-center gap-1.5">
          <DownloadIcon className="size-3.5" /> {formatNum(m.downloads)}
        </span>
        <span className="flex items-center gap-1.5">
          <HeartIcon className="size-3.5" /> {formatNum(m.likes)}
        </span>
        <span className="ml-auto">Updated {timeAgo(m.lastModified)}</span>
      </div>
    </Link>
  );
}
