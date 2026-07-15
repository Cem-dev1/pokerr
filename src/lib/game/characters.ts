// src/lib/game/characters.ts
// ============================================================================
// 10 Characters — each with 2 abilities (per spec)
// ============================================================================
import type { Character, CharacterId } from "./types";

export const CHARACTERS: Character[] = [
  {
    id: "gambler",
    name: "Gambler",
    nameTr: "Kumarbaz",
    title: "Kumarbaz",
    emoji: "🎰",
    color: "from-rose-500 to-red-700",
    image: "/c1.png",
    abilities: [
      { title: "Ekstra Discard", description: "Her tur +1 ekstra Discard hakkı." },
      { title: "Renk Ustası", description: "'Renk' (Flush) elleri x1.5 daha fazla Çip verir." },
    ],
  },
  {
    id: "merchant",
    name: "Merchant",
    nameTr: "Tüccar",
    title: "Tüccar",
    emoji: "💰",
    color: "from-amber-400 to-yellow-600",
    image: "/c2.avif",
    abilities: [
      { title: "Joker İndirimi", description: "Dükkândaki tüm Jokerler -2 Altın indirimlidir." },
      { title: "Başlangıç Altını", description: "Oyuna +10 Altın ile başlar." },
    ],
  },
  {
    id: "warrior",
    name: "Warrior",
    nameTr: "Savaşçı",
    title: "Savaşçı",
    emoji: "⚔️",
    color: "from-orange-500 to-red-800",
    image: "/c3.jpg",
    abilities: [
      { title: "Savaş Çipsi", description: "Oynanan her ele kalıcı +15 Çip eklenir." },
      { title: "Resimli Kart", description: "Resimli kartlar (J, Q, K) +5 Çip kazandırır." },
    ],
  },
  {
    id: "lucky",
    name: "Lucky Lady",
    nameTr: "Şanslı Leydi",
    title: "Şanslı Leydi",
    emoji: "🍀",
    color: "from-emerald-400 to-green-600",
    image: "/c4.jpg",
    abilities: [
      { title: "Şanslı Altın", description: "Her dükkân fazında ekstra +5 Altın kazanır." },
      { title: "Bedava Reroll", description: "Dükkân yenileme (Reroll) %20 ihtimalle 0 Altın (Bedava) olur." },
    ],
  },
  {
    id: "illusionist",
    name: "Illusionist",
    nameTr: "İllüzyonist",
    title: "İllüzyonist",
    emoji: "🎩",
    color: "from-violet-500 to-purple-700",
    image: "/c5.webp",
    abilities: [
      { title: "Sinek Büyüsü", description: "Her tur elindeki 1 kartın türünü kalıcı olarak 'Sinek' yapar." },
      { title: "İki Çift Bonusu", description: "'İki Çift' elleri +20 Çip verir." },
    ],
  },
  {
    id: "banker",
    name: "Banker",
    nameTr: "Bankacı",
    title: "Bankacı",
    emoji: "🏦",
    color: "from-cyan-500 to-teal-700",
    image: "/c1.png",
    abilities: [
      { title: "Çip Faizi", description: "Oyun içinde kazanılan her 100 Çip için anında 1 Altın kazanır." },
      { title: "Altın Faizi", description: "Tur sonlarında kasasında kalan her 5 Altın için +10 Çip faiz alır." },
    ],
  },
  {
    id: "mechanic",
    name: "Mechanic",
    nameTr: "Mekanik",
    title: "Mekanik",
    emoji: "⚙️",
    color: "from-slate-500 to-zinc-700",
    image: "/c2.avif",
    abilities: [
      { title: "Küçük Kart Gücü", description: "Destesindeki 2, 3 ve 4'lü kartlar skorlamada '10'lu gibi hesaplanır." },
      { title: "Ağır El", description: "Tur başına Discard hakkı 1 eksiktir (Dezavantaj)." },
    ],
  },
  {
    id: "alchemist",
    name: "Alchemist",
    nameTr: "Simyacı",
    title: "Simyacı",
    emoji: "🧪",
    color: "from-fuchsia-500 to-pink-700",
    image: "/c3.jpg",
    abilities: [
      { title: "Maça→Kupa", description: "Destesindeki tüm 'Maça' kartları 'Kupa' sayılır." },
      { title: "Kupa Çarpanı", description: "Kupa içeren eller 1.5x Çip çarpanı alır." },
    ],
  },
  {
    id: "aristocrat",
    name: "Aristocrat",
    nameTr: "Aristokrat",
    title: "Aristokrat",
    emoji: "👑",
    color: "from-indigo-500 to-violet-700",
    image: "/c4.jpg",
    abilities: [
      { title: "Nadir Joker", description: "Oyuna rastgele 1 'Nadir' Joker ile başlar." },
      { title: "Ucuz Reroll", description: "Dükkân yenileme 2 Altın yerine sadece 1 Altın tutar." },
    ],
  },
  {
    id: "saboteur",
    name: "Saboteur",
    nameTr: "Sabotajcı",
    title: "Sabotajcı",
    emoji: "🧨",
    color: "from-red-600 to-rose-900",
    image: "/c5.webp",
    abilities: [
      { title: "Skor Sabotajı", description: "Rakip her el oynadığında rakibin total skorundan 15 Çip silinir." },
      { title: "Fiat Şişirme", description: "Rakibin dükkânındaki kart fiyatları +1 Altın artar." },
    ],
  },
];

export const CHARACTER_MAP: Record<CharacterId, Character> = CHARACTERS.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CharacterId, Character>,
);

export function getCharacter(id: CharacterId | null): Character | null {
  if (!id) return null;
  return CHARACTER_MAP[id] ?? null;
}