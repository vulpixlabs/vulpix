import React from "react";
import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/ui/grid-pattern";

export function GridCard({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "group bg-paper hover:bg-exotic relative isolate z-0 flex h-full flex-col justify-between overflow-hidden border px-5 py-4 transition-colors duration-75",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0">
        <div className="absolute -inset-[25%] -skew-y-12 [mask-image:linear-gradient(225deg,black,transparent)]">
          <GridPattern
            width={30}
            height={30}
            x={0}
            y={0}
            squares={getRandomPattern(5)}
            className="fill-border/50 stroke-border absolute inset-0 size-full translate-y-2 transition-transform duration-150 ease-out group-hover:translate-y-0"
          />
        </div>
        <div className="absolute -inset-[10%] bg-paper opacity-0 blur-[50px] transition-opacity duration-150 group-hover:opacity-25" />
      </div>
      {children}
    </div>
  );
}

function getRandomPattern(length = 5): [x: number, y: number][] {
  let s = 42;
  const rnd = () =>
    (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const seen = new Set<string>();
  const out: [number, number][] = [];
  let guard = 0;
  while (out.length < length && guard++ < 200) {
    const x = Math.floor(rnd() * 4) + 7;
    const y = Math.floor(rnd() * 6) + 1;
    const k = `${x}-${y}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push([x, y]);
    }
  }
  return out;
}
