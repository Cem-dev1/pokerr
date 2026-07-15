// src/components/phases/RoundEndScreen.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Trophy, Skull, Crown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CasinoTable } from "@/components/game/CasinoTable";
import { BlackOverlayBox } from "@/components/game/BlackOverlayBox";
import { ChipIcon } from "@/components/game/icons";
import { useGameStore, TOTAL_ROUNDS } from "@/lib/store/useGameStore";
import { getCharacter } from "@/lib/game/characters";
import { useState, useEffect } from "react";

export function RoundEndScreen() {
  const round = useGameStore((s) => s.round);
  const playerChips = useGameStore((s) => s.player.chips);
  const opponentChips = useGameStore((s) => s.opponent.chips);
  const playerChar = useGameStore((s) => s.player.character);
  const oppChar = useGameStore((s) => s.opponent.character);
  const gold = useGameStore((s) => s.player.gold);
  const log = useGameStore((s) => s.log);
  const nextRoundOrMatch = useGameStore((s) => s.nextRoundOrMatch);

  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const lead = playerChips - opponentChips;
  const isLast = round >= TOTAL_ROUNDS;
  const playerWon = lead > 0;
  const opponentWon = lead < 0;
  const isTie = lead === 0;

  // Animasyonlu skor artışı
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
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

  // Kazanan mesajı
  const getResultMessage = () => {
    if (playerWon) {
      return {
        icon: <Trophy className="h-6 w-6 text-emerald-400" />,
        text: "Bu turu kazandın! 🎉",
        color: "text-emerald-400",
        bg: "bg-emerald-500/20 border-emerald-400/30"
      };
    } else if (opponentWon) {
      return {
        icon: <Skull className="h-6 w-6 text-red-400" />,
        text: "Bu turu kaybettin! 💀",
        color: "text-red-400",
        bg: "bg-red-500/20 border-red-400/30"
      };
    } else {
      return {
        icon: <span className="text-2xl">🤝</span>,
        text: "Berabere!",
        color: "text-yellow-400",
        bg: "bg-yellow-500/20 border-yellow-400/30"
      };
    }
  };

  const result = getResultMessage();

  return (
    <CasinoTable>
      <div className="flex h-full flex-col items-center justify-center px-4 py-6 text-center relative overflow-hidden">
        {/* Arka plan efekti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showResult ? 1 : 0 }}
            className={`absolute inset-0 transition-colors duration-1000 ${
              playerWon ? "bg-emerald-500/10" : opponentWon ? "bg-red-500/10" : "bg-yellow-500/10"
            }`}
          />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: showResult ? 1 : 0, 
              opacity: showResult ? 0.2 : 0 
            }}
            transition={{ duration: 1, delay: 0.5 }}
            className={`absolute inset-0 blur-3xl ${
              playerWon ? "bg-emerald-500/20" : opponentWon ? "bg-red-500/20" : "bg-yellow-500/20"
            }`}
          />
        </div>

        {/* Başlık */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 16 }}
          className="relative z-10"
        >
          <div className="text-glow-gold mb-1 text-2xl font-black text-amber-200 sm:text-3xl">
            🎯 TUR {round} BİTTİ
          </div>
        </motion.div>

        {/* Sonuç mesajı */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ scale: 0, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.3 }}
              className="relative z-10 mt-1"
            >
              <div className={`inline-flex items-center gap-3 px-6 py-2.5 rounded-full border-2 font-bold text-base ${result.bg} ${result.color}`}>
                {result.icon}
                <span>{result.text}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skor farkı */}
        {showResult && lead !== 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative z-10 mt-2 mb-3"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold ${
              playerWon
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-400/30"
                : "bg-red-500/20 text-red-400 border border-red-400/30"
            }`}>
              <span>{playerWon ? "⬆" : "⬇"}</span>
              <span>{Math.abs(lead)} Çip {playerWon ? "öndesin" : "geridesin"}</span>
            </div>
          </motion.div>
        )}

        {showResult && isTie && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative z-10 mt-2 mb-3"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-400/30">
              <span>⚖️</span>
              <span>Eşitlik!</span>
            </div>
          </motion.div>
        )}

        {/* Skor Tablosu */}
        <div className="relative z-10 mb-4 flex w-full max-w-md flex-col gap-2.5 mt-1">
          <ScoreRow
            label={getCharacter(playerChar)?.nameTr ?? "Sen"}
            subtitle="Sen"
            chips={playerScore}
            gold={gold}
            isWinner={playerWon}
            isLoser={opponentWon}
            delay={0.2}
          />
          <ScoreRow
            label={getCharacter(oppChar)?.nameTr ?? "Rakip"}
            subtitle="Rakip"
            chips={opponentScore}
            isWinner={opponentWon}
            isLoser={playerWon}
            delay={0.4}
          />
        </div>

        {/* Log */}
        <BlackOverlayBox className="relative z-10 mb-4 max-w-md text-left text-[11px] text-zinc-300">
          <span className="font-bold text-amber-200">Son olay:</span>{" "}
          {log[log.length - 1] ?? "—"}
        </BlackOverlayBox>

        {/* Devam Butonu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showResult ? 1 : 0, y: showResult ? 0 : 20 }}
          transition={{ delay: 0.7 }}
          className="relative z-10"
        >
          <Button
            size="lg"
            onClick={nextRoundOrMatch}
            className="gap-2 bg-gradient-to-b from-amber-400 to-amber-600 font-black text-zinc-950 hover:from-amber-300 hover:to-amber-500 shadow-lg shadow-amber-500/20"
          >
            {isLast ? "🏆 Maç Sonucu" : `🎯 Tur ${round + 1} — Dükkân`}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </CasinoTable>
  );
}

function ScoreRow({
  label,
  subtitle,
  chips,
  gold,
  isWinner,
  isLoser,
  delay = 0,
}: {
  label: string;
  subtitle?: string;
  chips: number;
  gold?: number;
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
            className={`text-lg font-black tabular-nums ${
              isWinner ? "text-emerald-400" : isLoser ? "text-red-400" : "text-white"
            }`}
          >
            {chips.toLocaleString("tr-TR")}
          </motion.span>
        </motion.span>
        {gold !== undefined && (
          <span className="text-xs text-zinc-400">· {gold} Altın</span>
        )}
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