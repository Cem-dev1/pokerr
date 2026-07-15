"use client";

import { motion } from "framer-motion";
import { ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CasinoTable } from "@/components/game/CasinoTable";
import { CardFan } from "@/components/game/CardFan";
import { BlackOverlayBox } from "@/components/game/BlackOverlayBox";
import { ChipIcon } from "@/components/game/icons";
import { useGameStore, handTypeLabel } from "@/lib/store/useGameStore";
import { getCharacter } from "@/lib/game/characters";
import { HAND_LABEL_TR } from "@/lib/game/types";
import type { ScoreBreakdown } from "@/lib/game/types";

function BreakdownCard({
  title,
  breakdown,
  cards,
  faceDown,
  accent,
}: {
  title: string;
  breakdown: ScoreBreakdown | null;
  cards: import("@/lib/game/types").PlayingCard[];
  faceDown?: boolean;
  accent: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 rounded-xl bg-black/30 p-3 ring-1 ring-white/10">
      <div className={`text-xs font-black uppercase tracking-wide ${accent}`}>
        {title}
      </div>
      <CardFan
        cards={cards}
        faceDown={faceDown}
        maxAngle={18}
        cardWidth="w-12 sm:w-16"
        overlapClass="-ml-6 sm:-ml-8"
      />
      {breakdown ? (
        <>
          <BlackOverlayBox className="text-amber-200">
            <span className="text-[11px] text-zinc-300">El:</span>
            <span className="text-xs font-black text-white">
              {HAND_LABEL_TR[breakdown.handType]}
            </span>
          </BlackOverlayBox>
          <div className="flex items-center gap-1 text-emerald-300">
            <ChipIcon className="h-4 w-4" />
            <span className="text-2xl font-black tabular-nums text-glow-gold text-amber-200">
              +{breakdown.total}
            </span>
          </div>
          <ul className="max-h-24 w-full overflow-y-auto casino-scroll text-[10px] leading-snug text-zinc-300">
            {breakdown.notes.map((n, i) => (
              <li key={i} className="truncate">
                • {n}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="text-xs text-zinc-500">El oynanmadı</div>
      )}
    </div>
  );
}

export function ShowdownScreen() {
  const lastBreakdown = useGameStore((s) => s.lastBreakdown);
  const opponentLastBreakdown = useGameStore((s) => s.opponentLastBreakdown);
  const playerPlayedCards = useGameStore((s) => s.playerPlayedCards);
  const opponentHand = useGameStore((s) => s.opponentHand);
  const playerChips = useGameStore((s) => s.player.chips);
  const opponentChips = useGameStore((s) => s.opponent.chips);
  const playerChar = useGameStore((s) => s.player.character);
  const oppChar = useGameStore((s) => s.opponent.character);
  const finishRound = useGameStore((s) => s.finishRound);
  const round = useGameStore((s) => s.round);

  const playerWon =
    (lastBreakdown?.total ?? 0) > (opponentLastBreakdown?.total ?? 0);

  return (
    <CasinoTable>
      <div className="flex h-full flex-col px-3 py-3 sm:px-6 sm:py-4">
        <div className="mb-2 text-center">
          <h2 className="text-glow-gold text-xl font-black text-amber-200 sm:text-2xl">
            🃏 SHOWDOWN — Tur {round}
          </h2>
          <p className="text-[11px] text-zinc-300">
            {playerWon ? "Bu eli sen kazandın!" : "Rakip bu eli önde götürdü."}
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-3 sm:flex-row">
          <BreakdownCard
            title={`${getCharacter(playerChar)?.nameTr ?? "Sen"} (Sen)`}
            breakdown={lastBreakdown}
            cards={playerPlayedCards}
            accent="text-amber-300"
          />
          <div className="flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.2 }}
            >
              <Trophy
                className={`h-8 w-8 ${
                  playerWon ? "text-amber-300" : "text-zinc-500"
                }`}
              />
            </motion.div>
          </div>
          <BreakdownCard
            title={`${getCharacter(oppChar)?.nameTr ?? "Rakip"} (Rakip)`}
            breakdown={opponentLastBreakdown}
            cards={opponentHand}
            faceDown={false}
            accent="text-rose-300"
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <BlackOverlayBox className="text-amber-300">
            <span className="text-[11px] text-zinc-300">Senin toplam:</span>
            <ChipIcon className="h-4 w-4" />
            <span className="text-sm font-black text-white">
              {playerChips.toLocaleString("tr-TR")}
            </span>
          </BlackOverlayBox>
          <BlackOverlayBox className="text-rose-300">
            <span className="text-[11px] text-zinc-300">Rakip toplam:</span>
            <ChipIcon className="h-4 w-4" />
            <span className="text-sm font-black text-white">
              {opponentChips.toLocaleString("tr-TR")}
            </span>
          </BlackOverlayBox>
        </div>

        <div className="mt-3 flex justify-center">
          <Button
            size="lg"
            onClick={finishRound}
            className="gap-2 bg-gradient-to-b from-amber-400 to-amber-600 font-black text-zinc-950 hover:from-amber-300 hover:to-amber-500"
          >
            Tur Sonu <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </CasinoTable>
  );
}

// keep import used
void handTypeLabel;
