"use client";

import { motion } from "framer-motion";
import { BlackOverlayBox } from "./BlackOverlayBox";
import { PlayerAvatar } from "./PlayerAvatar";
import { CardFan } from "./CardFan";
import { ChipIcon } from "./icons";
import type { Character, PlayingCard } from "@/lib/game/types";

/** Opponent area — top of the table: avatar + face-down cards + score box. */
export function OpponentArea({
  character,
  cards,
  chips,
  cardCount = 5,
  active,
}: {
  character: Character | null;
  cards: PlayingCard[]; // face-down placeholders
  chips: number;
  cardCount?: number;
  active?: boolean;
}) {
  const shown = cards.length > 0 ? cards : Array.from({ length: cardCount }, (_, i) => ({
    id: `opp-back-${i}`,
    rank: "A" as const,
    suit: "spades" as const,
  }));

  return (
    <div className="flex items-end gap-3 sm:gap-5">
      {character && (
        <PlayerAvatar
          emoji={character.emoji}
          gradient={character.color}
          label={character.nameTr}
          sublabel="Rakip"
          active={active}
          size="sm"
        />
      )}
      <div className="flex flex-col items-center gap-1.5">
        <CardFan
          cards={shown}
          faceDown
          maxAngle={18}
          cardWidth="w-9 sm:w-11"
          overlapClass="-ml-5 sm:-ml-6"
        />
        <BlackOverlayBox className="text-amber-200">
          <ChipIcon className="h-3.5 w-3.5 text-amber-300" />
          <span className="text-sm font-black tabular-nums text-white">
            {chips.toLocaleString("tr-TR")}
          </span>
        </BlackOverlayBox>
      </div>
    </div>
  );
}

/** Player area — bottom of the table: score box + fanned open hand + avatar. */
export function PlayerArea({
  character,
  cards,
  selectedIds,
  chips,
  onToggle,
  disabled,
  active,
}: {
  character: Character | null;
  cards: PlayingCard[];
  selectedIds: string[];
  chips: number;
  onToggle?: (id: string) => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-end justify-center gap-3 sm:gap-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="order-2 flex flex-1 flex-col items-center gap-1.5"
      >
        <CardFan
          cards={cards}
          selectedIds={selectedIds}
          onToggle={onToggle}
          disabled={disabled}
          maxAngle={26}
          cardWidth="w-16 sm:w-20"
          overlapClass="-ml-7 sm:-ml-9"
        />
        <BlackOverlayBox className="text-amber-200">
          <ChipIcon className="h-3.5 w-3.5 text-amber-300" />
          <span className="text-sm font-black tabular-nums text-white">
            {chips.toLocaleString("tr-TR")}
          </span>
        </BlackOverlayBox>
      </motion.div>
      {character && (
        <div className="order-3">
          <PlayerAvatar
            emoji={character.emoji}
            gradient={character.color}
            label={character.nameTr}
            sublabel="Sen"
            active={active}
            size="md"
          />
        </div>
      )}
    </div>
  );
}
