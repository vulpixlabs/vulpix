"use client";

import { useEffect, useState } from "react";

export function Thinking() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex items-center gap-2.5 py-1" aria-live="polite">
      <span className="relative flex size-4 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-exotic/40" />
        <span className="relative inline-flex size-4 rounded-full border-2 border-ink border-t-exotic pg-spin" />
      </span>
      <span className="text-sm text-ink/50">
        {slow ? "Still thinking…" : "Thinking"}
        <span className="pg-dots" />
      </span>
    </div>
  );
}
