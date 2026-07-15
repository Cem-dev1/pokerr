// src/lib/online/useOnlineMatch.ts
// ============================================================================
// React hook that drives a live online match.
//
// Sync model:
//   - Each client writes ONLY its own per-player columns (gold, jokers, hand,
//     selected, played, ready ...). No write conflicts.
//   - player1 (the host) additionally watches ready/played flags and advances
//     the phase + deals each round. So only one client mutates shared fields.
// ============================================================================
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onlineGame } from "@/lib/supabase/onlineGame";
import type {
  OnlineMatchMeta,
  OnlineMatchState,
} from "@/lib/supabase/onlineGame";
import type {
  CharacterId,
  Joker,
  PlayingCard,
  ScoreBreakdown,
} from "@/lib/game/types";
import { buildDeck, drawN, shuffle } from "@/lib/game/deck";
import { randomJokers, randomJokerByRarity } from "@/lib/game/jokers";
import { scoreHand } from "@/lib/game/scoring";
import { MAX_SELECT, shopPriceFor, TOTAL_ROUNDS } from "@/lib/store/useGameStore";

const HAND_SIZE = 8;
const BASE_DISCARDS = 3;
const GOLD_PER_ROUND = 15;
const REROLL_COST = 2;

export type Side = "player1" | "player2";

export interface PlayerView {
  characterId: CharacterId | null;
  ready: boolean;
  played: boolean;
  chips: number;
  gold: number;
  jokers: Joker[];
  shop: Joker[];
  hand: PlayingCard[];
  deck: PlayingCard[];
  selected: string[];
  discardsLeft: number;
  playedCards: PlayingCard[];
  breakdown: ScoreBreakdown | null;
}

// --- pure per-round helpers --------------------------------------------------
function baseDiscardsFor(c: string | null): number {
  let d = BASE_DISCARDS;
  if (c === "gambler") d += 1;
  if (c === "mechanic") d -= 1;
  return Math.max(0, d);
}
function rerollCostFor(c: string | null): number {
  return c === "aristocrat" ? 1 : REROLL_COST;
}
function roundGold(prev: number, c: string | null, round: number): number {
  let g = prev + GOLD_PER_ROUND;
  if (c === "lucky") g += 5;
  if (round === 1 && c === "merchant") g += 10;
  return g;
}
function startingJokers(c: string | null): Joker[] {
  return c === "aristocrat" ? [randomJokerByRarity("rare")] : [];
}
function dealHand(c: string | null): { hand: PlayingCard[]; deck: PlayingCard[] } {
  const deck = shuffle(buildDeck());
  const { drawn, remaining } = drawN(deck, HAND_SIZE);
  let hand = drawn;
  if (c === "illusionist") {
    const idx = hand.findIndex((card) => card.suit !== "clubs");
    if (idx >= 0) hand = hand.map((card, i) => (i === idx ? { ...card, suit: "clubs" } : card));
  }
  return { hand, deck: remaining };
}

/** Host-only: build the patch that starts a given round (deals hands, shops...). */
function buildRoundInit(s: OnlineMatchState, round: number): Partial<OnlineMatchState> {
  const c1 = s.player1Character;
  const c2 = s.player2Character;
  const d1 = dealHand(c1);
  const d2 = dealHand(c2);
  const patch: Partial<OnlineMatchState> = {
    phase: "shop",
    round,
    player1Gold: roundGold(s.player1Gold, c1, round),
    player2Gold: roundGold(s.player2Gold, c2, round),
    player1Shop: randomJokers(5),
    player2Shop: randomJokers(5),
    player1Hand: d1.hand,
    player1Deck: d1.deck,
    player2Hand: d2.hand,
    player2Deck: d2.deck,
    player1Selected: [],
    player2Selected: [],
    player1DiscardsLeft: baseDiscardsFor(c1),
    player2DiscardsLeft: baseDiscardsFor(c2),
    player1Ready: false,
    player2Ready: false,
    player1Played: false,
    player2Played: false,
    player1PlayedCards: [],
    player2PlayedCards: [],
    player1Breakdown: null,
    player2Breakdown: null,
    pot: 0,
  };
  if (round === 1) {
    patch.player1Jokers = startingJokers(c1);
    patch.player2Jokers = startingJokers(c2);
  }
  return patch;
}

/** play -> showdown. Deterministic, so either player may apply it.
 *  Applies the Saboteur debuff to the opponent (-15 chips/score, min 0). */
function buildShowdownPatch(s: OnlineMatchState): Partial<OnlineMatchState> {
  const patch: Partial<OnlineMatchState> = {
    phase: "showdown",
    player1Ready: false,
    player2Ready: false,
  };
  let p1b = s.player1Breakdown;
  let p2b = s.player2Breakdown;
  let p1Chips = s.player1Chips;
  let p2Chips = s.player2Chips;

  if (s.player1Character === "saboteur") {
    p2Chips = Math.max(0, p2Chips - 15);
    if (p2b) p2b = { ...p2b, total: Math.max(0, p2b.total - 15) };
    patch.player2Chips = p2Chips;
    if (p2b) patch.player2Breakdown = p2b;
  }
  if (s.player2Character === "saboteur") {
    p1Chips = Math.max(0, p1Chips - 15);
    if (p1b) p1b = { ...p1b, total: Math.max(0, p1b.total - 15) };
    patch.player1Chips = p1Chips;
    if (p1b) patch.player1Breakdown = p1b;
  }
  patch.pot = (p1b?.total ?? 0) + (p2b?.total ?? 0);
  return patch;
}

/** Decide whether the phase should advance, and how.
 *  - Deal transitions (character->shop, showdown->shop) use randomness, so
 *    only the host runs them (avoids the two clients diverging on hands/shop).
 *  - All other transitions are deterministic, so EITHER client may apply them
 *    (keeps the game moving even if the host drops). */
function computeTransition(s: OnlineMatchState, isHost: boolean): Partial<OnlineMatchState> | null {
  if (s.phase === "character") {
    if (s.player1Character && s.player2Character && isHost) return buildRoundInit(s, 1);
  } else if (s.phase === "shop") {
    if (s.player1Ready && s.player2Ready) {
      return {
        phase: "play",
        player1Ready: false,
        player2Ready: false,
        player1Selected: [],
        player2Selected: [],
      };
    }
  } else if (s.phase === "play") {
    if (s.player1Played && s.player2Played) return buildShowdownPatch(s);
  } else if (s.phase === "showdown") {
    if (s.player1Ready && s.player2Ready) {
      if (s.round >= TOTAL_ROUNDS) {
        const w: OnlineMatchState["matchWinner"] =
          s.player1Chips > s.player2Chips
            ? "player1"
            : s.player2Chips > s.player1Chips
              ? "player2"
              : "tie";
        return { phase: "match-end", matchWinner: w };
      }
      if (isHost) return buildRoundInit(s, s.round + 1);
    }
  }
  return null;
}

function viewFor(side: Side, s: OnlineMatchState): PlayerView {
  const p1 = side === "player1";
  return {
    characterId: (p1 ? s.player1Character : s.player2Character) as CharacterId | null,
    ready: p1 ? s.player1Ready : s.player2Ready,
    played: p1 ? s.player1Played : s.player2Played,
    chips: p1 ? s.player1Chips : s.player2Chips,
    gold: p1 ? s.player1Gold : s.player2Gold,
    jokers: p1 ? s.player1Jokers : s.player2Jokers,
    shop: p1 ? s.player1Shop : s.player2Shop,
    hand: p1 ? s.player1Hand : s.player2Hand,
    deck: p1 ? s.player1Deck : s.player2Deck,
    selected: p1 ? s.player1Selected : s.player2Selected,
    discardsLeft: p1 ? s.player1DiscardsLeft : s.player2DiscardsLeft,
    playedCards: p1 ? s.player1PlayedCards : s.player2PlayedCards,
    breakdown: p1 ? s.player1Breakdown : s.player2Breakdown,
  };
}

export interface UseOnlineMatch {
  loading: boolean;
  error: string | null;
  side: Side | null;
  isHost: boolean;
  state: OnlineMatchState | null;
  meta: OnlineMatchMeta | null;
  waitingForOpponent: boolean;
  me: PlayerView | null;
  opp: PlayerView | null;
  opponentName: string;
  // actions
  pickCharacter: (id: CharacterId) => void;
  rerollShop: () => void;
  buyJoker: (jokerId: string) => void;
  toggleCard: (cardId: string) => void;
  discardSelected: () => void;
  playHand: () => void;
  setReady: (v: boolean) => void;
}

export function useOnlineMatch(matchId: string): UseOnlineMatch {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [side, setSide] = useState<Side | null>(null);
  const [state, setState] = useState<OnlineMatchState | null>(null);
  const [meta, setMeta] = useState<OnlineMatchMeta | null>(null);

  const stateRef = useRef<OnlineMatchState | null>(null);
  const sideRef = useRef<Side | null>(null);
  const transKey = useRef<string>("");

  // --- mount: auth + side detection + subscriptions -------------------------
  useEffect(() => {
    let unsub = () => {};
    let unsubMeta = () => {};
    let cancelled = false;

    (async () => {
      try {
        // ensure anonymous session
        let user = await onlineGame.getCurrentUser();
        if (!user) {
          await onlineGame.signInAnonymously();
          user = await onlineGame.getCurrentUser();
        }
        if (!user) throw new Error("Oturum açılamadı");

        const player = await onlineGame.getPlayer(user.id);
        if (!player) throw new Error("Oyuncu profili bulunamadı");

        const m = await onlineGame.getMatchMeta(matchId);
        if (!m) throw new Error("Maç bulunamadı");
        if (cancelled) return;
        setMeta(m);

        let mySide: Side | null = null;
        if (m.player1?.id === player.id) mySide = "player1";
        else if (m.player2?.id === player.id) mySide = "player2";
        if (!mySide) throw new Error("Bu maçta değilsin");
        sideRef.current = mySide;
        setSide(mySide);

        const initial = await onlineGame.getMatchState(matchId);
        if (cancelled) return;
        if (initial) {
          stateRef.current = initial;
          setState(initial);
        }

        // live gameplay
        unsub = onlineGame.subscribeToMatch(
          matchId,
          (s) => {
            stateRef.current = s;
            setState(s);
          },
          () => {}
        );
        // live meta (join detection)
        unsubMeta = onlineGame.subscribeToMatchMeta(matchId, (mm) => setMeta(mm));

        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Bağlantı kurulamadı");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsub();
      unsubMeta();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // --- drive phase transitions ---------------------------------------------
  // Deterministic transitions run on BOTH clients (idempotent); random deals
  // run on the host only (see computeTransition).
  const isHost = side === "player1";
  useEffect(() => {
    if (!state || !side) return;
    const patch = computeTransition(state, isHost);
    if (!patch) return;
    const key = `${state.phase}|${state.round}|r${+state.player1Ready}${+state.player2Ready}|p${+state.player1Played}${+state.player2Played}`;
    if (transKey.current === key) return; // already in-flight / applied
    transKey.current = key;
    onlineGame.updateMatchState(matchId, patch).catch((e) => {
      console.error("Faz geçişi başarısız:", e);
      transKey.current = ""; // allow retry on next change
    });
  }, [state, isHost, matchId, side]);

  // --- write helpers --------------------------------------------------------
  const writeMy = useCallback(
    (patch: Partial<OnlineMatchState>) => {
      onlineGame.updateMatchState(matchId, patch).catch((e) =>
        console.error("Güncelleme başarısız:", e)
      );
    },
    [matchId]
  );

  const myKeys = (() => {
    const p1 = sideRef.current === "player1";
    return p1
      ? {
          character: "player1Character",
          ready: "player1Ready",
          played: "player1Played",
          chips: "player1Chips",
          gold: "player1Gold",
          jokers: "player1Jokers",
          shop: "player1Shop",
          hand: "player1Hand",
          deck: "player1Deck",
          selected: "player1Selected",
          discardsLeft: "player1DiscardsLeft",
          playedCards: "player1PlayedCards",
          breakdown: "player1Breakdown",
        }
      : {
          character: "player2Character",
          ready: "player2Ready",
          played: "player2Played",
          chips: "player2Chips",
          gold: "player2Gold",
          jokers: "player2Jokers",
          shop: "player2Shop",
          hand: "player2Hand",
          deck: "player2Deck",
          selected: "player2Selected",
          discardsLeft: "player2DiscardsLeft",
          playedCards: "player2PlayedCards",
          breakdown: "player2Breakdown",
        };
  })();

  // --- actions --------------------------------------------------------------
  const pickCharacter = useCallback(
    (id: CharacterId) => {
      writeMy({ [myKeys.character]: id } as Partial<OnlineMatchState>);
    },
    [writeMy, myKeys]
  );

  const rerollShop = useCallback(() => {
    const me = stateRef.current && sideRef.current ? viewFor(sideRef.current, stateRef.current) : null;
    if (!me) return;
    const cost = rerollCostFor(me.characterId);
    const free = me.characterId === "lucky" && Math.random() < 0.2;
    if (!free && me.gold < cost) return;
    writeMy({
      [myKeys.shop]: randomJokers(5),
      [myKeys.gold]: free ? me.gold : me.gold - cost,
    } as Partial<OnlineMatchState>);
  }, [writeMy, myKeys]);

  const buyJoker = useCallback(
    (jokerId: string) => {
      const me = stateRef.current && sideRef.current ? viewFor(sideRef.current, stateRef.current) : null;
      if (!me) return;
      const joker = me.shop.find((j) => j.id === jokerId);
      if (!joker) return;
      if (me.jokers.some((j) => j.id === jokerId)) return;
      const price = shopPriceFor(joker, (me.characterId as CharacterId) ?? null);
      if (me.gold < price) return;
      writeMy({
        [myKeys.gold]: me.gold - price,
        [myKeys.jokers]: [...me.jokers, joker],
        [myKeys.shop]: me.shop.filter((j) => j.id !== jokerId),
      } as Partial<OnlineMatchState>);
    },
    [writeMy, myKeys]
  );

  const toggleCard = useCallback(
    (cardId: string) => {
      const me = stateRef.current && sideRef.current ? viewFor(sideRef.current, stateRef.current) : null;
      if (!me || me.played) return;
      const sel = me.selected;
      let next: string[];
      if (sel.includes(cardId)) next = sel.filter((x) => x !== cardId);
      else if (sel.length < MAX_SELECT) next = [...sel, cardId];
      else return;
      writeMy({ [myKeys.selected]: next } as Partial<OnlineMatchState>);
    },
    [writeMy, myKeys]
  );

  const discardSelected = useCallback(() => {
    const me = stateRef.current && sideRef.current ? viewFor(sideRef.current, stateRef.current) : null;
    if (!me) return;
    if (me.selected.length === 0 || me.discardsLeft <= 0) return;
    const selSet = new Set(me.selected);
    const kept = me.hand.filter((c) => !selSet.has(c.id));
    const { drawn, remaining } = drawN(me.deck, me.selected.length);
    writeMy({
      [myKeys.hand]: [...kept, ...drawn],
      [myKeys.deck]: remaining,
      [myKeys.selected]: [],
      [myKeys.discardsLeft]: me.discardsLeft - 1,
    } as Partial<OnlineMatchState>);
  }, [writeMy, myKeys]);

  const playHand = useCallback(() => {
    const me = stateRef.current && sideRef.current ? viewFor(sideRef.current, stateRef.current) : null;
    if (!me || me.played) return;
    if (me.selected.length === 0) return;
    const played = me.hand.filter((c) => me.selected.includes(c.id));
    const breakdown = scoreHand(played, (me.characterId as CharacterId) ?? null, me.jokers);
    writeMy({
      [myKeys.playedCards]: played,
      [myKeys.breakdown]: breakdown,
      [myKeys.chips]: me.chips + breakdown.total,
      [myKeys.played]: true,
      [myKeys.selected]: [],
    } as Partial<OnlineMatchState>);
  }, [writeMy, myKeys]);

  const setReady = useCallback(
    (v: boolean) => {
      writeMy({ [myKeys.ready]: v } as Partial<OnlineMatchState>);
    },
    [writeMy, myKeys]
  );

  const me = state && side ? viewFor(side, state) : null;
  const opp = state && side ? viewFor(side === "player1" ? "player2" : "player1", state) : null;
  const waitingForOpponent = !meta?.player2;
  const opponentName = (side === "player1" ? meta?.player2?.username : meta?.player1?.username) || "Rakip";

  return {
    loading,
    error,
    side,
    isHost,
    state,
    meta,
    waitingForOpponent,
    me,
    opp,
    opponentName,
    pickCharacter,
    rerollShop,
    buyJoker,
    toggleCard,
    discardSelected,
    playHand,
    setReady,
  };
}
