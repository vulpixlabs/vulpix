"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

export function CopyButton({
  text,
  label,
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
      className={
        className ??
        "inline-flex cursor-pointer items-center gap-1.5 border border-ink/20 px-2.5 py-1 text-xs font-semibold text-ink/70 transition-none hover:border-exotic hover:text-exotic"
      }
    >
      {ok ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
      {ok ? "Copied" : (label ?? "Copy")}
    </button>
  );
}
