// src/lib/supabase/onlineGame.ts
// Online multiplayer service — Supabase anon auth + Postgres + Realtime.
// State model: each player writes ONLY their own columns; player1 (host) also
// drives phase transitions and per-round initialisation (see useOnlineMatch).
import { createClient } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Joker, PlayingCard, ScoreBreakdown } from '@/lib/game/types';

export type OnlinePhase =
  | 'character'
  | 'shop'
  | 'play'
  | 'showdown'
  | 'match-end';

export interface OnlinePlayer {
  id: string;
  username: string;
  characterId: string;
  avatar?: string;
}

export interface OnlineMatchMeta {
  id: string;
  status: 'waiting' | 'active' | 'finished';
  player1: OnlinePlayer | null;
  player2: OnlinePlayer | null;
  created_at: string;
}

/** Full live game state for a match (one match_states row). */
export interface OnlineMatchState {
  matchId: string;
  phase: OnlinePhase;
  round: number;

  player1Character: string | null;
  player2Character: string | null;
  player1Ready: boolean;
  player2Ready: boolean;
  player1Played: boolean;
  player2Played: boolean;

  player1Chips: number;
  player2Chips: number;
  player1Gold: number;
  player2Gold: number;

  player1Jokers: Joker[];
  player2Jokers: Joker[];
  player1Shop: Joker[];
  player2Shop: Joker[];

  player1Hand: PlayingCard[];
  player2Hand: PlayingCard[];
  player1Deck: PlayingCard[];
  player2Deck: PlayingCard[];
  player1Selected: string[];
  player2Selected: string[];

  player1DiscardsLeft: number;
  player2DiscardsLeft: number;

  player1PlayedCards: PlayingCard[];
  player2PlayedCards: PlayingCard[];
  player1Breakdown: ScoreBreakdown | null;
  player2Breakdown: ScoreBreakdown | null;

  pot: number;
  matchWinner: 'player1' | 'player2' | 'tie' | null;
  updatedAt: string;
}

// Map a snake_case DB row to the camelCase OnlineMatchState.
function mapRow(r: any): OnlineMatchState {
  return {
    matchId: r.match_id,
    phase: (r.phase ?? 'character') as OnlinePhase,
    round: r.round ?? 1,
    player1Character: r.player1_character ?? null,
    player2Character: r.player2_character ?? null,
    player1Ready: !!r.player1_ready,
    player2Ready: !!r.player2_ready,
    player1Played: !!r.player1_played,
    player2Played: !!r.player2_played,
    player1Chips: r.player1_chips ?? 0,
    player2Chips: r.player2_chips ?? 0,
    player1Gold: r.player1_gold ?? 0,
    player2Gold: r.player2_gold ?? 0,
    player1Jokers: r.player1_jokers ?? [],
    player2Jokers: r.player2_jokers ?? [],
    player1Shop: r.player1_shop ?? [],
    player2Shop: r.player2_shop ?? [],
    player1Hand: r.player1_hand ?? [],
    player2Hand: r.player2_hand ?? [],
    player1Deck: r.player1_deck ?? [],
    player2Deck: r.player2_deck ?? [],
    player1Selected: r.player1_selected ?? [],
    player2Selected: r.player2_selected ?? [],
    player1DiscardsLeft: r.player1_discards_left ?? 3,
    player2DiscardsLeft: r.player2_discards_left ?? 3,
    player1PlayedCards: r.player1_played_cards ?? [],
    player2PlayedCards: r.player2_played_cards ?? [],
    player1Breakdown: r.player1_breakdown ?? null,
    player2Breakdown: r.player2_breakdown ?? null,
    pot: r.pot ?? 0,
    matchWinner: (r.match_winner ?? null) as OnlineMatchState['matchWinner'],
    updatedAt: r.updated_at ?? new Date(0).toISOString(),
  };
}

class OnlineGameService {
  private _client: ReturnType<typeof createClient> | null = null;
  private channels: Map<string, RealtimeChannel> = new Map();

  // Lazy: the Supabase client is created on first use (client-side), never at
  // module-import/build time — so a missing env var can't crash the build.
  private get supabase(): ReturnType<typeof createClient> {
    if (!this._client) this._client = createClient();
    return this._client;
  }

  // --- Auth ------------------------------------------------------------------
  async signInAnonymously() {
    const { data, error } = await this.supabase.auth.signInAnonymously();
    if (error) throw error;
    return data;
  }

  async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  async createOrUpdatePlayer(username: string, characterId = 'gambler', avatar?: string) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Oturum açılmamış');

    const { data, error } = await this.supabase
      .from('players')
      .upsert(
        {
          user_id: user.id,
          username,
          character_id: characterId,
          avatar: avatar ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPlayer(userId?: string) {
    let uid = userId;
    if (!uid) {
      const user = await this.getCurrentUser();
      uid = user?.id;
    }
    if (!uid) return null;

    const { data, error } = await this.supabase
      .from('players')
      .select('*')
      .eq('user_id', uid)
      .single();

    if (error) return null;
    return data;
  }

  // --- Matches ---------------------------------------------------------------
  async createMatch(playerId: string): Promise<string> {
    // 1) match row (player1 = creator, waiting for opponent)
    const { data: match, error: mErr } = await this.supabase
      .from('matches')
      .insert({
        player1_id: playerId,
        status: 'waiting',
        phase: 'character',
      })
      .select('id')
      .single();
    if (mErr) throw mErr;

    // 2) live game-state row, starts in the character phase
    const { error: sErr } = await this.supabase.from('match_states').insert({
      match_id: match.id,
      phase: 'character',
      round: 1,
    });
    if (sErr) throw sErr;

    return match.id;
  }

  async joinMatch(matchId: string, playerId: string) {
    const { error } = await this.supabase
      .from('matches')
      .update({
        player2_id: playerId,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId)
      .eq('status', 'waiting');
    if (error) throw error;
  }

  async findRandomMatch(): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('matches')
      .select('id')
      .eq('status', 'waiting')
      .limit(1)
      .single();
    if (error) return null;
    return data?.id ?? null;
  }

  async getMatchMeta(matchId: string): Promise<OnlineMatchMeta | null> {
    const { data, error } = await this.supabase
      .from('matches')
      .select(
        `
        id, status, created_at,
        player1:players!matches_player1_id_fkey(id, username, character_id, avatar),
        player2:players!matches_player2_id_fkey(id, username, character_id, avatar)
      `
      )
      .eq('id', matchId)
      .single();
    if (error || !data) return null;

    const toPlayer = (p: any): OnlinePlayer | null =>
      p
        ? {
            id: p.id,
            username: p.username,
            characterId: p.character_id || 'gambler',
            avatar: p.avatar || undefined,
          }
        : null;

    return {
      id: data.id,
      status: data.status,
      player1: toPlayer(data.player1),
      player2: toPlayer(data.player2),
      created_at: data.created_at,
    };
  }

  async getActiveMatches(): Promise<OnlineMatchMeta[]> {
    const { data, error } = await this.supabase
      .from('matches')
      .select(
        `
        id, status, created_at,
        player1:players!matches_player1_id_fkey(id, username, character_id, avatar),
        player2:players!matches_player2_id_fkey(id, username, character_id, avatar)
      `
      )
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false });
    if (error || !data) return [];

    const toPlayer = (p: any): OnlinePlayer | null =>
      p
        ? {
            id: p.id,
            username: p.username,
            characterId: p.character_id || 'gambler',
            avatar: p.avatar || undefined,
          }
        : null;

    return data.map((m: any) => ({
      id: m.id,
      status: m.status,
      player1: toPlayer(m.player1),
      player2: toPlayer(m.player2),
      created_at: m.created_at,
    }));
  }

  // --- Live game state -------------------------------------------------------
  async getMatchState(matchId: string): Promise<OnlineMatchState | null> {
    const { data, error } = await this.supabase
      .from('match_states')
      .select('*')
      .eq('match_id', matchId)
      .single();
    if (error || !data) return null;
    return mapRow(data);
  }

  /** Patch the match_states row. `updates` uses camelCase keys (mapped here). */
  async updateMatchState(matchId: string, updates: Partial<OnlineMatchState>) {
    const u: Record<string, unknown> = { updated_at: new Date().toISOString() };

    const map: Record<keyof OnlineMatchState, string> = {
      matchId: 'match_id',
      phase: 'phase',
      round: 'round',
      player1Character: 'player1_character',
      player2Character: 'player2_character',
      player1Ready: 'player1_ready',
      player2Ready: 'player2_ready',
      player1Played: 'player1_played',
      player2Played: 'player2_played',
      player1Chips: 'player1_chips',
      player2Chips: 'player2_chips',
      player1Gold: 'player1_gold',
      player2Gold: 'player2_gold',
      player1Jokers: 'player1_jokers',
      player2Jokers: 'player2_jokers',
      player1Shop: 'player1_shop',
      player2Shop: 'player2_shop',
      player1Hand: 'player1_hand',
      player2Hand: 'player2_hand',
      player1Deck: 'player1_deck',
      player2Deck: 'player2_deck',
      player1Selected: 'player1_selected',
      player2Selected: 'player2_selected',
      player1DiscardsLeft: 'player1_discards_left',
      player2DiscardsLeft: 'player2_discards_left',
      player1PlayedCards: 'player1_played_cards',
      player2PlayedCards: 'player2_played_cards',
      player1Breakdown: 'player1_breakdown',
      player2Breakdown: 'player2_breakdown',
      pot: 'pot',
      matchWinner: 'match_winner',
      updatedAt: 'updated_at',
    };

    for (const [camel, snake] of Object.entries(map)) {
      if (camel in updates) u[snake] = (updates as Record<string, unknown>)[camel];
    }

    const { error } = await this.supabase
      .from('match_states')
      .update(u)
      .eq('match_id', matchId);
    if (error) throw error;
  }

  async addMatchLog(matchId: string, message: string) {
    const { error } = await this.supabase
      .from('match_logs')
      .insert({ match_id: matchId, message });
    if (error) console.error('Log eklenemedi:', error);
  }

  /** Realtime: live game state + logs. */
  subscribeToMatch(
    matchId: string,
    onStateChange: (state: OnlineMatchState) => void,
    onLog: (log: string) => void
  ) {
    const stateChannel = this.supabase
      .channel(`match-state:${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_states', filter: `match_id=eq.${matchId}` },
        (payload) => onStateChange(mapRow(payload.new))
      )
      .subscribe();

    const logChannel = this.supabase
      .channel(`match-logs:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_logs', filter: `match_id=eq.${matchId}` },
        (payload) => onLog((payload.new as any).message)
      )
      .subscribe();

    this.channels.set(`state:${matchId}`, stateChannel);
    this.channels.set(`logs:${matchId}`, logChannel);

    return () => {
      this.channels.get(`state:${matchId}`)?.unsubscribe();
      this.channels.get(`logs:${matchId}`)?.unsubscribe();
      this.channels.delete(`state:${matchId}`);
      this.channels.delete(`logs:${matchId}`);
    };
  }

  /** Realtime: match row (join detection, status). */
  subscribeToMatchMeta(matchId: string, onMeta: (meta: OnlineMatchMeta) => void) {
    const channel = this.supabase
      .channel(`match-meta:${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        async () => {
          const meta = await this.getMatchMeta(matchId);
          if (meta) onMeta(meta);
        }
      )
      .subscribe();

    this.channels.set(`meta:${matchId}`, channel);
    return () => {
      channel.unsubscribe();
      this.channels.delete(`meta:${matchId}`);
    };
  }

  /** Realtime: lobby list of active/waiting matches. */
  subscribeToMatches(onMatches: (matches: OnlineMatchMeta[]) => void) {
    const channel = this.supabase
      .channel("matches-lobby")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        async () => {
          const matches = await this.getActiveMatches();
          onMatches(matches);
        }
      )
      .subscribe();
    this.channels.set("matches-lobby", channel);
    return () => {
      channel.unsubscribe();
      this.channels.delete("matches-lobby");
    };
  }

  async deleteMatch(matchId: string) {
    const { error } = await this.supabase.from('matches').delete().eq('id', matchId);
    if (error) throw error;
  }

  cleanup() {
    this.channels.forEach((channel) => channel.unsubscribe());
    this.channels.clear();
  }
}

export const onlineGame = new OnlineGameService();
