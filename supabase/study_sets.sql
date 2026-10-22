-- study_sets: spelling lists and flashcard decks built from Emma's and Liam's
-- Google Classroom by the homework job on the family PC
-- (C:\Dev\personal\Emma & Liam\homework\scripts\study.mjs).
-- Spell Quest and Flash Quest read them with the anon key; only the job
-- (service role) writes.
--   kind 'spelling': data = { words: [{ word, sentence }] }
--   kind 'deck':     data = { cards: [{ term, definition, wrong: [3 wrong definitions] }] }
create table if not exists public.study_sets (
  id         text        primary key,
  kid        text        not null,
  kind       text        not null check (kind in ('spelling', 'deck')),
  name       text        not null,
  subject    text,
  test_date  date,
  data       jsonb       not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists study_sets_kid_kind_idx on public.study_sets (kid, kind);

alter table public.study_sets enable row level security;

drop policy if exists "Games can read study sets" on public.study_sets;
create policy "Games can read study sets" on public.study_sets
  for select to anon, authenticated using (true);
