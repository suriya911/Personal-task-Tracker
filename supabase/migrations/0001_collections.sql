-- Collections: games, movies, and a wish list.
--
-- These are task-like but not tasks: a film has no due date, it has a place
-- you can watch it; a wish-list entry has a price. They live in their own
-- table so the tasks table doesn't grow a column per hobby.
--
-- Run this once in the Supabase SQL editor (or `supabase db push`).

create type collection_kind as enum ('game', 'movie', 'wish');

-- Deliberately generic wording so one set of states covers all three kinds:
--   game  → backlog / playing  / finished
--   movie → backlog / watching / watched
--   wish  → backlog / saved    / bought
create type collection_status as enum ('backlog', 'active', 'done');

create table if not exists public.collection_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,

  kind        collection_kind   not null,
  status      collection_status not null default 'backlog',
  title       text              not null,
  notes       text,

  -- One group per item (what used to be "category"), plus free-form tags.
  group_id    uuid references public.categories (id) on delete set null,
  tags        text[] not null default '{}',

  -- Kind-specific, all optional: a movie fills `where_to_watch`, a wish-list
  -- entry fills `price` and `url`, either may carry a rating.
  where_to_watch text,
  price          numeric(10, 2),
  url            text,
  rating         smallint check (rating between 1 and 5),

  position    integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.collection_items enable row level security;

create policy "own collection items"
  on public.collection_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Every read is "my items of this kind".
create index if not exists collection_items_user_kind_idx
  on public.collection_items (user_id, kind, position);

-- Tag filtering wants a GIN index to stay cheap as the list grows.
create index if not exists collection_items_tags_idx
  on public.collection_items using gin (tags);
