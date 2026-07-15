// ============================================================================
// Poker hand classification (Balatro-style tolerant of <5 cards)
// ============================================================================
import type { HandType, PlayingCard, Rank } from "./types";
import { HAND_LABEL_TR } from "./types";
import { rankOrder } from "./deck";

/**
 * Classify a set of 1-5 cards into the best poker hand type they form.
 *
 * For fewer than 5 cards, classify among what is present:
 *   - 1 card                       -> HighCard
 *   - 2 cards same rank            -> Pair
 *   - 2 cards diff rank            -> HighCard
 *   - 3 cards same rank            -> ThreeOfAKind
 *   - 3 cards with a pair          -> Pair
 *   - 4 cards: FourOfAKind / ThreeOfAKind / TwoPair / Pair / HighCard
 *
 * Straight requires exactly 5 distinct consecutive ranks. Ace can be low
 * (A-2-3-4-5, treated as 5-high) or high (10-J-Q-K-A).
 * Flush requires exactly 5 cards of the same suit.
 * RoyalFlush = StraightFlush with high card Ace (must contain 10,J,Q,K,A).
 */
export function classifyHand(cards: PlayingCard[]): HandType {
  if (cards.length === 0) return "HighCard";

  // Rank frequency map
  const counts = new Map<Rank, number>();
  for (const c of cards) {
    counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1);
  }
  const freqs = Array.from(counts.values()).sort((a, b) => b - a);
  const countOf = (k: number): number => freqs.filter((f) => f === k).length;
  const hasAtLeast = (k: number): boolean => freqs.some((f) => f >= k);

  const isFive = cards.length === 5;

  // Flush: exactly 5 cards, all same suit
  const isFlush = isFive && cards.every((c) => c.suit === cards[0].suit);

  // Straight: exactly 5 distinct consecutive ranks (handle Ace low & high)
  let isStraight = false;
  let straightHigh = 0;
  if (isFive && counts.size === 5) {
    const ord = Array.from(counts.keys())
      .map(rankOrder)
      .sort((a, b) => a - b);
    let consecutive = true;
    for (let i = 1; i < ord.length; i++) {
      if (ord[i] - ord[i - 1] !== 1) {
        consecutive = false;
        break;
      }
    }
    if (consecutive) {
      isStraight = true;
      straightHigh = ord[ord.length - 1];
    } else {
      // Wheel: A,2,3,4,5  ->  ord sorted = [2,3,4,5,14]
      if (
        ord[0] === 2 &&
        ord[1] === 3 &&
        ord[2] === 4 &&
        ord[3] === 5 &&
        ord[4] === 14
      ) {
        isStraight = true;
        straightHigh = 5;
      }
    }
  }

  // Royal / straight flush
  if (isStraight && isFlush) {
    const rankSet = new Set(counts.keys());
    const isRoyal =
      rankSet.has("A") &&
      rankSet.has("K") &&
      rankSet.has("Q") &&
      rankSet.has("J") &&
      rankSet.has("10");
    if (isRoyal && straightHigh === 14) return "RoyalFlush";
    return "StraightFlush";
  }

  if (hasAtLeast(4)) return "FourOfAKind";
  if (countOf(3) >= 1 && countOf(2) >= 1) return "FullHouse";
  if (isFlush) return "Flush";
  if (isStraight) return "Straight";
  if (hasAtLeast(3)) return "ThreeOfAKind";
  if (countOf(2) >= 2) return "TwoPair";
  if (countOf(2) === 1) return "Pair";
  return "HighCard";
}

/**
 * Human-readable summary of the best poker hand formed by `cards`.
 */
export function describeHand(cards: PlayingCard[]): {
  type: HandType;
  label: string;
} {
  const type = classifyHand(cards);
  return { type, label: HAND_LABEL_TR[type] };
}
