// src/components/game/BottomNav.tsx
"use client";

import { motion } from "framer-motion";
import { Users, Home, Play, Trophy, ShoppingBag, Sword } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/lib/store/useGameStore";
import { getCharacter } from "@/lib/game/characters";

interface BottomNavProps {
  activeTab: "characters" | "lobby";
  setActiveTab: (tab: "characters" | "lobby") => void;
  hasCharacter: boolean;
}

export function BottomNav({ activeTab, setActiveTab, hasCharacter }: BottomNavProps) {
  const player = useGameStore((s) => s.player);
  const character = getCharacter(player.character);
  const startMatch = useGameStore((s) => s.startMatch);
  const phase = useGameStore((s) => s.phase);

  const handleStartMatch = () => {
    if (hasCharacter) {
      startMatch();
    }
  };

  const tabs = [
    {
      id: "characters" as const,
      label: "Karakterler",
      icon: Users,
      iconColor: "text-purple-400",
      bgColor: "hover:bg-purple-500/20",
      activeBg: "bg-purple-500/30",
    },
    {
      id: "lobby" as const,
      label: "Lobi",
      icon: Home,
      iconColor: "text-blue-400",
      bgColor: "hover:bg-blue-500/20",
      activeBg: "bg-blue-500/30",
    },
  ];

  return (
    <div className="w-full bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 border-t-2 border-amber-500/30 backdrop-blur-xl flex-shrink-0 z-50 relative shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-20 sm:h-24">
          {/* Sol - Karakter Bilgisi */}
          <motion.div 
            className="flex items-center gap-3 min-w-[140px]"
            whileHover={{ scale: 1.02 }}
          >
            {character ? (
              <>
                <div className="relative">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/20">
                    <img
                      src={character.image}
                      alt={character.nameTr}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/c1.png';
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-zinc-900 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">✓</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-white leading-tight">
                    {character.nameTr}
                  </div>
                  <div className="text-[8px] uppercase tracking-wider text-amber-300/80">
                    {character.title}
                  </div>
                  <div className="text-[8px] text-emerald-400 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Aktif
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-zinc-700/50 ring-2 ring-zinc-600 flex items-center justify-center">
                  <span className="text-2xl">❓</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-400">Karakter</div>
                  <div className="text-[8px] text-zinc-500">Seçilmedi</div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Orta - Tab Butonları (Büyük) */}
          <div className="flex items-center gap-2 bg-black/40 rounded-2xl p-1.5 border border-white/5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all duration-200",
                    "text-sm font-bold",
                    isActive
                      ? `${tab.activeBg} text-white shadow-lg`
                      : `${tab.bgColor} text-zinc-400 hover:text-white`
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-white" : tab.iconColor)} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Sağ - Maça Başla Butonu (Büyük) */}
          <div className="min-w-[140px] flex justify-end">
            <motion.button
              whileHover={hasCharacter ? { scale: 1.08, y: -2 } : {}}
              whileTap={hasCharacter ? { scale: 0.95 } : {}}
              onClick={handleStartMatch}
              disabled={!hasCharacter}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200",
                "relative overflow-hidden",
                hasCharacter
                  ? "bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-zinc-950 hover:from-amber-300 hover:via-amber-400 hover:to-amber-500 shadow-xl shadow-amber-500/30"
                  : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
              )}
            >
              {/* Parlama efekti */}
              {hasCharacter && (
                <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
              )}
              <Play className="h-5 w-5" />
              <span className="hidden sm:inline font-black">MAÇA BAŞLA</span>
              <span className="sm:hidden font-black">BAŞLA</span>
              {hasCharacter && (
                <div className="absolute -inset-1 bg-amber-400/20 blur-xl animate-pulse" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Alt dekoratif çizgi */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
    </div>
  );
}