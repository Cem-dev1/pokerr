-- ============================================================================
-- Casino Poker — Online multiplayer schema (Supabase / Postgres)
-- ----------------------------------------------------------------------------
-- Run in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Idempotent: safe to re-run (create-if-not-exists + add-column-if-not-exists).
--
-- PREREQUISITE (dashboard, once):
--   Authentication → Sign In / Providers → "Anonymous" → Enable
-- ============================================================================

-- ---------- players ----------
create table if not exists public.players (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique,           -- auth.users.id (anon or real)
  username     text not null default 'Oyuncu',
  character_id text not null default 'gambler',
  avatar       text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- matches ----------
create table if not exists public.matches (
  id          uuid primary key default gen_random_uuid(),
  player1_id  uuid references public.players(id) on delete set null,
  player2_id  uuid references public.players(id) on delete set null,
  winner_id   uuid references public.players(id) on delete set null,
  status      text not null default 'waiting',  -- waiting | active | finished
  round       int  not null default 1,
  phase       text not null default 'character',-- mirror of match_states.phase (lobby meta)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- match_states (single row per match; the live game) ----------
create table if not exists public.match_states (
  match_id                uuid primary key references public.matches(id) on delete cascade,
  phase                   text not null default 'character', -- character|shop|play|showdown|match-end
  round                   int  not null default 1,

  player1_character       text,
  player2_character       text,
  player1_ready           boolean not null default false,
  player2_ready           boolean not null default false,
  player1_played          boolean not null default false,
  player2_played          boolean not null default false,

  player1_chips           int  not null default 0,
  player2_chips           int  not null default 0,
  player1_gold            int  not null default 0,
  player2_gold            int  not null default 0,

  player1_jokers          jsonb not null default '[]',
  player2_jokers          jsonb not null default '[]',
  player1_shop            jsonb not null default '[]',
  player2_shop            jsonb not null default '[]',

  player1_hand            jsonb not null default '[]',
  player2_hand            jsonb not null default '[]',
  player1_deck            jsonb not null default '[]',
  player2_deck            jsonb not null default '[]',
  player1_selected        jsonb not null default '[]',
  player2_selected        jsonb not null default '[]',

  player1_discards_left   int  not null default 3,
  player2_discards_left   int  not null default 3,

  player1_played_cards    jsonb not null default '[]',
  player2_played_cards    jsonb not null default '[]',
  player1_breakdown       jsonb,
  player2_breakdown       jsonb,

  pot                      int  not null default 0,
  match_winner            text,                             -- player1 | player2 | tie
  current_turn            uuid,
  last_action             jsonb,
  updated_at              timestamptz not null default now()
);

-- Bring an existing (older) match_states table up to the full column set.
do $$
declare c text;
begin
  foreach c in array array[
    'phase','round',
    'player1_character','player2_character',
    'player1_ready','player2_ready',
    'player1_played','player2_played',
    'player1_gold','player2_gold',
    'player1_jokers','player2_jokers',
    'player1_shop','player2_shop',
    'player1_deck','player2_deck',
    'player1_selected','player2_selected',
    'player1_discards_left','player2_discards_left',
    'player1_played_cards','player2_played_cards',
    'player1_breakdown','player2_breakdown',
    'pot','match_winner'
  ] loop
    execute format('alter table public.match_states add column if not exists %I jsonb', c)
      when c in ('player1_jokers','player2_jokers','player1_shop','player2_shop',
                 'player1_hand','player2_hand','player1_deck','player2_deck',
                 'player1_selected','player2_selected','player1_played_cards',
                 'player2_played_cards','player1_breakdown','player2_breakdown','last_action');
    execute format('alter table public.match_states add column if not exists %I text', c)
      when c in ('phase','player1_character','player2_character','match_winner');
    execute format('alter table public.match_states add column if not exists %I integer', c)
      when c in ('round','player1_gold','player2_gold','player1_discards_left','player2_discards_left','pot');
    execute format('alter table public.match_states add column if not exists %I boolean', c)
      when c in ('player1_ready','player2_ready','player1_played','player2_played');
  end loop;
end$$;

-- ---------- match_logs ----------
create table if not exists public.match_logs (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  message    text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_matches_status      on public.matches (status);
create index if not exists idx_match_logs_match_id on public.match_logs (match_id);

-- ============================================================================
-- Row Level Security. Online lobby uses anonymous auth → every user is `anon`.
-- Policies are intentionally permissive so the lobby/match flow works for anon.
-- Tighten before production.
-- ============================================================================
alter table public.players      enable row level security;
alter table public.matches      enable row level security;
alter table public.match_states enable row level security;
alter table public.match_logs   enable row level security;

drop policy if exists "players_all_anon"      on public.players;
drop policy if exists "matches_all_anon"      on public.matches;
drop policy if exists "match_states_all_anon" on public.match_states;
drop policy if exists "match_logs_all_anon"   on public.match_logs;

create policy "players_all_anon"      on public.players      for all to anon using (true) with check (true);
create policy "matches_all_anon"      on public.matches      for all to anon using (true) with check (true);
create policy "match_states_all_anon" on public.match_states for all to anon using (true) with check (true);
create policy "match_logs_all_anon"   on public.match_logs   for all to anon using (true) with check (true);

-- Realtime: broadcast changes to subscribed clients.
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.match_states;
alter publication supabase_realtime add table public.match_logs;
