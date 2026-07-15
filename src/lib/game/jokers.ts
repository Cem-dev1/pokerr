// src/lib/game/jokers.ts
// ============================================================================
// 20 Mock Jokers (of a planned 100).
// Effects are implemented by id in `scoring.ts` and store hooks.
// ============================================================================
import type { Joker, Rarity } from "./types";
import { RARITY_PRICE_RANGE } from "./types";

function price(rarity: Rarity, n: number): number {
  const [min, max] = RARITY_PRICE_RANGE[rarity];
  return min + Math.round((max - min) * (n / 4));
}

// Yardımcı fonksiyon: 1-9 arası döngü sağlar
// Görseller public/joker1.jpg, public/joker2.jpg, ... public/joker9.jpg
const getIcon = (index: number) => `/joker${(index % 9) + 1}.jpg`;

export const JOKERS: Joker[] = [
  {
    id: "joker_mult_x2",
    name: "Wild Card",
    nameTr: "Vahşi Kart",
    rarity: "rare",
    price: price("rare", 2),
    icon: getIcon(0), 
    description: "Tüm Çip kazançları x2 ile çarpılır.",
    flavor: "Her şeyi ikiye katlar, risk dâhil.",
  },
  {
    id: "joker_flat_15",
    name: "Iron Chip",
    nameTr: "Demir Çip",
    rarity: "common",
    price: price("common", 1),
    icon: getIcon(1),
    description: "Oynanan her ele +15 Çip ekler.",
  },
  {
    id: "joker_flat_30",
    name: "Golden Stack",
    nameTr: "Altın Yığın",
    rarity: "rare",
    price: price("rare", 1),
    icon: getIcon(2),
    description: "Oynanan her ele +30 Çip ekler.",
  },
  {
    id: "joker_face_plus8",
    name: "Royal Favor",
    nameTr: "Kraliyet Lütfu",
    rarity: "common",
    price: price("common", 2),
    icon: getIcon(3),
    description: "Her resimli kart (J, Q, K) +8 Çip kazandırır.",
  },
  {
    id: "joker_ace_plus20",
    name: "Ace of Fortune",
    nameTr: "Şans Ası",
    rarity: "common",
    price: price("common", 3),
    icon: getIcon(4),
    description: "Her As kartı +20 Çip kazandırır.",
  },
  {
    id: "joker_pair_mult_x2",
    name: "Twin Power",
    nameTr: "İkiz Güç",
    rarity: "rare",
    price: price("rare", 3),
    icon: getIcon(5),
    description: "'Çift' elleri x2 Çip çarpanı alır.",
  },
  {
    id: "joker_flush_mult_x2",
    name: "Suit Master",
    nameTr: "Tür Ustası",
    rarity: "elite",
    price: price("elite", 1),
    icon: getIcon(6),
    description: "'Renk' (Flush) elleri x2 Çip çarpanı alır.",
  },
  {
    id: "joker_straight_mult_x2",
    name: "Runner",
    nameTr: "Koşucu",
    rarity: "elite",
    price: price("elite", 2),
    icon: getIcon(7),
    description: "'Sıra' (Straight) elleri x2 Çip çarpanı alır.",
  },
  {
    id: "joker_full_house_plus50",
    name: "House Winner",
    nameTr: "Ev Sahibi",
    rarity: "elite",
    price: price("elite", 3),
    icon: getIcon(8),
    description: "'Full' ellere +50 Çip ekler.",
  },
  {
    id: "joker_four_kind_x3",
    name: "Quad Force",
    nameTr: "Dörtlü Güç",
    rarity: "legendary",
    price: price("legendary", 1),
    icon: getIcon(0), // Döngü başa döner -> /joker1.jpg
    description: "'Dörtlü' elleri x3 Çip çarpanı alır.",
  },
  {
    id: "joker_no_pair_plus40",
    name: "High Roller",
    nameTr: "Yüksek Oyuncu",
    rarity: "common",
    price: price("common", 0),
    icon: getIcon(1), // /joker2.jpg
    description: "Eğer el 'Yüksek Kart' ise +40 Çip ekler.",
  },
  {
    id: "joker_each_card_plus4",
    name: "Crowd Pleaser",
    nameTr: "Kalp Çalıcı",
    rarity: "common",
    price: price("common", 4),
    icon: getIcon(2), // /joker3.jpg
    description: "Oynanan her kart için +4 Çip ekler.",
  },
  {
    id: "joker_heart_plus10",
    name: "Heart of Gold",
    nameTr: "Altın Kalp",
    rarity: "common",
    price: price("common", 1),
    icon: getIcon(3), // /joker4.jpg
    description: "Oynanan her Kupa kartı için +10 Çip ekler.",
  },
  {
    id: "joker_odd_mult_x15",
    name: "Odd Streak",
    nameTr: "Tek Sayı Serisi",
    rarity: "rare",
    price: price("rare", 0),
    icon: getIcon(4), // /joker5.jpg
    description: "Sadece tek rakamlı kartlardan oluşan ellere x1.5 çarpan.",
  },
  {
    id: "joker_even_mult_x15",
    name: "Even Flow",
    nameTr: "Çift Akış",
    rarity: "rare",
    price: price("rare", 0),
    icon: getIcon(5), // /joker6.jpg
    description: "Sadece çift rakamlı kartlardan oluşan ellere x1.5 çarpan.",
  },
  {
    id: "joker_low_pair_plus25",
    name: "Bargain Bin",
    nameTr: "Ucuzluk Sepeti",
    rarity: "common",
    price: price("common", 2),
    icon: getIcon(6), // /joker7.jpg
    description: "'Çift' ellerine +25 Çip ekler.",
  },
  {
    id: "joker_three_kind_plus35",
    name: "Triple Threat",
    nameTr: "Üçlü Tehdit",
    rarity: "rare",
    price: price("rare", 4),
    icon: getIcon(7), // /joker8.jpg
    description: "'Üçlü' ellerine +35 Çip ekler.",
  },
  {
    id: "joker_royal_x3",
    name: "Crown Jewel",
    nameTr: "Taç Mücevheri",
    rarity: "legendary",
    price: price("legendary", 2),
    icon: getIcon(8), // /joker9.jpg
    description: "'Royal Flush' elleri x3 Çip çarpanı alır.",
  },
  {
    id: "joker_gold_per_play",
    name: "Tip Jar",
    nameTr: "Bahşiş Kavanozu",
    rarity: "rare",
    price: price("rare", 1),
    icon: getIcon(0), // /joker1.jpg
    description: "Her oynanan elde +1 Altın kazanılır (dükkânda harcanır).",
  },
  {
    id: "joker_all_in_x25",
    name: "All In",
    nameTr: "Pusat",
    rarity: "legendary",
    price: price("legendary", 3),
    icon: getIcon(1), // /joker2.jpg
    description: "5 kartlık eller x2.5 Çip çarpanı alır.",
  },
];

export const JOKER_MAP: Record<string, Joker> = JOKERS.reduce(
  (acc, j) => {
    acc[j.id] = j;
    return acc;
  },
  {} as Record<string, Joker>,
);

export function getJoker(id: string): Joker | undefined {
  return JOKER_MAP[id];
}

// Random joker of a given rarity (for Aristocrat start + shop fill)
export function randomJokerByRarity(rarity: Rarity, rng: () => number = Math.random): Joker {
  const pool = JOKERS.filter((j) => j.rarity === rarity);
  return pool[Math.floor(rng() * pool.length)] ?? JOKERS[0];
}

export function randomJokers(n: number, rng: () => number = Math.random): Joker[] {
  const weights: Record<Rarity, number> = {
    common: 50,
    rare: 30,
    elite: 15,
    legendary: 5,
  };
  const pick = (): Joker => {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let r = rng() * total;
    for (const rarity of ["common", "rare", "elite", "legendary"] as Rarity[]) {
      r -= weights[rarity];
      if (r <= 0) {
        const pool = JOKERS.filter((j) => j.rarity === rarity);
        if (pool.length) return pool[Math.floor(rng() * pool.length)];
      }
    }
    return JOKERS[0];
  };
  const out: Joker[] = [];
  const used = new Set<string>();
  let guard = 0;
  while (out.length < n && guard < 200) {
    guard++;
    const j = pick();
    if (used.has(j.id)) continue;
    used.add(j.id);
    out.push(j);
  }
  return out;
}