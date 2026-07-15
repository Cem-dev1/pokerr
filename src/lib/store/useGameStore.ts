// src/lib/store/useGameStore.ts
// ============================================================================
// Zustand game store — chips, gold, phases, modifiers, AI opponent
// ============================================================================
import { create } from "zustand";
import type {
  CharacterId,
  GamePhase,
  HandType,
  Joker,
  OpponentState,
  PlayingCard,
  PlayerState,
  RoundPhase,
  ScoreBreakdown,
} from "@/lib/game/types";
import { CHARACTERS } from "@/lib/game/characters";
import { JOKERS, randomJokerByRarity, randomJokers } from "@/lib/game/jokers";
import { buildDeck, drawN, shuffle } from "@/lib/game/deck";
import { scoreHand } from "@/lib/game/scoring";

// --- Tunables ----------------------------------------------------------------
export const TOTAL_ROUNDS = 3;
export const HAND_SIZE = 8;
export const MAX_SELECT = 5;
const BASE_DISCARDS = 3;
const GOLD_PER_ROUND = 15;
const REROLL_COST = 2;

export interface GameState {
  phase: GamePhase;
  round: number; // 1..TOTAL_ROUNDS
  roundPhase: RoundPhase;
  player: PlayerState;
  opponent: OpponentState;
  deck: PlayingCard[]; // remaining draw deck this round
  shopItems: Joker[];
  pot: number; // chips visualised in the centre pot
  log: string[];
  lastBreakdown: ScoreBreakdown | null;
  opponentLastBreakdown: ScoreBreakdown | null;
  opponentHand: PlayingCard[]; // revealed at showdown
  playerPlayedCards: PlayingCard[]; // cards the player last played
  matchWinner: "player" | "opponent" | "tie" | null;
  illAppliedThisRound: boolean;
  earnedThisMatch: number;
  bankerHundredsGranted: number;

  // actions
  startMatch: () => void;
  selectCharacter: (id: CharacterId) => void;
  confirmCharacter: () => void;
  rerollShop: () => void;
  buyJoker: (jokerId: string) => void;
  finishShop: () => void;
  toggleSelectCard: (cardId: string) => void;
  discardSelected: () => void;
  proceedToPlay: () => void;
  playHand: () => void;
  goToShowdown: () => void;
  finishRound: () => void;
  nextRoundOrMatch: () => void;
  reset: () => void;
  enterRound: (round: number) => void; // internal-ish
}

// --- pure helpers ------------------------------------------------------------
function freshPlayer(): PlayerState {
  return {
    chips: 0,
    gold: 0,
    character: null,
    jokers: [],
    hand: [],
    selected: [],
    discardsLeft: BASE_DISCARDS,
    handPlayedCount: 0,
  };
}

function baseDiscardsFor(character: CharacterId | null): number {
  let d = BASE_DISCARDS;
  if (character === "gambler") d += 1;
  if (character === "mechanic") d -= 1;
  return Math.max(0, d);
}

function rerollCostFor(character: CharacterId | null): number {
  if (character === "aristocrat") return 1;
  return REROLL_COST;
}

export function shopPriceFor(joker: Joker, character: CharacterId | null): number {
  let p = joker.price;
  if (character === "merchant") p -= 2;
  return Math.max(1, p);
}

function luckyFreeReroll(): boolean {
  return Math.random() < 0.2;
}

function charName(id: CharacterId): string {
  return CHARACTERS.find((c) => c.id === id)?.nameTr ?? id;
}

function pickOpponentCharacter(avoid: CharacterId | null): CharacterId {
  const pool = CHARACTERS.filter((c) => c.id !== avoid).map((c) => c.id);
  return pool[Math.floor(Math.random() * pool.length)]!;
}

// generate a capped number of k-card index combinations
function pickSubsets(cards: PlayingCard[], k: number): PlayingCard[][] {
  const out: PlayingCard[][] = [];
  const n = cards.length;
  const combo: number[] = [];
  const limit = 40;
  function rec(start: number) {
    if (out.length >= limit) return;
    if (combo.length === k) {
      out.push(combo.map((i) => cards[i]!));
      return;
    }
    for (let i = start; i < n; i++) {
      combo.push(i);
      rec(i + 1);
      combo.pop();
    }
  }
  rec(0);
  return out;
}

// AI: pick the best-scoring 5-card hand from a freshly shuffled deal
function aiPlayHand(
  character: CharacterId,
  jokers: Joker[],
): { hand: PlayingCard[]; breakdown: ScoreBreakdown } {
  const deck = shuffle(buildDeck());
  const { drawn } = drawN(deck, 8);
  let best: { hand: PlayingCard[]; breakdown: ScoreBreakdown } | null = null;
  for (const sub of pickSubsets(drawn, 5)) {
    const b = scoreHand(sub, character, jokers);
    if (!best || b.total > best.breakdown.total) {
      best = { hand: sub, breakdown: b };
    }
  }
  if (!best) {
    const fallback = drawn.slice(0, 5);
    return { hand: fallback, breakdown: scoreHand(fallback, character, jokers) };
  }
  return best;
}

// --- initial opponent --------------------------------------------------------
const initialOpponent: OpponentState = {
  chips: 0,
  character: "gambler",
  jokers: [],
  cardCount: 5,
  lastHandType: null,
  lastGain: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  phase: "lobby",
  round: 1,
  roundPhase: "discard",
  player: freshPlayer(),
  opponent: initialOpponent,
  deck: [],
  shopItems: [],
  pot: 0,
  log: [],
  lastBreakdown: null,
  opponentLastBreakdown: null,
  opponentHand: [],
  playerPlayedCards: [],
  matchWinner: null,
  illAppliedThisRound: false,
  earnedThisMatch: 0,
  bankerHundredsGranted: 0,

  selectCharacter: (id) => {
    set((s) => ({ player: { ...s.player, character: id } }));
  },

  confirmCharacter: () => {
    const { player } = get();
    const id = player.character;
    if (!id) return;
    
    // Karakter onaylandı, lobiye geç
    set((s) => ({
      phase: "lobby",
      log: [...s.log, `Karakter: ${charName(id)} seçildi.`],
    }));
  },

  startMatch: () => {
    const { player } = get();
    const id = player.character;
    
    if (!id) {
      set({ log: ["Önce bir karakter seç!"] });
      return;
    }

    let gold = 0;
    if (id === "merchant") gold += 10;

    let jokers: Joker[] = [];
    if (id === "aristocrat") {
      jokers = [randomJokerByRarity("rare")];
    }

    const oppChar = pickOpponentCharacter(id);
    const opponent: OpponentState = { ...initialOpponent, character: oppChar };

    set((s) => ({
      phase: "shop",
      round: 1,
      roundPhase: "discard",
      player: { ...s.player, gold, jokers },
      opponent,
      deck: [],
      shopItems: [],
      pot: 0,
      log: [
        `Rakip: ${charName(oppChar)}.`,
        "Maç başlıyor!",
      ],
      lastBreakdown: null,
      opponentLastBreakdown: null,
      opponentHand: [],
      playerPlayedCards: [],
      matchWinner: null,
      illAppliedThisRound: false,
      earnedThisMatch: 0,
      bankerHundredsGranted: 0,
    }));
    get().enterRound(1);
  },

  enterRound: (round) => {
    const { player, opponent } = get();
    const id = player.character;

    let gold = player.gold + GOLD_PER_ROUND;
    if (id === "lucky") gold += 5;

    const shopItems = randomJokers(5);

    let deck = shuffle(buildDeck());
    const { drawn, remaining } = drawN(deck, HAND_SIZE);
    deck = remaining;

    let hand = drawn;
    let illApplied = false;
    if (id === "illusionist") {
      const idx = hand.findIndex((c) => c.suit !== "clubs");
      if (idx >= 0) {
        hand = hand.map((c, i) =>
          i === idx ? { ...c, suit: "clubs" as const } : c,
        );
        illApplied = true;
      }
    }

    set((s) => ({
      round,
      phase: "shop",
      roundPhase: "discard",
      player: {
        ...s.player,
        gold,
        hand,
        selected: [],
        discardsLeft: baseDiscardsFor(id),
        handPlayedCount: 0,
      },
      opponent: { ...opponent, cardCount: 5, lastHandType: null, lastGain: 0 },
      deck,
      shopItems,
      pot: 0,
      lastBreakdown: null,
      opponentLastBreakdown: null,
      opponentHand: [],
      playerPlayedCards: [],
      illAppliedThisRound: illApplied,
      log: [
        ...s.log,
        `— Tur ${round} —`,
        ...(illApplied ? ["İllüzyonist: 1 kart Sinek'e dönüştü."] : []),
      ],
    }));
  },

  rerollShop: () => {
    const { player } = get();
    const id = player.character;
    const cost = rerollCostFor(id);
    const free = id === "lucky" && luckyFreeReroll();
    if (!free && player.gold < cost) {
      set((s) => ({ log: [...s.log, "Yetersiz Altın (reroll)."] }));
      return;
    }
    set((s) => ({
      shopItems: randomJokers(5),
      player: {
        ...s.player,
        gold: free ? s.player.gold : s.player.gold - cost,
      },
      log: [
        ...s.log,
        free ? "Şanslı Leydi: Bedava reroll!" : `Reroll (-${cost} Altın)`,
      ],
    }));
  },

  buyJoker: (jokerId) => {
    const { player, shopItems } = get();
    const joker = shopItems.find((j) => j.id === jokerId);
    if (!joker) return;
    if (player.jokers.some((j) => j.id === jokerId)) {
      set((s) => ({ log: [...s.log, "Bu Joker'e zaten sahipsin."] }));
      return;
    }
    const price = shopPriceFor(joker, player.character);
    if (player.gold < price) {
      set((s) => ({ log: [...s.log, "Yetersiz Altın."] }));
      return;
    }
    set((s) => ({
      player: {
        ...s.player,
        gold: s.player.gold - price,
        jokers: [...s.player.jokers, joker],
      },
      shopItems: s.shopItems.filter((j) => j.id !== jokerId),
      log: [...s.log, `${joker.nameTr} satın alındı (-${price} Altın).`],
    }));
  },

  finishShop: () => {
    set((s) => ({
      phase: "game",
      roundPhase: "discard",
      player: { ...s.player, selected: [] },
    }));
  },

  toggleSelectCard: (cardId) => {
    set((s) => {
      const sel = s.player.selected;
      let next: string[];
      if (sel.includes(cardId)) {
        next = sel.filter((id) => id !== cardId);
      } else if (sel.length < MAX_SELECT) {
        next = [...sel, cardId];
      } else {
        return s;
      }
      return { player: { ...s.player, selected: next } };
    });
  },

  discardSelected: () => {
    const { player, deck } = get();
    if (player.selected.length === 0) {
      set((s) => ({ log: [...s.log, "Önce kart seç."] }));
      return;
    }
    if (player.discardsLeft <= 0) {
      set((s) => ({ log: [...s.log, "Discard hakkın kalmadı."] }));
      return;
    }
    const sel = new Set(player.selected);
    const kept = player.hand.filter((c) => !sel.has(c.id));
    const need = player.selected.length;
    const { drawn, remaining } = drawN(deck, need);
    const newHand = [...kept, ...drawn];
    set((s) => ({
      player: {
        ...s.player,
        hand: newHand,
        selected: [],
        discardsLeft: s.player.discardsLeft - 1,
      },
      deck: remaining,
      log: [...s.log, `${need} kart atıldı, yenileri çekildi.`],
    }));
  },

  proceedToPlay: () => {
    set((s) => ({
      roundPhase: "select-play",
      player: { ...s.player, selected: [] },
    }));
  },

  playHand: () => {
    const { player } = get();
    if (player.selected.length === 0) return;

    const played = player.hand.filter((c) => player.selected.includes(c.id));
    const breakdown = scoreHand(played, player.character, player.jokers);

    const newEarned = get().earnedThisMatch + breakdown.total;
    const newHundreds = Math.floor(newEarned / 100);
    let goldBonus = 0;
    if (player.character === "banker" && newHundreds > get().bankerHundredsGranted) {
      goldBonus = newHundreds - get().bankerHundredsGranted;
    }
    const tipJar = player.jokers.some((j) => j.id === "joker_gold_per_play") ? 1 : 0;

    set((s) => ({
      player: {
        ...s.player,
        chips: s.player.chips + breakdown.total,
        gold: s.player.gold + goldBonus + tipJar,
        selected: [],
        handPlayedCount: s.player.handPlayedCount + 1,
      },
      pot: breakdown.total,
      lastBreakdown: breakdown,
      playerPlayedCards: played,
      earnedThisMatch: newEarned,
      bankerHundredsGranted: Math.max(s.bankerHundredsGranted, newHundreds),
      log: [
        ...s.log,
        `El oynandı: ${breakdown.handType} → +${breakdown.total} Çip.`,
        ...(goldBonus > 0
          ? [`Bankacı: ${goldBonus} Altın faizi (+${breakdown.total} Çip).`]
          : []),
        ...(tipJar > 0 ? [`Bahşiş Kavanozu: +${tipJar} Altın.`] : []),
      ],
    }));

    const { opponent } = get();
    const { hand, breakdown: oppB } = aiPlayHand(
      opponent.character,
      opponent.jokers,
    );
    let gain = oppB.total;
    let saboteurNote = "";
    if (player.character === "saboteur") {
      gain = Math.max(0, gain - 15);
      saboteurNote = "Sabotajcı: rakipten -15 Çip silindi.";
    }
    set((s) => ({
      opponent: {
        ...s.opponent,
        chips: s.opponent.chips + gain,
        lastHandType: oppB.handType,
        lastGain: gain,
      },
      opponentHand: hand,
      opponentLastBreakdown: { ...oppB, total: gain },
      log: [
        ...s.log,
        `Rakip eli: ${oppB.handType} → +${gain} Çip.`,
        ...(saboteurNote ? [saboteurNote] : []),
      ],
    }));
  },

  goToShowdown: () => {
    set({ phase: "showdown" });
  },

  finishRound: () => {
    const { player } = get();
    let chipsBonus = 0;
    const notes: string[] = [];
    if (player.character === "banker") {
      const interest = Math.floor(player.gold / 5) * 10;
      if (interest > 0) {
        chipsBonus += interest;
        notes.push(`Bankacı: ${interest} Çip faiz.`);
      }
    }
    set((s) => ({
      player: { ...s.player, chips: s.player.chips + chipsBonus },
      log: [...s.log, ...notes],
      phase: "round-end",
    }));
  },

  nextRoundOrMatch: () => {
    const { round, player, opponent } = get();
    if (round >= TOTAL_ROUNDS) {
      let winner: "player" | "opponent" | "tie" = "tie";
      if (player.chips > opponent.chips) winner = "player";
      else if (opponent.chips > player.chips) winner = "opponent";
      set((s) => ({
        phase: "match-end",
        matchWinner: winner,
        log: [
          ...s.log,
          winner === "tie"
            ? "Maç berabere!"
            : winner === "player"
              ? "Maçı KAZANDIN!"
              : "Maçı kaybettin.",
        ],
      }));
    } else {
      get().enterRound(round + 1);
    }
  },

  reset: () => {
    set({
      phase: "lobby",
      round: 1,
      roundPhase: "discard",
      player: freshPlayer(),
      opponent: { ...initialOpponent },
      deck: [],
      shopItems: [],
      pot: 0,
      log: [],
      lastBreakdown: null,
      opponentLastBreakdown: null,
      opponentHand: [],
      playerPlayedCards: [],
      matchWinner: null,
      illAppliedThisRound: false,
      earnedThisMatch: 0,
      bankerHundredsGranted: 0,
    });
  },
}));

// re-exports for UI convenience
export { JOKERS };
export function handTypeLabel(t: HandType): string {
  const map: Record<HandType, string> = {
    HighCard: "Yüksek Kart",
    Pair: "Çift",
    TwoPair: "İki Çift",
    ThreeOfAKind: "Üçlü",
    Straight: "Sıra",
    Flush: "Renk",
    FullHouse: "Full",
    FourOfAKind: "Dörtlü",
    StraightFlush: "Sıralı Renk",
    RoyalFlush: "Royal Flush",
  };
  return map[t];
}