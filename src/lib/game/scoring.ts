// ============================================================================
// Scoring engine — combines poker hand type, character abilities, and jokers
// ============================================================================
import type {
  CharacterId,
  HandType,
  Joker,
  PlayingCard,
  Rank,
  ScoreBreakdown,
  Suit,
} from "./types";
import { HAND_BASE_CHIPS, HAND_LABEL_TR } from "./types";
import { classifyHand } from "./poker";
import { rankBaseChips, rankOrder } from "./deck";

// Rank buckets used by various jokers
const FACE_RANKS: Set<Rank> = new Set<Rank>(["J", "Q", "K"] as Rank[]);
const MECHANIC_BUMP_RANKS: Set<Rank> = new Set<Rank>(["2", "3", "4"] as Rank[]);
const ODD_RANKS: Set<Rank> = new Set<Rank>(["3", "5", "7", "9"] as Rank[]);
const EVEN_RANKS: Set<Rank> = new Set<Rank>(
  ["2", "4", "6", "8", "10"] as Rank[],
);

// Helper: count cards whose rank matches a predicate
function countRanks(played: PlayingCard[], set: Set<Rank>): number {
  return played.reduce((n, c) => (set.has(c.rank) ? n + 1 : n), 0);
}

// Helper: are ALL played cards' ranks inside the given set?
function allRanksIn(played: PlayingCard[], set: Set<Rank>): boolean {
  return played.length > 0 && played.every((c) => set.has(c.rank));
}

/**
 * Score a played hand for a given character + owned jokers.
 *
 * Algorithm:
 *   1. Apply character card-transforms (alchemist spades→hearts).
 *   2. classifyHand on the transformed cards.
 *   3. baseChips = HAND_BASE_CHIPS[handType].
 *   4. cardChips = sum of rankBaseChips (mechanic bumps 2/3/4 → 10).
 *   5. flatBonuses = sum of additive character + joker bonuses.
 *   6. mult = product of multiplicative character + joker bonuses.
 *   7. total = round((baseChips + cardChips + flatBonuses) * mult).
 */
export function scoreHand(
  played: PlayingCard[],
  characterId: CharacterId | null,
  jokers: Joker[],
): ScoreBreakdown {
  // Edge case: nothing played
  if (played.length === 0) {
    return {
      handType: "HighCard",
      baseChips: 0,
      cardChips: 0,
      flatBonuses: 0,
      mult: 0,
      total: 0,
      notes: ["Geçersiz el"],
    };
  }

  const notes: string[] = [];
  const owned = new Set(jokers.map((j) => j.id));

  // --- Step A: effective cards (alchemist turns spades into hearts) ----------
  const effectiveCards: PlayingCard[] = played.map((c) =>
    characterId === "alchemist" && c.suit === "spades"
      ? { ...c, suit: "hearts" as Suit }
      : c,
  );

  // --- Step B: classify -----------------------------------------------------
  const handType: HandType = classifyHand(effectiveCards);
  notes.push(`El: ${HAND_LABEL_TR[handType]}`);

  // --- Step C: base chips ---------------------------------------------------
  const baseChips = HAND_BASE_CHIPS[handType];

  // --- Step D: card chips ---------------------------------------------------
  let cardChips = 0;
  for (const c of played) {
    let v = rankBaseChips(c.rank);
    if (characterId === "mechanic" && MECHANIC_BUMP_RANKS.has(c.rank)) {
      v = 10;
    }
    cardChips += v;
  }

  // --- Step E: flat bonuses -------------------------------------------------
  let flatBonuses = 0;

  // Character flat bonuses
  if (characterId === "warrior") {
    flatBonuses += 15;
    notes.push("Savaşçı: her ele +15 Çip");
    const faceCount = countRanks(played, FACE_RANKS);
    if (faceCount > 0) {
      flatBonuses += 5 * faceCount;
      notes.push(`Savaşçı: resimli kart +5 x${faceCount}`);
    }
  }
  if (characterId === "illusionist" && handType === "TwoPair") {
    flatBonuses += 20;
    notes.push("İllüzyonist: İki Çift +20");
  }

  // Joker flat bonuses
  if (owned.has("joker_flat_15")) {
    flatBonuses += 15;
    notes.push("Demir Çip +15");
  }
  if (owned.has("joker_flat_30")) {
    flatBonuses += 30;
    notes.push("Altın Yığın +30");
  }
  if (owned.has("joker_face_plus8")) {
    const n = countRanks(played, FACE_RANKS);
    if (n > 0) {
      flatBonuses += 8 * n;
      notes.push(`Kraliyet Lütfu: resimli kart +8 x${n}`);
    }
  }
  if (owned.has("joker_ace_plus20")) {
    const n = played.filter((c) => c.rank === "A").length;
    if (n > 0) {
      flatBonuses += 20 * n;
      notes.push(`Şans Ası: As +20 x${n}`);
    }
  }
  if (owned.has("joker_full_house_plus50") && handType === "FullHouse") {
    flatBonuses += 50;
    notes.push("Ev Sahibi: Full +50");
  }
  if (owned.has("joker_no_pair_plus40") && handType === "HighCard") {
    flatBonuses += 40;
    notes.push("Yüksek Oyuncu: Yüksek Kart +40");
  }
  if (owned.has("joker_each_card_plus4")) {
    const n = played.length;
    flatBonuses += 4 * n;
    notes.push(`Kalp Çalıcı: her kart +4 x${n}`);
  }
  if (owned.has("joker_heart_plus10")) {
    const n = effectiveCards.filter((c) => c.suit === "hearts").length;
    if (n > 0) {
      flatBonuses += 10 * n;
      notes.push(`Altın Kalp: Kupa +10 x${n}`);
    }
  }
  if (owned.has("joker_low_pair_plus25") && handType === "Pair") {
    flatBonuses += 25;
    notes.push("Ucuzluk Sepeti: Çift +25");
  }
  if (owned.has("joker_three_kind_plus35") && handType === "ThreeOfAKind") {
    flatBonuses += 35;
    notes.push("Üçlü Tehdit: Üçlü +35");
  }

  // --- Step F: multipliers --------------------------------------------------
  let mult = 1;

  // Character multipliers
  if (characterId === "gambler" && handType === "Flush") {
    mult *= 1.5;
    notes.push("Kumarbaz: Renk x1.5");
  }
  if (characterId === "alchemist") {
    const hasHearts = effectiveCards.some((c) => c.suit === "hearts");
    if (hasHearts) {
      mult *= 1.5;
      notes.push("Simyacı: Kupa x1.5");
    }
  }

  // Joker multipliers
  if (owned.has("joker_mult_x2")) {
    mult *= 2;
    notes.push("Vahşi Kart x2");
  }
  if (owned.has("joker_pair_mult_x2") && handType === "Pair") {
    mult *= 2;
    notes.push("İkiz Güç: Çift x2");
  }
  if (owned.has("joker_flush_mult_x2") && handType === "Flush") {
    mult *= 2;
    notes.push("Tür Ustası: Renk x2");
  }
  if (owned.has("joker_straight_mult_x2") && handType === "Straight") {
    mult *= 2;
    notes.push("Koşucu: Sıra x2");
  }
  if (owned.has("joker_four_kind_x3") && handType === "FourOfAKind") {
    mult *= 3;
    notes.push("Dörtlü Güç: Dörtlü x3");
  }
  if (
    owned.has("joker_odd_mult_x15") &&
    played.length >= 2 &&
    allRanksIn(played, ODD_RANKS)
  ) {
    mult *= 1.5;
    notes.push("Tek Sayı x1.5");
  }
  if (
    owned.has("joker_even_mult_x15") &&
    played.length >= 2 &&
    allRanksIn(played, EVEN_RANKS)
  ) {
    mult *= 1.5;
    notes.push("Çift Akış x1.5");
  }
  if (owned.has("joker_royal_x3") && handType === "RoyalFlush") {
    mult *= 3;
    notes.push("Taç Mücevheri: Royal Flush x3");
  }
  if (owned.has("joker_all_in_x25") && played.length === 5) {
    mult *= 2.5;
    notes.push("Pusat x2.5");
  }

  // --- Step G: total --------------------------------------------------------
  const total = Math.round((baseChips + cardChips + flatBonuses) * mult);

  return {
    handType,
    baseChips,
    cardChips,
    flatBonuses,
    mult,
    total,
    notes,
  };
}
