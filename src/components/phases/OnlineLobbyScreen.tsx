// src/components/phases/OnlineLobbyScreen.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CasinoTable } from "@/components/game/CasinoTable";
import { onlineGame } from "@/lib/supabase/onlineGame";
import type { OnlineMatchMeta } from "@/lib/supabase/onlineGame";
import { Users, Plus, RefreshCw, Gamepad2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function OnlineLobbyScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<OnlineMatchMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [username, setUsername] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Anonim giriş yap
    const init = async () => {
      try {
        await onlineGame.signInAnonymously();
        const user = await onlineGame.getCurrentUser();
        if (user) {
          const player = await onlineGame.getPlayer();
          if (player) {
            setPlayerId(player.id);
            setUsername(player.username || "");
          }
        }
        await loadMatches();
        subscribeToMatches();
      } catch (err) {
        console.error("Başlatma hatası:", err);
        setError("Bağlantı kurulamadı");
      } finally {
        setLoading(false);
      }
    };
    init();

    return () => {
      // Cleanup
    };
  }, []);

  const loadMatches = async () => {
    try {
      const data = await onlineGame.getActiveMatches();
      setMatches(data);
    } catch (error) {
      console.error("Maçlar yüklenemedi:", error);
    }
  };

  const subscribeToMatches = () => {
    onlineGame.subscribeToMatches((newMatches) => {
      setMatches(newMatches);
    });
  };

  const createMatch = async () => {
    if (!username.trim()) {
      setError("Lütfen bir kullanıcı adı girin");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      // Oyuncu oluştur
      const player = await onlineGame.createOrUpdatePlayer(username, "gambler");
      setPlayerId(player.id);
      
      // Maç oluştur
      const matchId = await onlineGame.createMatch(player.id);
      
      // Maç detay sayfasına yönlendir
      router.push(`/match/${matchId}`);
    } catch (err) {
      console.error("Maç oluşturulamadı:", err);
      setError("Maç oluşturulamadı. Tekrar deneyin.");
    } finally {
      setCreating(false);
    }
  };

  const joinMatch = async (matchId: string) => {
    if (!username.trim()) {
      setError("Lütfen bir kullanıcı adı girin");
      return;
    }

    try {
      // Oyuncu oluştur
      const player = await onlineGame.createOrUpdatePlayer(username, "gambler");
      setPlayerId(player.id);
      
      // Maça katıl
      await onlineGame.joinMatch(matchId, player.id);
      
      // Maç detay sayfasına yönlendir
      router.push(`/match/${matchId}`);
    } catch (err) {
      console.error("Maça katılınamadı:", err);
      setError("Maça katılınamadı. Maç dolu olabilir.");
    }
  };

  if (loading) {
    return (
      <CasinoTable>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-amber-400 mx-auto mb-4" />
            <p className="text-zinc-400">Bağlanılıyor...</p>
          </div>
        </div>
      </CasinoTable>
    );
  }

  return (
    <CasinoTable>
      <div className="flex h-full flex-col px-4 py-6">
        <div className="text-center mb-6">
          <h2 className="text-glow-gold text-2xl font-black text-amber-200">
            🎮 ONLINE LOBI
          </h2>
          <p className="text-xs text-zinc-300">
            Diğer oyuncularla savaşmak için maç oluştur veya katıl
          </p>
        </div>

        {/* Hata mesajı */}
        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-400/30 rounded-lg p-2 text-center">
            <span className="text-xs font-bold text-red-400">{error}</span>
          </div>
        )}

        {/* Oyuncu Adı */}
        <div className="mb-4 flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            placeholder="Oyuncu adın..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full sm:flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          />
          <Button
            onClick={createMatch}
            disabled={creating || !username.trim()}
            className="w-full sm:w-auto gap-2 bg-gradient-to-b from-amber-400 to-amber-600 font-black text-zinc-950 hover:from-amber-300 hover:to-amber-500 disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Maç Oluştur
          </Button>
        </div>

        {/* Maç Listesi */}
        <div className="flex-1 overflow-y-auto casino-scroll space-y-2">
          {matches.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Aktif maç yok</p>
              <p className="text-xs text-zinc-500">Yeni bir maç oluştur!</p>
            </div>
          ) : (
            matches.map((match) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/30 rounded-xl p-4 ring-1 ring-white/10 hover:ring-amber-400/30 transition-all"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Gamepad2 className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-bold text-white">
                        {match.player1?.username || "Oyuncu 1"}
                      </span>
                      {match.player2 ? (
                        <>
                          <span className="text-zinc-500">⚔️</span>
                          <span className="text-sm font-bold text-white">
                            {match.player2.username}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-zinc-400">(bekleniyor...)</span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
                      <span className={match.status === "waiting" ? "text-yellow-400" : "text-green-400"}>
                        {match.status === "waiting" ? "⏳ Bekliyor" : "🔄 Aktif"}
                      </span>
                      {/* character_id -> characterId olarak değiştirildi */}
                      {match.player1?.characterId && (
                        <span>🎯 {match.player1.characterId}</span>
                      )}
                      <span className="text-zinc-500">
                        {new Date(match.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => joinMatch(match.id)}
                    disabled={match.status === "active" && match.player2 !== null}
                    className="gap-1 bg-gradient-to-b from-emerald-400 to-emerald-600 font-black text-zinc-950 hover:from-emerald-300 hover:to-emerald-500 disabled:opacity-40"
                  >
                    {match.status === "waiting" ? "Katıl" : "İzle"}
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </CasinoTable>
  );
}