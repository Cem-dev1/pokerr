// src/components/phases/ShopScreen.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ShoppingCart, Check, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CasinoTable } from "@/components/game/CasinoTable";
import { GameHUD } from "@/components/game/GameHUD";
import { JokerCard, JokerRow } from "@/components/game/JokerCard";
import { useGameStore, shopPriceFor } from "@/lib/store/useGameStore";
import { getCharacter } from "@/lib/game/characters";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const SHOP_DURATION = 30; // 30 saniye

export function ShopScreen() {
  const round = useGameStore((s) => s.round);
  const gold = useGameStore((s) => s.player.gold);
  const chips = useGameStore((s) => s.player.chips);
  const shopItems = useGameStore((s) => s.shopItems);
  const owned = useGameStore((s) => s.player.jokers);
  const characterId = useGameStore((s) => s.player.character);
  const rerollShop = useGameStore((s) => s.rerollShop);
  const buyJoker = useGameStore((s) => s.buyJoker);
  const finishShop = useGameStore((s) => s.finishShop);
  const log = useGameStore((s) => s.log);

  const [timeLeft, setTimeLeft] = useState(SHOP_DURATION);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isWarning, setIsWarning] = useState(false);

  const character = getCharacter(characterId);
  const rerollCost = characterId === "aristocrat" ? 1 : 2;

  // Geri sayım
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsTimeUp(true);
      // 1 saniye sonra otomatik geç
      const timer = setTimeout(() => {
        finishShop();
      }, 1000);
      return () => clearTimeout(timer);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        // 5 saniye kaldığında uyarı
        if (newTime <= 5 && newTime > 0) {
          setIsWarning(true);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, finishShop]);

  // Zaman dolduğunda butonları devre dışı bırak
  const isDisabled = isTimeUp;

  // Zaman formatı
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Zaman rengi
  const getTimeColor = () => {
    if (timeLeft <= 5) return "text-red-400";
    if (timeLeft <= 10) return "text-yellow-400";
    return "text-emerald-400";
  };

  // Zaman doldu mu?
  const isExpired = timeLeft <= 0;

  return (
    <CasinoTable>
      <div className="flex h-full flex-col px-2 py-2 sm:px-4 sm:py-4">
        <GameHUD round={round} chips={chips} gold={gold} className="mb-1 sm:mb-2" />

        {/* Üst Bar - Başlık ve Zaman */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex-1 min-w-[120px]">
            <h2 className="text-glow-gold text-base sm:text-xl font-black text-amber-200">
              🛒 DÜKKÂN
            </h2>
            <p className="text-[9px] sm:text-[11px] text-zinc-300 hidden sm:block">
              Joker satın al, sonra masaya geç. Reroll {rerollCost} Altın.
              {characterId === "merchant" && " (Tüccar: -2 Altın indirim)"}
              {characterId === "aristocrat" && " (Aristokrat: Reroll 1 Altın)"}
              {characterId === "lucky" && " (Şanslı Leydi: %20 bedava reroll)"}
            </p>
          </div>

          {/* Zaman Göstergesi */}
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div
              animate={isWarning ? { scale: [1, 1.1, 1], opacity: [1, 0.7, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border-2",
                isExpired
                  ? "bg-red-500/20 border-red-400/40"
                  : isWarning
                  ? "bg-yellow-500/20 border-yellow-400/40"
                  : "bg-emerald-500/20 border-emerald-400/40"
              )}
            >
              <Clock className={cn("h-4 w-4 sm:h-5 sm:w-5", getTimeColor())} />
              <span className={cn("font-black text-base sm:text-xl tabular-nums", getTimeColor())}>
                {formatTime(timeLeft)}
              </span>
              {isExpired && (
                <AlertCircle className="h-4 w-4 text-red-400 animate-pulse" />
              )}
            </motion.div>

            <Button
              variant="secondary"
              size="sm"
              onClick={rerollShop}
              disabled={gold < rerollCost || isExpired}
              className="gap-1 sm:gap-1.5 bg-zinc-800 text-amber-200 hover:bg-zinc-700 text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Reroll</span>
              <span className="text-amber-400">({rerollCost})</span>
            </Button>
          </div>
        </div>

        {/* Zaman doldu uyarısı */}
        <AnimatePresence>
          {isExpired && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-2 bg-red-500/20 border border-red-400/30 rounded-lg p-2 text-center"
            >
              <span className="text-xs sm:text-sm font-bold text-red-400">
                ⏰ Süre doldu! Otomatik olarak masaya geçiliyor...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Joker Grid - Mobil uyumlu */}
        <div className="grid flex-1 grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 content-start gap-1.5 sm:gap-2 overflow-y-auto pb-2 casino-scroll">
          {shopItems.length === 0 && (
            <div className="col-span-full py-6 sm:py-8 text-center text-xs sm:text-sm text-zinc-400">
              Dükkân boşaldı. Reroll ile yenile.
            </div>
          )}
          {shopItems.map((joker, i) => {
            const price = shopPriceFor(joker, characterId);
            return (
              <motion.div
                key={joker.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  isExpired && "opacity-50 pointer-events-none"
                )}
              >
                <JokerCard
                  joker={joker}
                  price={price}
                  affordable={gold >= price && !isExpired}
                  onBuy={() => buyJoker(joker.id)}
                  characterId={characterId}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Sahip Olunan Jokerler */}
        <div className="mt-1.5 sm:mt-2 rounded-lg bg-black/30 p-1.5 sm:p-2 ring-1 ring-white/10">
          <div className="mb-0.5 sm:mb-1 flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[11px] font-bold uppercase tracking-wide text-amber-200">
            <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> 
            <span className="hidden xs:inline">Sahip Olduğun Jokerler</span>
            <span className="xs:hidden">Jokerlerin</span>
            <span className="text-zinc-400 text-[8px] sm:text-[10px]">({owned.length})</span>
          </div>
          <JokerRow jokers={owned} />
        </div>

        {/* Alt Bar - Log ve Buton */}
        <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center justify-between gap-1 sm:gap-2">
          <div className="hidden sm:block max-w-[50%] flex-1 truncate text-[10px] sm:text-[11px] text-zinc-300">
            {log[log.length - 1] ?? ""}
          </div>
          <Button
            size="lg"
            onClick={finishShop}
            disabled={isExpired}
            className={cn(
              "ml-auto gap-1 sm:gap-2 font-black text-xs sm:text-sm px-3 py-2 sm:px-6 sm:py-3",
              isExpired
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-gradient-to-b from-emerald-400 to-emerald-600 text-zinc-950 hover:from-emerald-300 hover:to-emerald-500"
            )}
          >
            <Check className="h-4 w-4 sm:h-5 sm:w-5" /> 
            <span className="hidden xs:inline">Hazır — Masaya Geç</span>
            <span className="xs:hidden">Masaya Geç</span>
          </Button>
        </div>

        {/* Zaman dolduysa otomatik geçiş için geri sayım */}
        <AnimatePresence>
          {isExpired && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-1 text-center text-[8px] sm:text-[10px] text-red-400/60 animate-pulse"
            >
              Otomatik yönlendiriliyorsunuz...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CasinoTable>
  );
}