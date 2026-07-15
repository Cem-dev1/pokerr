"use client";

import { cn } from "@/lib/utils";

/**
 * CasinoTable — full-bleed wooden border (oval illusion) wrapping a vibrant
 * green felt playfield with bokeh light accents. The whole screen IS the table.
 */
export function CasinoTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="casino-wood relative min-h-[100dvh] w-full overflow-hidden p-2 sm:p-3 md:p-4">
      {/* felt playfield (oval-ish via rounded + inset) */}
      <div className="casino-felt casino-bokeh relative mx-auto h-[calc(100dvh-1rem)] w-full max-w-6xl rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem]">
        {/* inner gold trim */}
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-2 ring-amber-500/30 sm:rounded-[2.5rem] md:rounded-[3rem]" />
        <div className="pointer-events-none absolute inset-2 rounded-[1.6rem] ring-1 ring-amber-300/15 sm:inset-3" />
        <div className={cn("relative h-full w-full", className)}>
          {children}
        </div>
      </div>
    </div>
  );
}
