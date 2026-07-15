"use client";

import { cn } from "@/lib/utils";
import { BlackOverlayBox } from "@/components/game/BlackOverlayBox";
import { ChipIcon, GoldIcon } from "@/components/game/icons";
import { TOTAL_ROUNDS } from "@/lib/store/useGameStore";

/** Top status bar: round, chips, gold. */
export function GameHUD({
  round,
  chips,
  gold,
  discardsLeft,
  className,
}: {
  round: number;
  chips: number;
  gold: number;
  discardsLeft?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-2", className)}>
      <BlackOverlayBox className="text-amber-200">
        <span className="text-[10px] uppercase tracking-wider text-zinc-300">Tur</span>
        <span className="text-sm font-black text-white">
          {round}/{TOTAL_ROUNDS}
        </span>
      </BlackOverlayBox>

      <div className="flex items-center gap-2">
        <BlackOverlayBox className="text-amber-300">
          <ChipIcon className="h-4 w-4" />
          <span className="text-sm font-black tabular-nums text-white">
            {chips.toLocaleString("tr-TR")}
          </span>
          <span className="text-[10px] uppercase text-zinc-300">Çip</span>
        </BlackOverlayBox>
        <BlackOverlayBox className="text-amber-300">
          <GoldIcon className="h-4 w-4" />
          <span className="text-sm font-black tabular-nums text-white">{gold}</span>
          <span className="text-[10px] uppercase text-zinc-300">Altın</span>
        </BlackOverlayBox>
      </div>

      {discardsLeft !== undefined && (
        <BlackOverlayBox className="text-sky-200">
          <span className="text-[10px] uppercase tracking-wider text-zinc-300">Discard</span>
          <span className="text-sm font-black text-white">{discardsLeft}</span>
        </BlackOverlayBox>
      )}
    </div>
  );
}
