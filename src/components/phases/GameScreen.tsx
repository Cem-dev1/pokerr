"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Play, Forward, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CasinoTable } from "@/components/game/CasinoTable";
import { GameHUD } from "@/components/game/GameHUD";
import { OpponentArea, PlayerArea } from "@/components/game/Areas";
import { Pot } from "@/components/game/Pot";
import { JokerRow } from "@/components/game/JokerCard";
import { BlackOverlayBox } from "@/components/game/BlackOverlayBox";
import { useGameStore, MAX_SELECT } from "@/lib/store/useGameStore";
import { getCharacter } from "@/lib/game/characters";
import { scoreHand } from "@/lib/game/scoring";
import { HAND_LABEL_TR } from "@/lib/game/types";

export function GameScreen() {
  const round = useGameStore((s) => s.round);
  const roundPhase = useGameStore((s) => s.roundPhase);
  const player = useGameStore((s) => s.player);
  const opponent = useGameStore((s) => s.opponent);
  const pot = useGameStore((s) => s.pot);
  const log = useGameStore((s) => s.log);

  const toggleSelectCard = useGameStore((s) => s.toggleSelectCard);
  const discardSelected = useGameStore((s) => s.discardSelected);
  const proceedToPlay = useGameStore((s) => s.proceedToPlay);
  const playHand = useGameStore((s) => s.playHand);
  const goToShowdown = useGameStore((s) => s.goToShowdown);

  const character = getCharacter(player.character);
  const oppChar = getCharacter(opponent.character);

  // live projected score for currently selected cards
  const preview = useMemo(() => {
    if (player.selected.length === 0) return null;
    const played = player.hand.filter((c) => player.selected.includes(c.id));
    return scoreHand(played, player.character, player.jokers);
  }, [player.selected, player.hand, player.character, player.jokers]);

  const isDiscard = roundPhase === "discard";
  const canPlay = player.selected.length >= 1 && player.selected.length <= MAX_SELECT;

  return (
    <CasinoTable>
      <div className="flex h-full flex-col px-2 py-2 sm:px-4 sm:py-3">
        {/* HUD */}
        <GameHUD
          round={round}
          chips={player.chips}
          gold={player.gold}
          discardsLeft={isDiscard ? player.discardsLeft : undefined}
          className="mb-1"
        />

        {/* Opponent (top) */}
        <div className="mt-1 flex justify-start">
          <OpponentArea
            character={oppChar}
            cards={[]}
            cardCount={opponent.cardCount}
            chips={opponent.chips}
            active={!isDiscard}
          />
        </div>

        {/* Center: pot + phase + preview */}
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <Pot amount={pot || player.chips} />

          <AnimatePresence mode="wait">
            <motion.div
              key={roundPhase}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-1.5"
            >
              <BlackOverlayBox>
                {isDiscard ? (
                  <>
                    <Eye className="h-3.5 w-3.5 text-sky-300" />
                    <span className="text-xs font-bold text-white">
                      FAZ: Discard — istenmeyen kartları seçip at
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 text-amber-300" />
                    <span className="text-xs font-bold text-white">
                      FAZ: Kart Seç & Oyna (1–5 kart)
                    </span>
                  </>
                )}
              </BlackOverlayBox>

              {preview && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="rounded-lg bg-black/50 px-3 py-1 ring-1 ring-amber-300/40"
                >
                  <span className="text-[11px] text-zinc-300">Seçili el: </span>
                  <span className="text-xs font-black text-amber-200">
                    {HAND_LABEL_TR[preview.handType]}
                  </span>
                  <span className="mx-1 text-zinc-500">·</span>
                  <span className="text-xs font-black text-emerald-300">
                    +{preview.total} Çip
                  </span>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Player hand (bottom) */}
        <PlayerArea
          character={character}
          cards={player.hand}
          selectedIds={player.selected}
          chips={player.chips}
          onToggle={toggleSelectCard}
          disabled={false}
          active
        />

        {/* Owned jokers */}
        <div className="mt-2 rounded-lg bg-black/25 px-2 py-1 ring-1 ring-white/10">
          <JokerRow jokers={player.jokers} />
        </div>

        {/* Action bar */}
        <div className="mt-2 flex items-center justify-center gap-2">
          {isDiscard ? (
            <>
              <Button
                size="lg"
                variant="secondary"
                onClick={discardSelected}
                disabled={player.selected.length === 0 || player.discardsLeft <= 0}
                className="gap-2 bg-zinc-800 text-sky-200 hover:bg-zinc-700"
              >
                <Trash2 className="h-4 w-4" /> Kart At
                <span className="text-[10px] text-zinc-400">
                  ({player.discardsLeft} hak)
                </span>
              </Button>
              <Button
                size="lg"
                onClick={proceedToPlay}
                className="gap-2 bg-gradient-to-b from-amber-400 to-amber-600 font-black text-zinc-950 hover:from-amber-300 hover:to-amber-500"
              >
                <Forward className="h-4 w-4" /> Devam → Oyna
              </Button>
            </>
          ) : (
            <>
              <Button
                size="lg"
                onClick={() => {
                  playHand();
                  goToShowdown();
                }}
                disabled={!canPlay}
                className="gap-2 bg-gradient-to-b from-emerald-400 to-emerald-600 font-black text-zinc-950 hover:from-emerald-300 hover:to-emerald-500 disabled:opacity-40"
              >
                <Play className="h-5 w-5" /> Eli Oyna
                {player.selected.length > 0 && (
                  <span className="text-xs">({player.selected.length})</span>
                )}
              </Button>
            </>
          )}
        </div>

        {/* log ticker */}
        <div className="mt-1 truncate text-center text-[10px] text-zinc-400">
          {log[log.length - 1] ?? ""}
        </div>
      </div>
    </CasinoTable>
  );
}
