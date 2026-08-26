"use client";

import { useState } from "react";
import { CheckIcon, ChevronDownIcon, CopyIcon, ExternalLinkIcon, FolderTreeIcon, TableIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { hfDatasetViewerUrl } from "@/lib/brand-logos";

const itemCls =
  "cursor-pointer rounded-none border-b border-ink/10 px-4 py-2.5 font-sans text-sm font-semibold text-ink outline-none transition-none last:border-b-0 data-[highlighted]:bg-exotic data-[highlighted]:text-paper";

export function DatasetActions({ id }: { id: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (k: string, t: string) => {
    await navigator.clipboard.writeText(t);
    setCopied(k);
    setTimeout(() => setCopied(null), 1500);
  };
  const scrollTo = (hash: string) => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => scrollTo("files")}
        className="inline-flex cursor-pointer items-center gap-2 border-2 border-ink bg-paper px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-ink transition-none hover:border-exotic hover:text-exotic"
      >
        <FolderTreeIcon className="size-4" /> Download
      </button>
      <button
        onClick={() => copy("cli", `hf download ${id}`)}
        className="inline-flex cursor-pointer items-center gap-2 border-2 border-ink bg-paper px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-ink transition-none hover:border-exotic hover:text-exotic"
      >
        {copied === "cli" ? <CheckIcon className="size-4 text-exotic" /> : <CopyIcon className="size-4" />}
        {copied === "cli" ? "Copied" : "hf CLI"}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex cursor-pointer items-center gap-2 border-2 border-exotic bg-exotic px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-paper outline-none transition-none hover:bg-paper hover:text-exotic data-[state=open]:bg-paper data-[state=open]:text-exotic">
          Use this dataset <ChevronDownIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} className="w-72 rounded-none border-2 border-ink bg-paper p-0 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
          <DropdownMenuItem className={itemCls} onSelect={() => window.open(hfDatasetViewerUrl(id), "_blank", "noopener,noreferrer")}>
            <TableIcon className="size-4" /> View in Data Studio
          </DropdownMenuItem>
          <DropdownMenuItem
            className={itemCls}
            onSelect={() => copy("py", `from datasets import load_dataset\nds = load_dataset("${id}")\nprint(ds)`)}
          >
            {copied === "py" ? <CheckIcon className="size-4 text-exotic" /> : <CopyIcon className="size-4" />}
            {copied === "py" ? "Python copied" : "Copy Python, datasets"}
          </DropdownMenuItem>
          <DropdownMenuItem className={itemCls} onSelect={() => window.open(`https://huggingface.co/datasets/${id}`, "_blank", "noopener,noreferrer")}>
            <ExternalLinkIcon className="size-4" /> View on Hugging Face
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
