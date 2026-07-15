// src/components/phases/LobbyScreen.tsx
"use client";

import { motion } from "framer-motion";
import { CasinoTable } from "@/components/game/CasinoTable";
import { Pot } from "@/components/game/Pot";
import { useGameStore } from "@/lib/store/useGameStore";
import { getCharacter } from "@/lib/game/characters";

export function LobbyScreen() {
  const player = useGameStore((s) => s.player);
  const character = getCharacter(player.character);

  return (
    <CasinoTable>
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        {/* Seçili karakter bilgisi */}
        {character && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 flex items-center gap-3 rounded-full bg-black/40 px-4 py-2 ring-1 ring-amber-400/30"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img
                src={character.image}
                alt={character.nameTr}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/c1.png';
                }}
              />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {character.nameTr}
              </div>
              <div className="text-[10px] text-zinc-400">
                {character.title}
              </div>
            </div>
            <div className="text-sm text-emerald-400">✅</div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mb-1 text-[10px] font-black uppercase tracking-[0.4em] text-amber-300/80"
        >
          1v1 Stratejik Deck-Builder
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 18 }}
          className="text-glow-gold text-4xl font-black leading-none text-amber-200 drop-shadow sm:text-6xl"
        >
          CASINO
          <br />
          <span className="text-emerald-200 text-glow-white">POKER</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="my-4"
        >
          <Pot amount={0} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-md text-xs text-zinc-200/90"
        >
          3 tur. Her tur dükkândan Joker topla, elini discarde iyileştir, en
          iyi poker elini oyna. Tur sonunda en çok <b className="text-amber-300">Çip</b>{" "}
          toplayan kazanır. Altın sadece dükkânda harcanır.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[10px] text-zinc-400">
            10 Karakter · 20 Joker · Rakip: Yapay Zekâ
          </span>
        </motion.div>
      </div>
    </CasinoTable>
  );
}