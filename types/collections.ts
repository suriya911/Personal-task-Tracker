// Hand-written to match supabase/migrations/0001_collections.sql.
// `npm run types` regenerates database.ts from the live schema; these live
// outside it so a regeneration never clobbers them.

export const COLLECTION_KINDS = ["game", "movie", "wish"] as const;
export type CollectionKind = (typeof COLLECTION_KINDS)[number];

export const COLLECTION_STATUSES = ["backlog", "active", "done"] as const;
export type CollectionStatus = (typeof COLLECTION_STATUSES)[number];

export interface CollectionItem {
  id: string;
  user_id: string;
  kind: CollectionKind;
  status: CollectionStatus;
  title: string;
  notes: string | null;
  group_id: string | null;
  tags: string[];
  where_to_watch: string | null;
  price: number | null;
  url: string | null;
  rating: number | null;
  position: number;
  created_at: string;
  updated_at: string;
  /** Joined group (the row formerly known as a category). */
  group: { id: string; name: string; color: string } | null;
}

/** One set of states covers all three kinds; only the wording changes. */
export const STATUS_LABELS: Record<
  CollectionKind,
  Record<CollectionStatus, string>
> = {
  game: { backlog: "Backlog", active: "Playing", done: "Finished" },
  movie: { backlog: "Watchlist", active: "Watching", done: "Watched" },
  wish: { backlog: "Ideas", active: "Saved", done: "Bought" },
};

export const KIND_LABELS: Record<CollectionKind, string> = {
  game: "Games",
  movie: "Movies",
  wish: "Wish list",
};
