# Casino Poker Deck-Builder — Work Log

Project: 1v1 casino poker strategic deck-builder card game.
Stack: Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui + Zustand + Prisma/SQLite + Framer Motion.
Note: Environment is Next.js web (not React Native/Expo). Supabase replaced by Prisma+SQLite. "1v1 online" implemented as vs-AI opponent.

---
Task ID: 1
Agent: main
Task: Build data layer (types, characters, jokers, deck)

Work Log:
- (in progress)

Stage Summary:
- Created src/lib/game/types.ts: PlayingCard, Suit, Rank, HandType, HAND_BASE_CHIPS, Rarity + price ranges + ring/glow classes, Joker, Character, CharacterId, GamePhase, RoundPhase, ScoreBreakdown, PlayerState, OpponentState. Turkish labels included (SUIT_LABEL_TR, HAND_LABEL_TR, RARITY_LABEL_TR).
- Created src/lib/game/characters.ts: all 10 characters with 2 abilities each (gambler, merchant, warrior, lucky, illusionist, banker, mechanic, alchemist, aristocrat, saboteur) + CHARACTER_MAP + getCharacter.
- Created src/lib/game/jokers.ts: 20 mock jokers across rarities, JOKER_MAP, randomJokerByRarity, randomJokers (weighted).
- Created src/lib/game/deck.ts: buildDeck, shuffle, drawN, rankBaseChips, rankOrder, RANKS, SUITS.
- Locked scoring function signature: scoreHand(played, characterId, jokers) => ScoreBreakdown (to be implemented by Task 2 subagent in src/lib/game/scoring.ts).

---
Task ID: 2
Agent: scoring-engine-subagent
Task: Build poker hand classification + scoring engine (poker.ts, scoring.ts)

Work Log:
- Read types.ts, characters.ts, jokers.ts, deck.ts to anchor on existing Rank/Suit/HandType/Joker/CharacterId/ScoreBreakdown types and rankBaseChips / rankOrder / HAND_BASE_CHIPS / HAND_LABEL_TR exports.
- Created src/lib/game/poker.ts:
  - classifyHand(cards: PlayingCard[]): HandType — pure, side-effect-free.
    * Builds a rank frequency map and uses descending-sorted freqs for n-of-a-kind detection.
    * Flush requires exactly 5 cards all sharing one suit.
    * Straight requires exactly 5 distinct ranks whose numeric rankOrder() values form a consecutive run. Ace handled both ways: high (10-J-Q-K-A) and low wheel (A-2-3-4-5, treated as 5-high).
    * RoyalFlush = StraightFlush AND rank set is exactly {10,J,Q,K,A} AND straight high = 14.
    * Classification priority: RoyalFlush > StraightFlush > FourOfAKind > FullHouse > Flush > Straight > ThreeOfAKind > TwoPair > Pair > HighCard.
    * <5-card inputs are tolerated: Pair/TwoPair/ThreeOfAKind/FourOfAKind still detected from counts; Straight/Flush/FullHouse/Royal/StraightFlush require 5 cards. Empty input → HighCard.
  - describeHand(cards): { type, label } returning HAND_LABEL_TR[type].
- Created src/lib/game/scoring.ts:
  - scoreHand(played, characterId, jokers): ScoreBreakdown — exact locked signature.
  * Empty-played edge case returns HighCard with all-zero fields (mult=0) and notes ["Geçersiz el"].
  * Step A — effective cards: alchemist converts every spade to hearts (suit override) for classification, heart-joker, and Kupa-çarpanı checks. Mechanic bumps 2/3/4 ranks to chip value 10 (rank-for-classification unchanged). Illusionist's club conversion is assumed already applied upstream by the store.
  * Step B — handType = classifyHand(effectiveCards); first note `El: ${HAND_LABEL_TR[handType]}`.
  * Step C — baseChips = HAND_BASE_CHIPS[handType].
  * Step D — cardChips = sum of rankBaseChips(rank) with mechanic bump for {2,3,4}.
  * Step E — flatBonuses (additive): warrior +15 + +5×faceCount; illusionist +20 on TwoPair; jokers joker_flat_15/30 (+15/+30), joker_face_plus8 (+8×faceCount), joker_ace_plus20 (+20×aceCount), joker_full_house_plus50 (+50 FullHouse), joker_no_pair_plus40 (+40 HighCard), joker_each_card_plus4 (+4×n), joker_heart_plus10 (+10×effective hearts), joker_low_pair_plus25 (+25 Pair), joker_three_kind_plus35 (+35 ThreeOfAKind). Each applied bonus pushes a Turkish note.
  * Step F — mult (multiplicative, starts at 1): gambler ×1.5 on Flush; alchemist ×1.5 when effective hand contains a hearts card; jokers joker_mult_x2 (×2), joker_pair_mult_x2 (×2 Pair), joker_flush_mult_x2 (×2 Flush), joker_straight_mult_x2 (×2 Straight), joker_four_kind_x3 (×3 FourOfAKind), joker_odd_mult_x15 (×1.5 if all played ranks ∈ {3,5,7,9} and length≥2), joker_even_mult_x15 (×1.5 if all ∈ {2,4,6,8,10} and length≥2), joker_royal_x3 (×3 RoyalFlush), joker_all_in_x25 (×2.5 when played.length===5). Multiplier notes are multiplied into `mult` (never added).
  * Step G — total = Math.round((baseChips + cardChips + flatBonuses) * mult).
  * Returns full ScoreBreakdown with notes[] flat array.
- Ran `bun run lint` → clean (no errors in either new file). Verified with `bunx tsc --noEmit` (no type errors in src/lib/game/*).
- Sanity-tested 15+ scenarios with a throwaway tsx script (RoyalFlush w/ All-In+Royal jokers = 1508 chips, warrior K-K-Q = 70 chips, alchemist spade→heart Kupa multiplier, heart-joker counting alchemist-converted spades, odd/even jokers, empty hand). All outputs match expected math.

Stage Summary:
- Two pure, side-effect-free, strict-TypeScript (no `any`) modules added to src/lib/game/.
- Exported signatures:
  * poker.ts: `classifyHand(cards: PlayingCard[]): HandType` and `describeHand(cards: PlayingCard[]): { type: HandType; label: string }`.
  * scoring.ts: `scoreHand(played: PlayingCard[], characterId: CharacterId | null, jokers: Joker[]): ScoreBreakdown`.
- No store / component imports; only depends on ./types, ./deck, and ./poker.
- Ready for Task 3 (store hooks) to consume scoreHand directly with the locked signature.


---
Task ID: 3-6
Agent: main
Task: Build Zustand store, casino visual components, phase screens, page wiring

Work Log:
- src/lib/store/useGameStore.ts: Zustand store with chips/gold/phase/round/roundPhase, player+opponent state, deck, shopItems, pot, log, lastBreakdown, opponentHand, playerPlayedCards, matchWinner. Actions: startMatch, selectCharacter, confirmCharacter, enterRound, rerollShop (lucky 20% free, aristocrat cost 1), buyJoker (merchant -2), finishShop, toggleSelectCard, discardSelected, proceedToPlay, playHand (scoreHand + Bankacı chip→gold + Tip Jar joker + AI opponent resolve + saboteur -15), goToShowdown, finishRound (Bankacı interest), nextRoundOrMatch, reset. AI picks best 5-of-8 hand via scoreHand.
- Visual primitives: BlackOverlayBox, PlayerAvatar, PlayingCard (+FacedownCard), CardFan (flex+neg-margin fan, framer-motion selection lift), ChipStack (3D denominated stacks 5/25/100/500), Pot (POTE label + pulsing chip stack), CasinoTable (wood border + green felt + bokeh), Areas (OpponentArea/PlayerArea), JokerCard (+JokerRow), GameHUD, icons.
- Phase screens: LobbyScreen, CharacterSelectScreen (10 chars grid), ShopScreen (5 jokers, reroll, owned row), GameScreen (discard→play phases, live scoreHand preview, opponent area, pot, hand fan, action bar, joker row), ShowdownScreen (both hands + breakdowns + notes), RoundEndScreen, MatchEndScreen.
- page.tsx switches on phase. globals.css: casino-wood, casino-felt, casino-bokeh, play-card, play-card-back, casino-chip, casino-scroll, pot pulse, text glows.

Stage Summary:
- Full game loop implemented: Lobby → CharacterSelect → Shop → Game(discard→play) → Showdown → RoundEnd → (3 rounds) → MatchEnd → reset.
- Economy: Chips=score (poker hands), Gold=money (15/round + modifiers, shop-only, reroll 2g or 1g aristocrat or free lucky 20%).
- All 10 character abilities and 20 joker effects wired into scoring/store per spec.
- Pending: lint pass + Agent Browser verification.

---
Task ID: 7
Agent: main
Task: Lint, fix errors, verify with Agent Browser + VLM

Work Log:
- `bun run lint` → clean (no errors).
- Dev server compiles cleanly, GET / 200, no runtime/hydration errors.
- Agent Browser end-to-end verification (full golden path):
  - Lobby renders → "Maça Başla".
  - Character select: all 10 characters + 2 abilities each render; confirm disabled until selection.
  - Shop: 5 jokers, reroll (cost 2), buy, owned row, "Hazır".
  - Game: 8-card hand with Turkish suits (Maça/Kupa/Karo/Sinek), discard phase (3 hak), play phase, live scoreHand preview.
  - Played Pair (A Sinek+A Kupa) → breakdown showed "El: Çift", "Savaşçı: her ele +15 Çip", "Demir Çip +15". Warrior + Joker modifiers applied correctly.
  - Played Two Pair (2s+9s) round 3 → scored correctly.
  - Showdown: both hands revealed + breakdown notes + chip totals.
  - Round End → next round shop (gold +15/round). Completed all 3 rounds → Match End ("KAZANDIN/KAYBETTIN").
- Fixed a stale CSS issue: Tailwind v4 dev served a cached globals.css chunk that omitted the appended casino theme. Forced a real content edit to globals.css → recompile → casino-wood (#2a160a) + casino-felt (#0b6b3a) now served. Verified via getComputedStyle.
- VLM (glm-4.6v) verification of game screenshot against the visual spec — ALL 7 elements confirmed on desktop AND mobile:
  1. Dark brown wooden table border ✓
  2. Vibrant green felt playfield ✓
  3. Opponent area: circular avatar + red-backed face-down cards ✓
  4. Black semi-transparent rounded score box ✓
  5. Center pot "POTE" + stacked colored chips (blue/green/orange) ✓
  6. Player area: white cards in overlapping fan ✓
  7. Light bokeh/glow effects ✓
- Mobile (390x844) verified responsive, no overflow, casino theme intact.

Stage Summary:
- Game is fully playable end-to-end with no errors. Visual design matches the casino poker reference (VLM-confirmed on desktop + mobile). Economy (Chips=score, Gold=money, 15/round, reroll 2g/1g aristocrat/free lucky 20%) and all 10 character abilities + 20 joker effects wired per spec. vs-AI opponent functional.
