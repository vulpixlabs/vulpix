"use client";

import { ChevronDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProviderSelectProps {
  providers: string[];
  value: string;
  onChange: (value: string) => void;
}

export function ProviderSelect({ providers, value, onChange }: ProviderSelectProps) {
  const options = ["Auto", ...providers];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center justify-between gap-2 border border-ink/15 px-3 py-2 text-left text-sm text-ink/80 transition-colors hover:border-ink/40 data-[state=open]:border-exotic"
      >
        <span className="truncate">{value}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-ink/50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto rounded-none border-2 border-ink">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt}
            onSelect={() => onChange(opt)}
            className={`rounded-none text-sm ${opt === value ? "font-semibold text-exotic" : ""}`}
          >
            {opt}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
