// ============================================================================
// 52-card deck utilities
// ============================================================================
import type { PlayingCard, Rank, Suit } from "./types";

export const RANKS: Rank[] = [
  "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K",
];

export const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

// Short codes for ids
const SUIT_CODE: Record<Suit, string> = {
  hearts: "H",
  diamonds: "D",
  clubs: "C",
  spades: "S",
};

export function cardId(rank: Rank, suit: Suit): string {
  return `${rank}${SUIT_CODE[suit]}`;
}

export function buildDeck(): PlayingCard[] {
  const deck: PlayingCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: cardId(rank, suit), rank, suit });
    }
  }
  return deck;
}

// Fisher–Yates shuffle (returns new array)
export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function drawN(
  deck: PlayingCard[],
  n: number,
): { drawn: PlayingCard[]; remaining: PlayingCard[] } {
  return {
    drawn: deck.slice(0, n),
    remaining: deck.slice(n),
  };
}

// Chip value of a single card's rank (before modifiers)
export function rankBaseChips(rank: Rank): number {
  switch (rank) {
    case "A":
      return 11;
    case "J":
    case "Q":
    case "K":
      return 10;
    default:
      return parseInt(rank, 10);
  }
}

// Numeric ordering for straight detection (Ace high = 14)
export function rankOrder(rank: Rank): number {
  switch (rank) {
    case "A":
      return 14;
    case "K":
      return 13;
    case "Q":
      return 12;
    case "J":
      return 11;
    default:
      return parseInt(rank, 10);
  }
}
