// src/components/phases/ShopScreen.tsx
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CasinoTable } from "@/components/game/CasinoTable";
import { GameHUD } from "@/components/game/GameHUD";
import { useGameStore } from "@/lib/store/useGameStore";

export function AllShopScreen() {
  const round = useGameStore((s) => s.round);
  const chips = useGameStore((s) => s.player.chips);
  const gold = useGameStore((s) => s.player.gold);
  const finishShop = useGameStore((s) => s.finishShop);

  return (
    <CasinoTable>
      <div className="flex h-full flex-col items-center justify-center px-3 py-3 sm:px-6 sm:py-4">
        <GameHUD round={round} chips={chips} gold={gold} className="mb-4" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-glow-gold text-2xl font-black text-amber-200 sm:text-3xl">
            DÜKKÂN
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            Dükkan içeriği yakında eklenecek...
          </p>
          <div className="mt-4 flex gap-2 text-xs text-zinc-500">
            <span>🪙 Altın: {gold}</span>
            <span>•</span>
            <span>🪙 Çip: {chips.toLocaleString("tr-TR")}</span>
          </div>
        </motion.div>

        <div className="mt-6">
          <Button
            size="lg"
            onClick={finishShop}
            className="gap-2 bg-gradient-to-b from-emerald-400 to-emerald-600 font-black text-zinc-950 hover:from-emerald-300 hover:to-emerald-500"
          >
            Masaya Geç →
          </Button>
        </div>
      </div>
    </CasinoTable>
  );
}