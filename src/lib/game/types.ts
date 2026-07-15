// src/lib/game/types.ts
// ============================================================================
// Casino Poker Deck-Builder — Core Types
// ============================================================================

export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
// Turkish: Kupa(hearts♥) Karo(diamonds♦) Sinek(clubs♣) Maça(spades♠)

export type Rank =
  | "A" | "2" | "3" | "4" | "5" | "6" | "7"
  | "8" | "9" | "10" | "J" | "Q" | "K";

export interface PlayingCard {
  id: string; // unique instance id, e.g. "AH" or "AH-1"
  rank: Rank;
  suit: Suit;
}

// --- Suit helpers (Turkish labels) ------------------------------------------
export const SUIT_LABEL_TR: Record<Suit, string> = {
  hearts: "Kupa",
  diamonds: "Karo",
  clubs: "Sinek",
  spades: "Maça",
};

export const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

export const SUIT_COLOR: Record<Suit, "red" | "black"> = {
  hearts: "red",
  diamonds: "red",
  clubs: "black",
  spades: "black",
};

// --- Poker hand classification ----------------------------------------------
export type HandType =
  | "HighCard"
  | "Pair"
  | "TwoPair"
  | "ThreeOfAKind"
  | "Straight"
  | "Flush"
  | "FullHouse"
  | "FourOfAKind"
  | "StraightFlush"
  | "RoyalFlush";

export const HAND_LABEL_TR: Record<HandType, string> = {
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

// Base chip value awarded for making the hand type (before card values & mods)
export const HAND_BASE_CHIPS: Record<HandType, number> = {
  HighCard: 5,
  Pair: 10,
  TwoPair: 20,
  ThreeOfAKind: 30,
  Straight: 40,
  Flush: 50,
  FullHouse: 60,
  FourOfAKind: 80,
  StraightFlush: 100,
  RoyalFlush: 150,
};

// --- Rarities ----------------------------------------------------------------
export type Rarity = "common" | "rare" | "elite" | "legendary";

export const RARITY_LABEL_TR: Record<Rarity, string> = {
  common: "Yaygın",
  rare: "Nadir",
  elite: "Seçkin",
  legendary: "Efsane",
};

export const RARITY_PRICE_RANGE: Record<Rarity, [number, number]> = {
  common: [3, 5],
  rare: [6, 9],
  elite: [10, 13],
  legendary: [14, 18],
};

export const RARITY_RING: Record<Rarity, string> = {
  common: "ring-slate-400/70",
  rare: "ring-sky-400/80",
  elite: "ring-fuchsia-400/80",
  legendary: "ring-amber-400/90",
};

export const RARITY_TEXT: Record<Rarity, string> = {
  common: "text-slate-300",
  rare: "text-sky-300",
  elite: "text-fuchsia-300",
  legendary: "text-amber-300",
};

export const RARITY_GLOW: Record<Rarity, string> = {
  common: "shadow-[0_0_10px_rgba(148,163,184,0.35)]",
  rare: "shadow-[0_0_14px_rgba(56,189,248,0.45)]",
  elite: "shadow-[0_0_16px_rgba(232,121,249,0.5)]",
  legendary: "shadow-[0_0_20px_rgba(251,191,36,0.6)]",
};

// --- Joker effect model ------------------------------------------------------
// Jokers are evaluated by id in the scoring engine for full control.
export interface Joker {
  id: string;
  name: string;
  nameTr: string;
  rarity: Rarity;
  price: number;
  icon: string; // görsel dosya adı
  description: string;
  flavor?: string;
}

// --- Characters --------------------------------------------------------------
export type CharacterId =
  | "gambler" | "merchant" | "warrior" | "lucky" | "illusionist"
  | "banker" | "mechanic" | "alchemist" | "aristocrat" | "saboteur";

export interface CharacterAbility {
  title: string;
  description: string;
}

export interface Character {
  id: CharacterId;
  name: string;
  nameTr: string;
  title: string;       // Turkish archetype label
  emoji: string;
  color: string;       // tailwind gradient classes for avatar
  image: string;       // görsel dosya yolu (public/ altındaki dosya)
  abilities: [CharacterAbility, CharacterAbility];
}

// --- Game phases -------------------------------------------------------------
export type GamePhase =
  | "lobby"
  | "character-select"
  | "shop"
  | "game"
  | "showdown"
  | "round-end"
  | "match-end";

export type RoundPhase =
  | "discard"      // player may discard cards
  | "select-play"; // player selects & plays a hand

// --- Scoring result ----------------------------------------------------------
export interface ScoreBreakdown {
  handType: HandType;
  baseChips: number;
  cardChips: number;
  flatBonuses: number;       // summed flat adds (character + jokers)
  mult: number;              // product of multipliers
  total: number;             // final chips awarded
  notes: string[];           // human-readable modifier log
}

// --- Player state ------------------------------------------------------------
export interface PlayerState {
  chips: number;
  gold: number;
  character: CharacterId | null;
  jokers: Joker[];
  hand: PlayingCard[];        // cards in hand (after draw)
  selected: string[];         // selected card ids
  discardsLeft: number;
  handPlayedCount: number;    // hands played this round
}

// --- AI opponent (simplified mirror) ----------------------------------------
export interface OpponentState {
  chips: number;
  character: CharacterId;
  jokers: Joker[];
  cardCount: number;          // face-down card count for display
  lastHandType: HandType | null;
  lastGain: number;
}