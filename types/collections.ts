// Hand-written to match supabase/migrations/0001_collections.sql.
// `npm run types` regenerates database.ts from the live schema; these live
// outside it so a regeneration never clobbers them.

export const COLLECTION_KINDS = [
  "application",
  "info",
  "learning",
  "book",
  "game",
  "movie",
  "wish",
] as const;
export type CollectionKind = (typeof COLLECTION_KINDS)[number];

export const COLLECTION_STATUSES = [
  "backlog",
  "active",
  "done",
  "interview",
  "offer",
  "rejected",
] as const;
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
  source: string | null;
  url: string | null;
  price: number | null;
  rating: number | null;
  due_on: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  /** Joined group (the row formerly known as a category). */
  group: { id: string; name: string; color: string } | null;
}

export const KIND_LABELS: Record<CollectionKind, string> = {
  application: "Applications",
  info: "To check",
  learning: "Learning",
  book: "Books",
  game: "Games",
  movie: "Movies",
  wish: "Wish list",
};

/**
 * Which states each kind actually offers, in the order they progress. Only
 * applications use the interview/offer/rejected tail — everywhere else those
 * would be noise in the dropdown.
 */
export const KIND_STATUSES: Record<CollectionKind, CollectionStatus[]> = {
  application: ["backlog", "active", "interview", "offer", "rejected", "done"],
  info: ["backlog", "active", "done"],
  learning: ["backlog", "active", "done"],
  book: ["backlog", "active", "done"],
  game: ["backlog", "active", "done"],
  movie: ["backlog", "active", "done"],
  wish: ["backlog", "active", "done"],
};

/** The same state reads differently depending on what it's describing. */
export const STATUS_LABELS: Record<
  CollectionKind,
  Partial<Record<CollectionStatus, string>>
> = {
  application: {
    backlog: "Saved",
    active: "Applied",
    interview: "Interviewing",
    offer: "Offer",
    rejected: "Rejected",
    done: "Closed",
  },
  info: { backlog: "To check", active: "Checking", done: "Verified" },
  learning: { backlog: "To learn", active: "Learning", done: "Learned" },
  book: { backlog: "To read", active: "Reading", done: "Read" },
  game: { backlog: "Backlog", active: "Playing", done: "Finished" },
  movie: { backlog: "Watchlist", active: "Watching", done: "Watched" },
  wish: { backlog: "Ideas", active: "Saved", done: "Bought" },
};

/** `source` is one column wearing seven hats; this is the hat. */
export const SOURCE_LABELS: Record<CollectionKind, string | null> = {
  application: "Company",
  info: "Where to check",
  learning: "Platform",
  book: "Author",
  game: "Platform",
  movie: "Where to watch",
  wish: "Shop",
};

/** Which kinds show a deadline field, and what to call it. */
export const DUE_LABELS: Partial<Record<CollectionKind, string>> = {
  application: "Deadline",
  book: "Return by",
  learning: "Target date",
};

/** Only the wish list talks about money. */
export const SHOWS_PRICE: CollectionKind[] = ["wish"];

/** A state that means the item is finished with, however it ended. */
export function isClosed(status: CollectionStatus): boolean {
  return status === "done" || status === "rejected";
}
