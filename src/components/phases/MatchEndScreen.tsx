// src/components/phases/MatchEndScreen.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Home, Trophy, Skull, Crown, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CasinoTable } from "@/components/game/CasinoTable";
import { BlackOverlayBox } from "@/components/game/BlackOverlayBox";
import { JokerRow } from "@/components/game/JokerCard";
import { ChipIcon } from "@/components/game/icons";
import { useGameStore } from "@/lib/store/useGameStore";
import { getCharacter } from "@/lib/game/characters";
import { useState, useEffect } from "react";

export function MatchEndScreen() {
  const winner = useGameStore((s) => s.matchWinner);
  const playerChips = useGameStore((s) => s.player.chips);
  const opponentChips = useGameStore((s) => s.opponent.chips);
  const playerChar = useGameStore((s) => s.player.character);
  const oppChar = useGameStore((s) => s.opponent.character);
  const owned = useGameStore((s) => s.player.jokers);
  const reset = useGameStore((s) => s.reset);

  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const won = winner === "player";
  const tied = winner === "tie";
  const lost = winner === "opponent";

  // Animasyonlu skor artışı
  useEffect(() => {
    const duration = 2500;
    const steps = 70;
    const stepTime = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      setPlayerScore(Math.round(playerChips * easedProgress));
      setOpponentScore(Math.round(opponentChips * easedProgress));
      
      if (currentStep >= steps) {
        setPlayerScore(playerChips);
        setOpponentScore(opponentChips);
        setShowResult(true);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [playerChips, opponentChips]);

  return (
    <CasinoTable>
      <div className="flex h-full flex-col items-center justify-center px-4 py-6 text-center relative overflow-hidden">
        {/* Arka plan efekti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showResult ? 1 : 0 }}
            className={`absolute inset-0 transition-colors duration-1000 ${
              won ? "bg-emerald-500/15" : lost ? "bg-red-500/15" : "bg-yellow-500/15"
            }`}
          />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: showResult ? 1 : 0, 
              opacity: showResult ? 0.4 : 0 
            }}
            transition={{ duration: 1.5, delay: 0.3 }}
            className={`absolute inset-0 blur-3xl ${
              won ? "bg-emerald-500/30" : lost ? "bg-red-500/30" : "bg-yellow-500/30"
            }`}
          />
          
          {/* Kazanan için konfeti efekti (sadece kazanan) */}
          {won && showResult && (
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * window.innerWidth,
                    y: -20,
                    rotate: 0,
                    scale: 0
                  }}
                  animate={{ 
                    y: window.innerHeight + 100,
                    rotate: 360 * (Math.random() * 3 + 1),
                    scale: 1
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 3,
                    delay: Math.random() * 2,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2
                  }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: `hsl(${Math.random() * 360}, 80%, 60%)`,
                    left: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Ana İkon */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 12 }}
          className="relative z-10"
        >
          <div className="text-7xl sm:text-8xl relative">
            {won ? "🏆" : tied ? "🤝" : "💀"}
            {won && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute -top-4 -right-4"
              >
                <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Sonuç Başlığı */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`relative z-10 mt-2 text-3xl font-black sm:text-5xl ${
            won ? "text-emerald-400" : tied ? "text-yellow-400" : "text-red-400"
          }`}
        >
          {won ? (
            <span className="flex items-center gap-3">
              KAZANDIN! 🎉
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Crown className="h-8 w-8 text-amber-400" />
              </motion.span>
            </span>
          ) : tied ? (
            "BERABERE! 🤝"
          ) : (
            "KAYBETTİN! 💀"
          )}
        </motion.h2>

        {/* Alt başlık */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 mb-4 text-xs text-zinc-300"
        >
          {getCharacter(playerChar)?.nameTr} 🆚 {getCharacter(oppChar)?.nameTr}
        </motion.p>

        {/* Skor Tablosu */}
        <div className="relative z-10 mb-5 flex w-full max-w-md flex-col gap-3">
          <FinalRow
            label={`${getCharacter(playerChar)?.nameTr ?? "Sen"}`}
            subtitle="Sen"
            chips={playerScore}
            highlight={won}
            isWinner={won}
            isLoser={lost}
            delay={0.2}
          />
          <FinalRow
            label={`${getCharacter(oppChar)?.nameTr ?? "Rakip"}`}
            subtitle="Rakip"
            chips={opponentScore}
            highlight={lost}
            isWinner={lost}
            isLoser={won}
            delay={0.4}
          />
        </div>

        {/* Sonuç Detayı */}
        {showResult && !tied && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative z-10 mb-4"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
              won
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-400/30"
                : "bg-red-500/20 text-red-400 border border-red-400/30"
            }`}>
              {won ? (
                <>
                  <Trophy className="h-4 w-4" />
                  <span>Maçı kazandın! 🎊</span>
                </>
              ) : (
                <>
                  <Skull className="h-4 w-4" />
                  <span>Maçı kaybettin! 😢</span>
                </>
              )}
            </div>
          </motion.div>
        )}

        {tied && showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative z-10 mb-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-400/30">
              <span>🤝</span>
              <span>Çok yakındı! Tekrar dene!</span>
            </div>
          </motion.div>
        )}

        {/* Jokerler */}
        {owned.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative z-10 mb-5 w-full max-w-md"
          >
            <BlackOverlayBox className="flex-col items-stretch">
              <span className="mb-1 text-[11px] font-bold text-amber-200 flex items-center gap-2">
                <Star className="h-3.5 w-3.5" />
                Topladığın Jokerler ({owned.length})
              </span>
              <JokerRow jokers={owned} />
            </BlackOverlayBox>
          </motion.div>
        )}

        {/* Butonlar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showResult ? 1 : 0, y: showResult ? 0 : 20 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 flex gap-3"
        >
          <Button
            size="lg"
            onClick={reset}
            className="gap-2 bg-gradient-to-b from-amber-400 to-amber-600 font-black text-zinc-950 hover:from-amber-300 hover:to-amber-500 shadow-lg shadow-amber-500/20"
          >
            <RotateCcw className="h-5 w-5" /> Yeni Maç
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={reset}
            className="gap-2 bg-zinc-800 text-amber-200 hover:bg-zinc-700 border border-white/10"
          >
            <Home className="h-5 w-5" /> Lobi
          </Button>
        </motion.div>
      </div>
    </CasinoTable>
  );
}

function FinalRow({
  label,
  subtitle,
  chips,
  highlight,
  isWinner,
  isLoser,
  delay = 0,
}: {
  label: string;
  subtitle?: string;
  chips: number;
  highlight?: boolean;
  isWinner?: boolean;
  isLoser?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      className={`
        flex items-center justify-between rounded-xl px-4 py-3 ring-2 transition-all duration-500
        ${isWinner 
          ? "bg-emerald-500/20 ring-emerald-400/60 shadow-lg shadow-emerald-500/20" 
          : isLoser 
          ? "bg-red-500/20 ring-red-400/60 shadow-lg shadow-red-500/20" 
          : highlight 
          ? "bg-amber-500/15 ring-amber-400/50" 
          : "bg-black/30 ring-white/10"}
      `}
    >
      <div className="flex items-center gap-3">
        {isWinner && <Trophy className="h-4 w-4 text-emerald-400" />}
        {isLoser && <Skull className="h-4 w-4 text-red-400" />}
        <div className="text-left">
          <span className={`text-sm font-bold ${isWinner ? "text-emerald-400" : isLoser ? "text-red-400" : "text-white"}`}>
            {label}
          </span>
          {subtitle && (
            <span className="text-[10px] text-zinc-400 ml-2">({subtitle})</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <motion.span 
          className={`flex items-center gap-1 transition-colors duration-500 ${
            isWinner ? "text-emerald-400" : isLoser ? "text-red-400" : "text-amber-300"
          }`}
        >
          <ChipIcon className={`h-4 w-4 ${isWinner ? "text-emerald-400" : isLoser ? "text-red-400" : "text-amber-300"}`} />
          <motion.span 
            key={chips}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className={`text-xl font-black tabular-nums ${
              isWinner ? "text-emerald-400" : isLoser ? "text-red-400" : "text-white"
            }`}
          >
            {chips.toLocaleString("tr-TR")}
          </motion.span>
        </motion.span>
        {isWinner && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, delay: 0.3 }}
            className="w-2 h-2 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50 animate-pulse"
          />
        )}
        {isLoser && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, delay: 0.3 }}
            className="w-2 h-2 bg-red-400 rounded-full shadow-lg shadow-red-400/50 animate-pulse"
          />
        )}
      </div>
    </motion.div>
  );
}