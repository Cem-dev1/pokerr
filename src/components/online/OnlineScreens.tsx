// src/components/online/OnlineScreens.tsx
// Online match phase screens. All reuse the same game primitives as offline.
// Each takes the `useOnlineMatch` result and renders for the local player.
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Trash2,
  Play,
  Forward,
  Check,
  RefreshCw,
  ShoppingCart,
  Copy,
  LogOut,
  Loader2,
  Trophy,
  Skull,
  Crown,
  ArrowRight,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CasinoTable } from "@/components/game/CasinoTable";
import { GameHUD } from "@/components/game/GameHUD";
import { OpponentArea, PlayerArea } from "@/components/game/Areas";
import { Pot } from "@/components/game/Pot";
import { JokerCard, JokerRow } from "@/components/game/JokerCard";
import { BlackOverlayBox } from "@/components/game/BlackOverlayBox";
import { CardFan } from "@/components/game/CardFan";
import { CHARACTERS, getCharacter } from "@/lib/game/characters";
import { HAND_LABEL_TR } from "@/lib/game/types";
import type { CharacterId, ScoreBreakdown, PlayingCard } from "@/lib/game/types";
import { scoreHand } from "@/lib/game/scoring";
import { MAX_SELECT } from "@/lib/store/useGameStore";
import type { UseOnlineMatch } from "@/lib/online/useOnlineMatch";
import { cn } from "@/lib/utils";

type Props = { game: UseOnlineMatch };

function WaitPill({ label = "Rakip bekleniyor..." }: { label?: string }) {
  return (
    <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-black/40 px-3 py-1.5 ring-1 ring-amber-300/30">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-300" />
      <span className="text-xs font-bold text-amber-200">{label}</span>
    </div>
  );
}

// ===========================================================================
// Waiting for opponent to join
// ===========================================================================
export function OnlineWaiting({ game }: Props) {
  const router = useRouter();
  const code = game.meta?.id?.slice(0, 8) ?? "";
  const link = typeof window !== "undefined" ? `${window.location.origin}/match/${game.meta?.id}` : "";
  return (
    <CasinoTable>
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <Users className="mb-3 h-12 w-12 text-amber-300/80" />
        <h2 className="text-glow-gold text-2xl font-black text-amber-200">RAKİP BEKLENİYOR</h2>
        <p className="mt-1 text-xs text-zinc-300">
          Bu maça başka bir oyuncu katılana kadar bekleniyor.
        </p>
        <div className="mt-4 flex flex-col items-center gap-2">
          <BlackOverlayBox className="text-amber-200">
            <span className="text-[10px] uppercase tracking-wider text-zinc-300">Maç Kodu</span>
            <span className="font-mono text-sm font-black text-white">{code}</span>
          </BlackOverlayBox>
          <Button
            variant="secondary"
            size="sm"
            className="gap-1 bg-zinc-800 text-amber-200 hover:bg-zinc-700"
            onClick={() => {
              if (link) navigator.clipboard?.writeText(link).catch(() => {});
            }}
          >
            <Copy className="h-3.5 w-3.5" /> Linki Kopyala
          </Button>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="mt-6 gap-1 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          onClick={() => router.push("/")}
        >
          <LogOut className="h-4 w-4" /> Lobiden Çık
        </Button>
      </div>
    </CasinoTable>
  );
}

// ===========================================================================
// Character select
// ===========================================================================
export function OnlineCharacterScreen({ game }: Props) {
  const me = game.me!;
  const opp = game.opp!;
  const selected = me.characterId as CharacterId | null;

  return (
    <CasinoTable>
      <div className="flex h-full flex-col px-3 py-3 sm:px-6 sm:py-4">
        <div className="mb-3 text-center">
          <h2 className="text-glow-gold text-xl font-black text-amber-200 sm:text-2xl">🎯 KARAKTER SEÇ</h2>
          <p className="text-[10px] text-zinc-300">
            Rakip: {opp.characterId ? "seçti ✓" : "seçiyor..."} · İkiniz de seçince maç başlar.
          </p>
        </div>

        <div className="casino-scroll grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto pb-2 sm:grid-cols-3 lg:grid-cols-4">
          {CHARACTERS.map((c, i) => {
            const isSel = selected === c.id;
            return (
              <motion.button
                key={c.id}
                type="button"
                disabled={!!selected}
                onClick={() => game.pickCharacter(c.id)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: selected ? 0 : -3 }}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-200",
                  "bg-gradient-to-b from-zinc-800/80 to-zinc-950/80",
                  isSel
                    ? "border-amber-400 ring-2 ring-amber-400/60 shadow-lg shadow-amber-400/20"
                    : "border-white/10 hover:border-amber-300/40 hover:shadow-lg",
                  selected && !isSel && "opacity-40"
                )}
              >
                <div
                  className={cn(
                    "relative h-16 w-16 overflow-hidden rounded-full ring-2 transition-all duration-200 sm:h-20 sm:w-20",
                    isSel ? "ring-amber-400 ring-4" : "ring-amber-300/50"
                  )}
                >
                  <img
                    src={c.image}
                    alt={c.nameTr}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/c1.png";
                    }}
                  />
                  {isSel && <div className="absolute inset-0 bg-amber-400/20" />}
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-white">{c.nameTr}</div>
                  <div className="text-[8px] uppercase tracking-wide text-amber-200/70">{c.title}</div>
                </div>
                <div className="text-xl">{c.emoji}</div>
              </motion.button>
            );
          })}
        </div>

        {selected && <WaitPill label={`${getCharacter(selected)?.nameTr} seçildi — rakip bekleniyor...`} />}
      </div>
    </CasinoTable>
  );
}

// ===========================================================================
// Shop (ready-based, no timer)
// ===========================================================================
export function OnlineShopScreen({ game }: Props) {
  const me = game.me!;
  const characterId = me.characterId as CharacterId | null;
  const rerollCost = characterId === "aristocrat" ? 1 : 2;

  return (
    <CasinoTable>
      <div className="flex h-full flex-col px-2 py-2 sm:px-4 sm:py-4">
        <GameHUD round={game.state!.round} chips={me.chips} gold={me.gold} className="mb-1 sm:mb-2" />

        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex-1 min-w-[120px]">
            <h2 className="text-glow-gold text-base font-black text-amber-200 sm:text-xl">🛒 DÜKKÂN</h2>
            <p className="hidden text-[9px] text-zinc-300 sm:block sm:text-[11px]">
              Joker al, sonra “Hazır” de. Reroll {rerollCost} Altın.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={game.rerollShop}
            disabled={me.ready || me.gold < rerollCost}
            className="gap-1 bg-zinc-800 text-amber-200 hover:bg-zinc-700"
          >
            <RefreshCw className="h-4 w-4" /> Reroll <span className="text-amber-400">({rerollCost})</span>
          </Button>
        </div>

        <div className="grid flex-1 grid-cols-2 content-start gap-1.5 overflow-y-auto pb-2 casino-scroll sm:grid-cols-3 lg:grid-cols-5 sm:gap-2">
          {me.shop.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-zinc-400 sm:text-sm">
              Dükkân boş. Reroll ile yenile.
            </div>
          )}
          {me.shop.map((joker) => {
            const price = priceFor(joker, characterId);
            return (
              <JokerCard
                key={joker.id}
                joker={joker}
                price={price}
                affordable={!me.ready && me.gold >= price}
                onBuy={() => game.buyJoker(joker.id)}
                characterId={characterId ?? undefined}
              />
            );
          })}
        </div>

        <div className="mt-1.5 rounded-lg bg-black/30 p-1.5 ring-1 ring-white/10 sm:mt-2 sm:p-2">
          <div className="mb-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-amber-200 sm:mb-1 sm:text-[11px]">
            <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Jokerlerin <span className="text-zinc-400">({me.jokers.length})</span>
          </div>
          <JokerRow jokers={me.jokers} />
        </div>

        <div className="mt-2 flex justify-center">
          {me.ready ? (
            <WaitPill label="Hazırısın — rakip bekleniyor..." />
          ) : (
            <Button
              size="lg"
              onClick={() => game.setReady(true)}
              className="gap-2 bg-gradient-to-b from-emerald-400 to-emerald-600 font-black text-zinc-950 hover:from-emerald-300 hover:to-emerald-500"
            >
              <Check className="h-5 w-5" /> Hazır — Masaya Geç
            </Button>
          )}
        </div>
      </div>
    </CasinoTable>
  );
}

function priceFor(joker: { price: number }, characterId: CharacterId | null): number {
  // mirror shopPriceFor without importing the store's joker-coupled helper signature
  let p = joker.price;
  if (characterId === "merchant") p -= 2;
  return Math.max(1, p);
}

// ===========================================================================
// Play (discard → select & play)
// ===========================================================================
export function OnlinePlayScreen({ game }: Props) {
  const me = game.me!;
  const opp = game.opp!;
  const [roundPhase, setRoundPhase] = useState<"discard" | "select-play">("discard");
  const locked = me.played;

  const preview = useMemo(() => {
    if (me.selected.length === 0) return null;
    const played = me.hand.filter((c) => me.selected.includes(c.id));
    return scoreHand(played, (me.characterId as CharacterId) ?? null, me.jokers);
  }, [me.selected, me.hand, me.characterId, me.jokers]);

  const isDiscard = roundPhase === "discard" && !locked;
  const canPlay = me.selected.length >= 1 && me.selected.length <= MAX_SELECT;

  return (
    <CasinoTable>
      <div className="flex h-full flex-col px-2 py-2 sm:px-4 sm:py-3">
        <GameHUD
          round={game.state!.round}
          chips={me.chips}
          gold={me.gold}
          discardsLeft={isDiscard ? me.discardsLeft : undefined}
          className="mb-1"
        />

        <div className="mt-1 flex justify-start">
          <OpponentArea
            character={getCharacter(opp.characterId)}
            cards={[]}
            cardCount={opp.hand.length || 5}
            chips={opp.chips}
            active={locked}
          />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <Pot amount={game.state!.pot || me.chips} />
          <BlackOverlayBox>
            {locked ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-300" />
                <span className="text-xs font-bold text-white">Elini oynadın — rakip bekleniyor...</span>
              </>
            ) : isDiscard ? (
              <>
                <span className="text-xs font-bold text-white">FAZ: Discard — istenmeyen kartları seçip at</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 text-amber-300" />
                <span className="text-xs font-bold text-white">FAZ: Kart Seç & Oyna (1–5 kart)</span>
              </>
            )}
          </BlackOverlayBox>

          {preview && (
            <div className="rounded-lg bg-black/50 px-3 py-1 ring-1 ring-amber-300/40">
              <span className="text-[11px] text-zinc-300">Seçili el: </span>
              <span className="text-xs font-black text-amber-200">{HAND_LABEL_TR[preview.handType]}</span>
              <span className="mx-1 text-zinc-500">·</span>
              <span className="text-xs font-black text-emerald-300">+{preview.total} Çip</span>
            </div>
          )}
        </div>

        <PlayerArea
          character={getCharacter(me.characterId)}
          cards={me.hand}
          selectedIds={me.selected}
          chips={me.chips}
          onToggle={game.toggleCard}
          disabled={locked}
          active={!locked}
        />

        <div className="mt-2 rounded-lg bg-black/25 px-2 py-1 ring-1 ring-white/10">
          <JokerRow jokers={me.jokers} />
        </div>

        <div className="mt-2 flex items-center justify-center gap-2">
          {locked ? (
            <WaitPill label="Rakibin elini oynaması bekleniyor..." />
          ) : isDiscard ? (
            <>
              <Button
                size="lg"
                variant="secondary"
                onClick={game.discardSelected}
                disabled={me.selected.length === 0 || me.discardsLeft <= 0}
                className="gap-2 bg-zinc-800 text-sky-200 hover:bg-zinc-700"
              >
                <Trash2 className="h-4 w-4" /> Kart At
                <span className="text-[10px] text-zinc-400">({me.discardsLeft} hak)</span>
              </Button>
              <Button
                size="lg"
                onClick={() => setRoundPhase("select-play")}
                className="gap-2 bg-gradient-to-b from-amber-400 to-amber-600 font-black text-zinc-950 hover:from-amber-300 hover:to-amber-500"
              >
                <Forward className="h-4 w-4" /> Devam → Oyna
              </Button>
            </>
          ) : (
            <Button
              size="lg"
              onClick={() => {
                game.playHand();
              }}
              disabled={!canPlay}
              className="gap-2 bg-gradient-to-b from-emerald-400 to-emerald-600 font-black text-zinc-950 hover:from-emerald-300 hover:to-emerald-500 disabled:opacity-40"
            >
              <Play className="h-5 w-5" /> Eli Oyna
              {me.selected.length > 0 && <span className="text-xs">({me.selected.length})</span>}
            </Button>
          )}
        </div>
      </div>
    </CasinoTable>
  );
}

// ===========================================================================
// Showdown
// ===========================================================================
function BreakdownCard({
  title,
  breakdown,
  cards,
  accent,
}: {
  title: string;
  breakdown: ScoreBreakdown | null;
  cards: PlayingCard[];
  accent: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 rounded-xl bg-black/30 p-3 ring-1 ring-white/10">
      <div className={cn("text-xs font-black uppercase tracking-wide", accent)}>{title}</div>
      <CardFan cards={cards} maxAngle={18} cardWidth="w-12 sm:w-16" overlapClass="-ml-6 sm:-ml-8" />
      {breakdown ? (
        <>
          <BlackOverlayBox className="text-amber-200">
            <span className="text-[11px] text-zinc-300">El:</span>
            <span className="text-xs font-black text-white">{HAND_LABEL_TR[breakdown.handType]}</span>
          </BlackOverlayBox>
          <div className="text-2xl font-black tabular-nums text-glow-gold text-amber-200">
            +{breakdown.total}
          </div>
          <ul className="casino-scroll max-h-24 w-full overflow-y-auto text-[10px] leading-snug text-zinc-300">
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

export function OnlineShowdownScreen({ game }: Props) {
  const me = game.me!;
  const opp = game.opp!;
  const playerWon = (me.breakdown?.total ?? 0) > (opp.breakdown?.total ?? 0);

  return (
    <CasinoTable>
      <div className="flex h-full flex-col px-3 py-3 sm:px-6 sm:py-4">
        <div className="mb-2 text-center">
          <h2 className="text-glow-gold text-xl font-black text-amber-200 sm:text-2xl">
            🃏 SHOWDOWN — Tur {game.state!.round}
          </h2>
          <p className="text-[11px] text-zinc-300">
            {playerWon ? "Bu eli sen kazandın!" : "Rakip bu eli önde götürdü."}
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-3 sm:flex-row">
          <BreakdownCard
            title={`${getCharacter(me.characterId)?.nameTr ?? "Sen"} (Sen)`}
            breakdown={me.breakdown}
            cards={me.playedCards}
            accent="text-amber-300"
          />
          <div className="flex items-center justify-center">
            <Trophy className={cn("h-8 w-8", playerWon ? "text-amber-300" : "text-zinc-500")} />
          </div>
          <BreakdownCard
            title={`${getCharacter(opp.characterId)?.nameTr ?? "Rakip"} (Rakip)`}
            breakdown={opp.breakdown}
            cards={opp.playedCards}
            accent="text-rose-300"
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <BlackOverlayBox className="text-amber-300">
            <span className="text-[11px] text-zinc-300">Senin toplam:</span>
            <span className="text-sm font-black text-white">{me.chips.toLocaleString("tr-TR")}</span>
          </BlackOverlayBox>
          <BlackOverlayBox className="text-rose-300">
            <span className="text-[11px] text-zinc-300">Rakip toplam:</span>
            <span className="text-sm font-black text-white">{opp.chips.toLocaleString("tr-TR")}</span>
          </BlackOverlayBox>
        </div>

        <div className="mt-3 flex justify-center">
          {me.ready ? (
            <WaitPill label="Rakip bekleniyor..." />
          ) : (
            <Button
              size="lg"
              onClick={() => game.setReady(true)}
              className="gap-2 bg-gradient-to-b from-amber-400 to-amber-600 font-black text-zinc-950 hover:from-amber-300 hover:to-amber-500"
            >
              Tur Sonu <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </CasinoTable>
  );
}

// ===========================================================================
// Match end
// ===========================================================================
export function OnlineMatchEndScreen({ game }: Props) {
  const router = useRouter();
  const me = game.me!;
  const opp = game.opp!;
  const winner = game.state!.matchWinner;

  const won =
    (winner === "player1" && game.side === "player1") ||
    (winner === "player2" && game.side === "player2");
  const tied = winner === "tie";

  return (
    <CasinoTable>
      <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-4 py-6 text-center">
        <div className="text-7xl sm:text-8xl">{won ? "🏆" : tied ? "🤝" : "💀"}</div>
        <h2
          className={cn(
            "mt-2 text-3xl font-black sm:text-5xl",
            won ? "text-emerald-400" : tied ? "text-yellow-400" : "text-red-400"
          )}
        >
          {won ? (
            <span className="flex items-center gap-3">
              KAZANDIN! <Crown className="h-8 w-8 text-amber-400" />
            </span>
          ) : tied ? (
            "BERABERE!"
          ) : (
            "KAYBETTİN!"
          )}
        </h2>

        <p className="mt-1 mb-4 text-xs text-zinc-300">
          {getCharacter(me.characterId)?.nameTr} 🆚 {getCharacter(opp.characterId)?.nameTr}
        </p>

        <div className="mb-5 flex w-full max-w-md flex-col gap-3">
          {[
            { label: `${getCharacter(me.characterId)?.nameTr ?? "Sen"} (Sen)`, chips: me.chips, win: won },
            { label: `${getCharacter(opp.characterId)?.nameTr ?? "Rakip"} (Rakip)`, chips: opp.chips, win: !won && !tied },
          ].map((row, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center justify-between rounded-xl px-4 py-3 ring-2",
                row.win
                  ? "bg-emerald-500/20 ring-emerald-400/60"
                  : "bg-black/30 ring-white/10"
              )}
            >
              <span className="flex items-center gap-2 text-sm font-bold text-white">
                {row.win ? <Trophy className="h-4 w-4 text-emerald-400" /> : <Skull className="h-4 w-4 text-zinc-500" />}
                {row.label}
              </span>
              <span className="text-xl font-black tabular-nums text-white">{row.chips.toLocaleString("tr-TR")}</span>
            </div>
          ))}
        </div>

        <Button
          size="lg"
          onClick={() => router.push("/")}
          className="gap-2 bg-gradient-to-b from-amber-400 to-amber-600 font-black text-zinc-950 hover:from-amber-300 hover:to-amber-500"
        >
          Lobiye Dön
        </Button>
      </div>
    </CasinoTable>
  );
}
