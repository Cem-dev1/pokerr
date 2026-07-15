"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PlayingCard } from "@/lib/game/types";
import { PlayingCardView } from "./PlayingCard";

/**
 * CardFan — lays out cards in an overlapping fan (yelpaze) with rotation,
 * and lifts the selected card up. Mirrors the reference visual.
 *
 * Uses a flex row with negative margins for overlap + per-card rotation.
 */
export function CardFan({
  cards,
  selectedIds = [],
  faceDown = false,
  onToggle,
  disabled = false,
  maxAngle = 24,
  className,
  cardWidth = "w-16 sm:w-20",
  overlapClass = "-ml-7 sm:-ml-9",
}: {
  cards: PlayingCard[];
  selectedIds?: string[];
  faceDown?: boolean;
  onToggle?: (id: string) => void;
  disabled?: boolean;
  maxAngle?: number;
  className?: string;
  cardWidth?: string;
  overlapClass?: string;
}) {
  const n = cards.length;
  if (n === 0) return null;

  const step = n > 1 ? (maxAngle * 2) / (n - 1) : 0;
  const start = -maxAngle;

  return (
    <div className={cn("relative flex items-end justify-center", className)}>
      {cards.map((card, i) => {
        const angle = n === 1 ? 0 : start + i * step;
        const arcY = Math.abs(angle) * 0.4;
        const selected = selectedIds.includes(card.id);

        return (
          <motion.div
            key={card.id}
            className={cn(
              cardWidth,
              i > 0 && overlapClass,
            )}
            style={{
              transformOrigin: "bottom center",
              aspectRatio: "2.5 / 3.5",
              zIndex: selected ? 40 : i + 1,
            }}
            initial={{ opacity: 0, y: 40, rotate: angle }}
            animate={{ opacity: 1, y: arcY, rotate: angle }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 24,
              delay: i * 0.035,
            }}
          >
            <PlayingCardView
              card={card}
              faceDown={faceDown}
              selected={selected}
              disabled={disabled}
              onClick={onToggle ? () => onToggle(card.id) : undefined}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
