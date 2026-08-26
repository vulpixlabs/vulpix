"use client";

import Link from "next/link";
import { DownloadIcon, HeartIcon } from "lucide-react";
import type { HFDataset } from "@/lib/hf";
import { datasetSize, datasetTask, formatNum, timeAgo } from "@/lib/hf";
import { Avatar } from "@/components/hub/model-card";

export function DatasetCard({ d }: { d: HFDataset }) {
  const parts = d.id.split("/");
  const author = parts.length > 1 ? parts[0] : "";
  const name = parts.length > 1 ? parts.slice(1).join("/") : d.id;
  const task = datasetTask(d.tags);
  const size = datasetSize(d.tags);

  return (
    <Link
      href={`/hub/datasets/${encodeURIComponent(d.id)}`}
      className="group flex flex-col gap-3 border-2 border-ink/10 bg-paper p-5 transition-colors duration-75 hover:border-exotic"
    >
      <div className="flex items-center gap-3">
        <Avatar author={author || undefined} id={d.id} />
        <span className="truncate font-mono text-sm font-semibold group-hover:text-exotic">
          {author && <span className="text-ink/50">{author}/</span>}
          {name}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {task && (
          <span className="border border-ink/15 px-2 py-0.5 text-xs text-ink/70">
            {task}
          </span>
        )}
        {size && (
          <span className="border border-ink/15 px-2 py-0.5 text-xs text-ink/70">
            {size} rows
          </span>
        )}
      </div>
      <div className="mt-auto flex items-center gap-5 text-xs text-ink/60">
        <span className="flex items-center gap-1.5">
          <DownloadIcon className="size-3.5" /> {formatNum(d.downloads)}
        </span>
        <span className="flex items-center gap-1.5">
          <HeartIcon className="size-3.5" /> {formatNum(d.likes)}
        </span>
        <span className="ml-auto">Updated {timeAgo(d.lastModified)}</span>
      </div>
    </Link>
  );
}
