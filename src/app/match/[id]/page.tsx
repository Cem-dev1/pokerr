// src/app/match/[id]/page.tsx
// Online match room. Handles auth/loading/error/waiting and routes to the
// correct phase screen based on the live match state.
"use client";

import { useParams, useRouter } from "next/navigation";
import { useOnlineMatch } from "@/lib/online/useOnlineMatch";
import {
  OnlineCharacterScreen,
  OnlineShopScreen,
  OnlinePlayScreen,
  OnlineShowdownScreen,
  OnlineMatchEndScreen,
  OnlineWaiting,
} from "@/components/online/OnlineScreens";
import { CasinoTable } from "@/components/game/CasinoTable";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const game = useOnlineMatch(matchId ?? "");

  const back = (
    <button
      onClick={() => router.push("/")}
      className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-2 text-sm text-zinc-300 transition-all hover:bg-black/80"
    >
      <ArrowLeft className="h-4 w-4" /> Çıkış
    </button>
  );

  if (game.loading) {
    return (
      <CasinoTable>
        <div className="relative flex h-full items-center justify-center">
          {back}
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-amber-400" />
            <p className="text-zinc-400">Maça bağlanılıyor...</p>
          </div>
        </div>
      </CasinoTable>
    );
  }

  if (game.error) {
    return (
      <CasinoTable>
        <div className="relative flex h-full items-center justify-center">
          {back}
          <div className="text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
            <p className="mb-3 text-sm font-bold text-red-400">{game.error}</p>
            <Button onClick={() => router.push("/")} variant="secondary" className="gap-2 bg-zinc-800 text-zinc-200">
              Ana Menü
            </Button>
          </div>
        </div>
      </CasinoTable>
    );
  }

  // Host created the match but no opponent has joined yet.
  if (game.waitingForOpponent) {
    return (
      <div className="relative">
        {back}
        <OnlineWaiting game={game} />
      </div>
    );
  }

  if (!game.state || !game.me) {
    return (
      <CasinoTable>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
        </div>
      </CasinoTable>
    );
  }

  let screen;
  switch (game.state.phase) {
    case "character":
      screen = <OnlineCharacterScreen game={game} />;
      break;
    case "shop":
      screen = <OnlineShopScreen game={game} />;
      break;
    case "play":
      screen = <OnlinePlayScreen game={game} />;
      break;
    case "showdown":
      screen = <OnlineShowdownScreen game={game} />;
      break;
    case "match-end":
      screen = <OnlineMatchEndScreen game={game} />;
      break;
    default:
      screen = <OnlineCharacterScreen game={game} />;
  }

  return <div className="relative">{screen}{back}</div>;
}
