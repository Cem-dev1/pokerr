"use client";

import { cn } from "@/lib/utils";

export function PlayerAvatar({
  emoji,
  gradient,
  label,
  sublabel,
  active = false,
  size = "md",
}: {
  emoji: string;
  gradient: string; // tailwind gradient classes e.g. "from-rose-500 to-red-700"
  label: string;
  sublabel?: string;
  active?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "lg"
      ? "h-16 w-16 sm:h-20 sm:w-20 text-3xl sm:text-4xl"
      : size === "sm"
        ? "h-10 w-10 text-xl"
        : "h-12 w-12 sm:h-14 sm:w-14 text-2xl sm:text-3xl";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        {/* gold frame */}
        <div
          className={cn(
            "rounded-full bg-gradient-to-br p-[3px] shadow-xl ring-2 ring-amber-300/60",
            active && "ring-amber-300",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-gradient-to-br",
              gradient,
              dims,
            )}
          >
            <span className="drop-shadow">{emoji}</span>
          </div>
        </div>
        {active && (
          <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-black/50" />
        )}
      </div>
      <div className="text-center leading-tight">
        <div className="text-xs font-bold text-white text-glow-white">{label}</div>
        {sublabel && (
          <div className="text-[10px] uppercase tracking-wide text-amber-200/80">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}
