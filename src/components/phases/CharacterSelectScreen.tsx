// src/components/phases/CharacterSelectScreen.tsx
"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { CasinoTable } from "@/components/game/CasinoTable";
import { CHARACTERS } from "@/lib/game/characters";
import { useGameStore } from "@/lib/store/useGameStore";
import { cn } from "@/lib/utils";
import type { CharacterId } from "@/lib/game/types";
import { Check } from "lucide-react";

export default function CharacterSelectScreen() {
  const selected = useGameStore((s) => s.player.character);
  const selectCharacter = useGameStore((s) => s.selectCharacter);
  const confirmCharacter = useGameStore((s) => s.confirmCharacter);
  const [selectedChar, setSelectedChar] = useState<CharacterId | null>(selected);

  const handleSelect = (id: CharacterId) => {
    setSelectedChar(id);
    selectCharacter(id);
  };

  // Karakter seçildiğinde otomatik onayla ve lobby'ye geç
  useEffect(() => {
    if (selectedChar) {
      confirmCharacter();
    }
  }, [selectedChar, confirmCharacter]);

  const selectedCharacter = CHARACTERS.find(c => c.id === selectedChar);

  return (
    <CasinoTable>
      <div className="flex h-full flex-col px-3 py-3 sm:px-6 sm:py-4">
        <div className="mb-3 text-center">
          <h2 className="text-glow-gold text-xl font-black text-amber-200 sm:text-2xl">
            🎯 KARAKTER SEÇ
          </h2>
          <p className="text-[10px] text-zinc-300">
            Bir karakter seç ve otomatik olarak lobiye geç.
          </p>
          {selectedChar && (
            <div className="mt-1 text-xs text-emerald-400">
              ✅ {CHARACTERS.find(c => c.id === selectedChar)?.nameTr} seçildi!
            </div>
          )}
        </div>

        <div className="flex flex-1 gap-3 overflow-hidden">
          {/* Karakter Grid */}
          <div className="casino-scroll grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto pb-2 sm:grid-cols-3 lg:grid-cols-4">
            {CHARACTERS.map((c, i) => {
              const isSel = selectedChar === c.id;
              return (
                <motion.button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c.id)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ y: -3 }}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-200",
                    "bg-gradient-to-b from-zinc-800/80 to-zinc-950/80",
                    isSel
                      ? "border-amber-400 ring-2 ring-amber-400/60 shadow-lg shadow-amber-400/20"
                      : "border-white/10 hover:border-amber-300/40 hover:shadow-lg"
                  )}
                >
                  {/* Yuvarlak Profil Resmi */}
                  <div className={cn(
                    "relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-2 transition-all duration-200",
                    isSel ? "ring-amber-400 ring-4" : "ring-amber-300/50"
                  )}>
                    <img
                      src={c.image}
                      alt={c.nameTr}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/c1.png';
                      }}
                    />
                    {isSel && (
                      <div className="absolute inset-0 bg-amber-400/20" />
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs font-bold text-white">
                      {c.nameTr}
                    </div>
                    <div className="text-[8px] uppercase tracking-wide text-amber-200/70">
                      {c.title}
                    </div>
                  </div>

                  <div className="text-xl">{c.emoji}</div>
                </motion.button>
              );
            })}
          </div>

          {/* Detay Paneli */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: selectedCharacter ? 1 : 0, x: selectedCharacter ? 0 : 20 }}
            className={cn(
              "hidden lg:flex lg:w-64 flex-col rounded-xl border border-white/10 bg-black/40 p-3",
              "transition-all duration-300"
            )}
          >
            {selectedCharacter ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-amber-400/50">
                    <img
                      src={selectedCharacter.image}
                      alt={selectedCharacter.nameTr}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/c1.png';
                      }}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">
                      {selectedCharacter.nameTr}
                    </div>
                    <div className="text-[8px] uppercase tracking-wide text-amber-200/70">
                      {selectedCharacter.title}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  <div className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold">
                    Yetenekler
                  </div>
                  {selectedCharacter.abilities.map((ability, idx) => (
                    <div key={idx} className="rounded-lg bg-zinc-800/50 p-2 border border-white/5">
                      <div className="text-[10px] font-bold text-amber-200">
                        {idx + 1}. {ability.title}
                      </div>
                      <div className="text-[9px] text-zinc-300 leading-relaxed mt-0.5">
                        {ability.description}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-emerald-400 text-center">
                  ✅ Seçildi - Lobiye yönlendiriliyorsun...
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-xs text-zinc-400">
                <div>
                  <div className="text-4xl mb-2">👆</div>
                  <p>Bir karakter seç</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </CasinoTable>
  );
}