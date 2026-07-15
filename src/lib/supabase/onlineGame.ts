// src/lib/supabase/onlineGame.ts
import { createClient } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Joker, PlayingCard } from '@/lib/game/types';

export interface OnlinePlayer {
  id: string;
  username: string;
  characterId: string;
  avatar?: string; // optional, undefined olabilir
}

export interface OnlineMatch {
  id: string;
  status: 'waiting' | 'active' | 'finished';
  player1: OnlinePlayer | null;
  player2: OnlinePlayer | null;
  winner: OnlinePlayer | null;
  round: number;
  phase: string;
  created_at: string;
}

export interface OnlineMatchState {
  matchId: string;
  player1Chips: number;
  player2Chips: number;
  player1Gold: number;
  player2Gold: number;
  player1Hand: any[];
  player2Hand: any[];
  player1Selected: string[];
  player2Selected: string[];
  player1Jokers: any[];
  player2Jokers: any[];
  player1DiscardsLeft: number;
  player2DiscardsLeft: number;
  pot: number;
  currentTurn: string | null;
  lastAction: any;
}

class OnlineGameService {
  private supabase = createClient();
  private channels: Map<string, RealtimeChannel> = new Map();

  // Auth - Anonim giriş
  async signInAnonymously() {
    const { data, error } = await this.supabase.auth.signInAnonymously();
    if (error) throw error;
    return data;
  }

  // Auth - Mevcut kullanıcıyı al
  async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  // Oyuncu oluştur/güncelle
  async createOrUpdatePlayer(username: string, characterId: string = 'gambler', avatar?: string) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Oturum açılmamış');

    const { data, error } = await this.supabase
      .from('players')
      .upsert({
        user_id: user.id,
        username,
        character_id: characterId,
        avatar: avatar || null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Oyuncu bilgisini getir
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

  // Yeni maç oluştur
  async createMatch(playerId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('matches')
      .insert({
        player1_id: playerId,
        status: 'waiting',
        phase: 'lobby'
      })
      .select('id')
      .single();

    if (error) throw error;
    
    // Match state oluştur
    await this.supabase
      .from('match_states')
      .insert({
        match_id: data.id,
        player1_chips: 100,
        player1_gold: 10,
        player2_chips: 100,
        player2_gold: 10,
        player1_discards_left: 3,
        player2_discards_left: 3
      });

    return data.id;
  }

  // Maça katıl
  async joinMatch(matchId: string, playerId: string) {
    const { error } = await this.supabase
      .from('matches')
      .update({
        player2_id: playerId,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .eq('status', 'waiting');

    if (error) throw error;
  }

  // Rastgele maç bul
  async findRandomMatch(): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('matches')
      .select('id')
      .eq('status', 'waiting')
      .limit(1)
      .single();

    if (error) return null;
    return data?.id || null;
  }

  // Aktif maçları getir
  async getActiveMatches(): Promise<OnlineMatch[]> {
    const { data, error } = await this.supabase
      .from('matches')
      .select(`
        *,
        player1:players!matches_player1_id_fkey(id, username, character_id, avatar),
        player2:players!matches_player2_id_fkey(id, username, character_id, avatar),
        winner:players!matches_winner_id_fkey(id, username, character_id, avatar)
      `)
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Veriyi OnlineMatch formatına dönüştür - avatar null kontrolü ile
    return (data || []).map((item: any) => ({
      id: item.id,
      status: item.status,
      player1: item.player1 ? {
        id: item.player1.id,
        username: item.player1.username,
        characterId: item.player1.character_id || 'gambler',
        avatar: item.player1.avatar || undefined
      } : null,
      player2: item.player2 ? {
        id: item.player2.id,
        username: item.player2.username,
        characterId: item.player2.character_id || 'gambler',
        avatar: item.player2.avatar || undefined
      } : null,
      winner: item.winner ? {
        id: item.winner.id,
        username: item.winner.username,
        characterId: item.winner.character_id || 'gambler',
        avatar: item.winner.avatar || undefined
      } : null,
      round: item.round || 1,
      phase: item.phase || 'lobby',
      created_at: item.created_at
    }));
  }

  // Maç durumunu güncelle
  async updateMatchState(matchId: string, state: Partial<OnlineMatchState>) {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (state.player1Chips !== undefined) updateData.player1_chips = state.player1Chips;
    if (state.player2Chips !== undefined) updateData.player2_chips = state.player2Chips;
    if (state.player1Gold !== undefined) updateData.player1_gold = state.player1Gold;
    if (state.player2Gold !== undefined) updateData.player2_gold = state.player2Gold;
    if (state.player1Hand !== undefined) updateData.player1_hand = state.player1Hand;
    if (state.player2Hand !== undefined) updateData.player2_hand = state.player2Hand;
    if (state.player1Selected !== undefined) updateData.player1_selected = state.player1Selected;
    if (state.player2Selected !== undefined) updateData.player2_selected = state.player2Selected;
    if (state.player1Jokers !== undefined) updateData.player1_jokers = state.player1Jokers;
    if (state.player2Jokers !== undefined) updateData.player2_jokers = state.player2Jokers;
    if (state.player1DiscardsLeft !== undefined) updateData.player1_discards_left = state.player1DiscardsLeft;
    if (state.player2DiscardsLeft !== undefined) updateData.player2_discards_left = state.player2DiscardsLeft;
    if (state.pot !== undefined) updateData.pot = state.pot;
    if (state.currentTurn !== undefined) updateData.current_turn = state.currentTurn;
    if (state.lastAction !== undefined) updateData.last_action = state.lastAction;

    const { error } = await this.supabase
      .from('match_states')
      .update(updateData)
      .eq('match_id', matchId);

    if (error) throw error;
  }

  // Maç log ekle
  async addMatchLog(matchId: string, message: string) {
    const { error } = await this.supabase
      .from('match_logs')
      .insert({
        match_id: matchId,
        message
      });

    if (error) console.error('Log eklenemedi:', error);
  }

  // Maç durumunu dinle (gerçek zamanlı)
  subscribeToMatch(
    matchId: string,
    onStateChange: (state: OnlineMatchState) => void,
    onLog: (log: string) => void
  ) {
    // Match state dinle
    const stateChannel = this.supabase
      .channel(`match-state:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_states',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          const newState = payload.new as any;
          onStateChange({
            matchId: newState.match_id,
            player1Chips: newState.player1_chips || 0,
            player2Chips: newState.player2_chips || 0,
            player1Gold: newState.player1_gold || 0,
            player2Gold: newState.player2_gold || 0,
            player1Hand: newState.player1_hand || [],
            player2Hand: newState.player2_hand || [],
            player1Selected: newState.player1_selected || [],
            player2Selected: newState.player2_selected || [],
            player1Jokers: newState.player1_jokers || [],
            player2Jokers: newState.player2_jokers || [],
            player1DiscardsLeft: newState.player1_discards_left || 3,
            player2DiscardsLeft: newState.player2_discards_left || 3,
            pot: newState.pot || 0,
            currentTurn: newState.current_turn,
            lastAction: newState.last_action
          });
        }
      )
      .subscribe();

    // Log dinle
    const logChannel = this.supabase
      .channel(`match-logs:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_logs',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          onLog(payload.new.message);
        }
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

  // Maç listesini dinle (lobi için)
  subscribeToMatches(onMatches: (matches: OnlineMatch[]) => void) {
    const channel = this.supabase
      .channel('matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches'
        },
        async () => {
          const matches = await this.getActiveMatches();
          onMatches(matches);
        }
      )
      .subscribe();

    this.channels.set('matches', channel);
    return () => {
      channel.unsubscribe();
      this.channels.delete('matches');
    };
  }

  // Maçı sil (test için)
  async deleteMatch(matchId: string) {
    const { error } = await this.supabase
      .from('matches')
      .delete()
      .eq('id', matchId);
    if (error) throw error;
  }

  // Tüm kanalları temizle
  cleanup() {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }
}

export const onlineGame = new OnlineGameService();