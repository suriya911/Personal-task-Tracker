-- Collections: things you track rather than things you do.
--
-- A task has a deadline, gets completed, and disappears. A collection item
-- sits in a state you revisit and browse — a film you'll watch eventually, a
-- job you've applied for, a book you're part-way through. Keeping them out of
-- the tasks table is what stops them decaying into overdue guilt.
--
-- Run this once in the Supabase SQL editor (or `supabase db push`).

create type collection_kind as enum (
  'game',
  'movie',
  'wish',
  'application',  -- jobs, fellowships, uni programmes
  'info',         -- things to look up and verify
  'learning',     -- skills, courses, topics
  'book'          -- books and papers
);

-- One status set covers every kind; each kind shows only the states that make
-- sense for it and renames them (backlog reads as "Watchlist" for a film and
-- "Saved" for an application). The application-only states are what let a job
-- hunt actually be tracked rather than just listed.
create type collection_status as enum (
  'backlog',
  'active',
  'done',
  'interview',
  'offer',
  'rejected'
);

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

  -- Deliberately generic, relabelled per kind rather than one column per
  -- hobby: `source` is "where to watch" for a film, the company for an
  -- application, the author for a book, the platform for a course.
  source      text,
  url         text,
  price       numeric(10, 2),
  rating      smallint check (rating between 1 and 5),
  due_on      date,          -- application deadline, return-by date, etc.

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
