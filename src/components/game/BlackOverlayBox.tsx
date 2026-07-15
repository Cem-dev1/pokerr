"use client";

import { cn } from "@/lib/utils";

/**
 * BlackOverlayBox — black, semi-transparent, rounded horizontal info/score box.
 * Matches the reference: "siyah renkli ve yarı saydam köşeleri yuvarlatılmış yatay kutucuk".
 */
export function BlackOverlayBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl bg-black/55 px-3 py-1.5",
        "backdrop-blur-sm ring-1 ring-white/10 shadow-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}
