// src/app/page.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CasinoTable } from "@/components/game/CasinoTable";
import { OnlineLobbyScreen } from "@/components/phases/OnlineLobbyScreen";
import { OfflineLobbyScreen } from "@/components/phases/OfflineLobbyScreen";
import { ShopScreen } from "@/components/phases/ShopScreen";
import { GameScreen } from "@/components/phases/GameScreen";
import { ShowdownScreen } from "@/components/phases/ShowdownScreen";
import { RoundEndScreen } from "@/components/phases/RoundEndScreen";
import { MatchEndScreen } from "@/components/phases/MatchEndScreen";
import CharacterSelectScreen from "@/components/phases/CharacterSelectScreen";
import { useGameStore } from "@/lib/store/useGameStore";
import { Wifi, WifiOff, Gamepad2, Users, ArrowLeft } from "lucide-react";

export default function Home() {
  const [mode, setMode] = useState<"menu" | "online" | "offline">("menu");
  const phase = useGameStore((s) => s.phase);
  const hasCharacter = useGameStore((s) => s.player.character !== null);

  // Offline oyun ekranları
  if (mode === "offline") {
    // Karakter seçilmediyse karakter seçim ekranını göster
    if (!hasCharacter) {
      return (
        <div className="relative">
          <CharacterSelectScreen />
          {/* Geri butonu */}
          <button
            onClick={() => setMode("menu")}
            className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-black/80 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Ana Menü
          </button>
        </div>
      );
    }

    switch (phase) {
      case "shop":
        return <ShopScreen />;
      case "game":
        return <GameScreen />;
      case "showdown":
        return <ShowdownScreen />;
      case "round-end":
        return <RoundEndScreen />;
      case "match-end":
        return <MatchEndScreen />;
      default:
        return (
          <div className="relative">
            <OfflineLobbyScreen />
            {/* Geri butonu */}
            <button
              onClick={() => setMode("menu")}
              className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-black/80 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Ana Menü
            </button>
          </div>
        );
    }
  }

  // Online oyun
  if (mode === "online") {
    return (
      <div className="relative">
        <OnlineLobbyScreen />
        {/* Geri butonu */}
        <button
          onClick={() => setMode("menu")}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-black/80 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Ana Menü
        </button>
      </div>
    );
  }

  // Ana menü - Online/Offline seçimi
  return (
    <CasinoTable>
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mb-2 text-[10px] font-black uppercase tracking-[0.4em] text-amber-300/80"
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
          className="my-6"
        >
          <div className="text-6xl">🎰</div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8 max-w-md text-xs text-zinc-200/90"
        >
          Diğer oyunculara karşı online savaş veya yapay zekaya karşı offline oyna.
        </motion.p>

        {/* Seçenekler */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
        >
          {/* Online Oyna */}
          <Button
            size="lg"
            onClick={() => setMode("online")}
            className="flex-1 flex flex-col items-center gap-2 py-8 bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 font-black text-white shadow-xl shadow-blue-500/20"
          >
            <div className="flex items-center gap-3">
              <Wifi className="h-6 w-6" />
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl">Online Oyna</div>
              <div className="text-[10px] font-normal opacity-70">Gerçek zamanlı çok oyunculu</div>
            </div>
          </Button>

          {/* Offline Oyna */}
          <Button
            size="lg"
            onClick={() => {
              setMode("offline");
            }}
            className="flex-1 flex flex-col items-center gap-2 py-8 bg-gradient-to-b from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 font-black text-white shadow-xl shadow-emerald-500/20"
          >
            <div className="flex items-center gap-3">
              <WifiOff className="h-6 w-6" />
              <Gamepad2 className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl">Offline Oyna</div>
              <div className="text-[10px] font-normal opacity-70">AI rakip ile tek başına</div>
            </div>
          </Button>
        </motion.div>

        {/* Alt bilgi */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-[10px] text-zinc-400"
        >
          10 Karakter · 20 Joker · 3 Tur
        </motion.div>
      </div>
    </CasinoTable>
  );
}