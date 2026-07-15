"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  PlayingCard,
  SUIT_SYMBOL,
  SUIT_COLOR,
  SUIT_LABEL_TR,
  type Rank,
  type Suit,
} from "@/lib/game/types";

const RANK_DISPLAY: Record<Rank, string> = {
  A: "A", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7",
  "8": "8", "9": "9", "10": "10", J: "J", Q: "Q", K: "K",
};

export function PlayingCardView({
  card,
  faceDown = false,
  selected = false,
  disabled = false,
  onClick,
  className,
}: {
  card?: PlayingCard;
  faceDown?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  if (faceDown || !card) {
    return (
      <div
        className={cn(
          "play-card-back relative h-full w-full rounded-lg",
          className,
        )}
      >
        <div className="absolute inset-1.5 rounded-md border border-amber-300/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">♠</span>
        </div>
      </div>
    );
  }

  const color = SUIT_COLOR[card.suit] === "red" ? "text-red-600" : "text-zinc-900";
  const sym = SUIT_SYMBOL[card.suit];
  const rank = RANK_DISPLAY[card.rank];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      animate={{ y: selected ? -22 : 0, scale: selected ? 1.06 : 1 }}
      whileHover={disabled ? undefined : { y: selected ? -28 : -8, scale: selected ? 1.1 : 1.03 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={cn(
        "play-card relative h-full w-full select-none rounded-lg p-1.5 text-left",
        "ring-2 ring-transparent",
        selected && "ring-amber-400",
        disabled ? "cursor-default" : "cursor-pointer",
        className,
      )}
      aria-label={`${rank} ${SUIT_LABEL_TR[card.suit]}${selected ? " (seçili)" : ""}`}
    >
      {/* top-left corner */}
      <div className={cn("absolute left-1.5 top-1 flex flex-col items-center leading-none", color)}>
        <span className="text-base font-black sm:text-lg">{rank}</span>
        <span className="text-sm sm:text-base">{sym}</span>
      </div>
      {/* center suit */}
      <div className={cn("absolute inset-0 flex items-center justify-center", color)}>
        <span className="text-3xl sm:text-4xl drop-shadow-sm">{sym}</span>
      </div>
      {/* bottom-right corner (rotated) */}
      <div
        className={cn(
          "absolute bottom-1 right-1.5 flex rotate-180 flex-col items-center leading-none",
          color,
        )}
      >
        <span className="text-base font-black sm:text-lg">{rank}</span>
        <span className="text-sm sm:text-base">{sym}</span>
      </div>
    </motion.button>
  );
}

/** Static face-down card sized to match the playing card grid cell. */
export function FacedownCard({ className }: { className?: string }) {
  return (
    <div className={cn("play-card-back relative h-full w-full rounded-lg", className)}>
      <div className="absolute inset-1.5 rounded-md border border-amber-300/40" />
      <div className="absolute inset-0 flex items-center justify-center text-2xl">♠</div>
    </div>
  );
}

export type { Rank, Suit };
