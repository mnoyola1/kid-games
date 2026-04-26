-- Cipher Heist - Supabase schema
--
-- Apply this once in the Supabase SQL editor for the n-games project
-- (https://hfxpanawthmegtbzhxlj.supabase.co).
--
-- Design rules (per spec section 6):
--   * vault_code is server-authoritative — column-level RLS hides it from clients.
--   * All write paths flow through the service-role API in api/cipher-heist/*.
--   * Public broadcasts (cipher_heist_events) NEVER include vault codes or
--     server-only data.

-- ============================================================
-- 1) Sessions table
-- ============================================================

create table if not exists public.cipher_heist_sessions (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,                  -- 4-letter join code (UPPERCASE)
  host_id     text,                                  -- profile id of host (string, hub uses string IDs)
  status      text not null default 'lobby',         -- 'lobby' | 'playing' | 'ended'
  pack_id     text not null default 'math',
  grade_tier  text not null default 'tier3',         -- 'tier3' | 'tier5'
  duration_sec integer not null default 300,
  started_at  timestamptz,
  ends_at     timestamptz,
  ended_at    timestamptz,
  winner_id   text,
  settings    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists cipher_heist_sessions_code_idx on public.cipher_heist_sessions (code);
create index if not exists cipher_heist_sessions_status_idx on public.cipher_heist_sessions (status);

-- ============================================================
-- 2) Players table
-- ============================================================

create table if not exists public.cipher_heist_players (
  session_id  uuid not null references public.cipher_heist_sessions(id) on delete cascade,
  profile_id  text not null,
  name        text not null default 'Agent',
  avatar      text not null default '🧑',
  is_bot      boolean not null default false,
  bot_type    text,
  bits        integer not null default 0,
  firewalls   integer not null default 0,
  vault_code  integer[] check (
    vault_code is null
    or (
      array_length(vault_code, 1) = 3
      and vault_code <@ array[1,2,3,4,5,6,7,8,9]
    )
  ),
  pending_action      text,                       -- null | 'unlocked' | 'crack-pending'
  pending_action_type text,                       -- 'regular' | 'bonus'
  active_question     jsonb,                      -- current question pose for this player
  bonus_gate_used     boolean not null default true,
  bonus_gate_at       timestamptz,
  last_correct_at     timestamptz,
  last_crack_at       timestamptz,
  stats               jsonb not null default '{}'::jsonb,
  online              boolean not null default true,
  joined_at           timestamptz not null default now(),
  primary key (session_id, profile_id)
);

create index if not exists cipher_heist_players_session_idx on public.cipher_heist_players (session_id);

-- ============================================================
-- 3) Events table (public broadcast log)
-- ============================================================

create table if not exists public.cipher_heist_events (
  id          bigserial primary key,
  session_id  uuid not null references public.cipher_heist_sessions(id) on delete cascade,
  kind        text not null,                       -- 'game_start' | 'answer_correct' | 'crack_success' | ...
  actor_id    text,
  target_id   text,
  payload     jsonb not null default '{}'::jsonb,  -- public-safe payload (no vault codes)
  created_at  timestamptz not null default now()
);

create index if not exists cipher_heist_events_session_idx on public.cipher_heist_events (session_id, id);

-- ============================================================
-- 4) Crack history table (per attacker -> target log)
-- ============================================================

create table if not exists public.cipher_heist_crack_history (
  id          bigserial primary key,
  session_id  uuid not null references public.cipher_heist_sessions(id) on delete cascade,
  attacker_id text not null,
  target_id   text not null,
  guess       integer[] not null,
  feedback    text[] not null,                     -- 'exact' | 'partial' | 'miss'
  created_at  timestamptz not null default now()
);

create index if not exists cipher_heist_crack_history_session_idx on public.cipher_heist_crack_history (session_id);

-- ============================================================
-- 5) updated_at trigger
-- ============================================================

create or replace function public.cipher_heist_touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists cipher_heist_sessions_touch on public.cipher_heist_sessions;
create trigger cipher_heist_sessions_touch
  before update on public.cipher_heist_sessions
  for each row execute function public.cipher_heist_touch_updated_at();

-- ============================================================
-- 6) Row Level Security
--
-- Strategy:
--   - Anyone (anon role) can READ sessions / players / events / crack_history,
--     but the `vault_code`, `active_question` (only owner), and `bonus_gate_*`
--     columns are denied to anon clients via column grants.
--   - All WRITES are restricted to the service role (the API).
-- ============================================================

alter table public.cipher_heist_sessions       enable row level security;
alter table public.cipher_heist_players        enable row level security;
alter table public.cipher_heist_events         enable row level security;
alter table public.cipher_heist_crack_history  enable row level security;

-- Sessions: read-only for anon
drop policy if exists cipher_heist_sessions_read on public.cipher_heist_sessions;
create policy cipher_heist_sessions_read on public.cipher_heist_sessions
  for select using (true);

-- Players: read-only for anon (column grants restrict vault_code etc.)
drop policy if exists cipher_heist_players_read on public.cipher_heist_players;
create policy cipher_heist_players_read on public.cipher_heist_players
  for select using (true);

-- Events: read-only for anon
drop policy if exists cipher_heist_events_read on public.cipher_heist_events;
create policy cipher_heist_events_read on public.cipher_heist_events
  for select using (true);

-- Crack history: read-only for anon
drop policy if exists cipher_heist_crack_history_read on public.cipher_heist_crack_history;
create policy cipher_heist_crack_history_read on public.cipher_heist_crack_history
  for select using (true);

-- Service role bypasses RLS by default; explicit deny for anon writes is the
-- table-level RLS not having a permissive policy for insert/update/delete.

-- ============================================================
-- 7) Column-level grants — hide secrets from anon
--
-- Postgres allows column-level select grants. We REVOKE select on the secret
-- columns from anon (and authenticated) so they're projected as null in any
-- direct SELECT (or refused entirely depending on the driver).
--
-- The API uses the service role and reads everything.
-- ============================================================

revoke select (vault_code) on public.cipher_heist_players from anon;
revoke select (vault_code) on public.cipher_heist_players from authenticated;

revoke select (active_question) on public.cipher_heist_players from anon;
revoke select (active_question) on public.cipher_heist_players from authenticated;

revoke select (bonus_gate_used, bonus_gate_at) on public.cipher_heist_players from anon;
revoke select (bonus_gate_used, bonus_gate_at) on public.cipher_heist_players from authenticated;

-- Allow service_role full access (default behavior, but explicit for clarity).
grant all on public.cipher_heist_sessions       to service_role;
grant all on public.cipher_heist_players        to service_role;
grant all on public.cipher_heist_events         to service_role;
grant all on public.cipher_heist_crack_history  to service_role;

-- ============================================================
-- 8) Realtime: enable broadcast on the public-safe tables
-- ============================================================

-- Enable Realtime publication for these tables (Supabase ships with the
-- `supabase_realtime` publication out of the box).
alter publication supabase_realtime add table public.cipher_heist_sessions;
alter publication supabase_realtime add table public.cipher_heist_players;
alter publication supabase_realtime add table public.cipher_heist_events;
alter publication supabase_realtime add table public.cipher_heist_crack_history;

-- Done. The API in api/cipher-heist/* now has the service-role authority
-- needed to enforce all spec-section-6 anti-exploit rules.
