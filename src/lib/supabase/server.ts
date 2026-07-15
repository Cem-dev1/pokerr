// src/hooks/useOnlineGame.ts
import { useState, useEffect, useCallback } from "react";
import { onlineGame } from "@/lib/supabase/onlineGame";
import type { OnlineMatchState } from "@/lib/supabase/onlineGame";

export function useOnlineGame(matchId: string) {
  const [state, setState] = useState<OnlineMatchState | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    // Oyuncu ID'sini al
    const getPlayer = async () => {
      const player = await onlineGame.getPlayer();
      if (player) setPlayerId(player.id);
    };
    getPlayer();

    const unsubscribe = onlineGame.subscribeToMatch(
      matchId,
      (newState) => {
        setState(newState);
        setLoading(false);
      },
      (log) => {
        setLogs(prev => [...prev, log]);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [matchId]);

  const updateState = useCallback(async (updates: Partial<OnlineMatchState>) => {
    try {
      await onlineGame.updateMatchState(matchId, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Güncelleme başarısız");
    }
  }, [matchId]);

  const addLog = useCallback(async (message: string) => {
    try {
      await onlineGame.addMatchLog(matchId, message);
    } catch (err) {
      console.error("Log eklenemedi:", err);
    }
  }, [matchId]);

  const isPlayer1 = state?.player1Chips !== undefined; // Basit kontrol

  return {
    state,
    logs,
    loading,
    error,
    playerId,
    isPlayer1,
    updateState,
    addLog
  };
}