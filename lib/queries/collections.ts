import { cache } from "react";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import {
  COLLECTION_KINDS,
  type CollectionItem,
  type CollectionKind,
} from "@/types/collections";
import { untyped } from "@/lib/supabase/untyped";

const SELECT = "*, group:categories(id, name, color)";

/**
 * Every collection item, grouped by kind.
 *
 * Reads defensively: until 0001_collections.sql has been applied the table
 * doesn't exist, and the app should show empty lists rather than a 500.
 */
export const getCollections = cache(async function getCollections(): Promise<{
  authed: boolean;
  ready: boolean;
  byKind: Record<CollectionKind, CollectionItem[]>;
  tags: string[];
}> {
  // Built from the kind list so adding a kind can never leave a hole here.
  const blank = () =>
    Object.fromEntries(
      COLLECTION_KINDS.map((k) => [k, [] as CollectionItem[]]),
    ) as unknown as Record<CollectionKind, CollectionItem[]>;
  const empty = blank();

  const supabase = await createClient();
  if (!supabase) return { authed: false, ready: false, byKind: empty, tags: [] };

  const user = await getSessionUser();
  if (!user) return { authed: false, ready: false, byKind: empty, tags: [] };

  const { data, error } = await untyped(supabase)
    .from("collection_items")
    .select(SELECT)
    .order("position")
    .order("created_at", { ascending: false });

  // The migration hasn't been run yet. PostgREST answers PGRST205 ("not in
  // the schema cache") rather than Postgres's own 42P01, so check both —
  // matching only 42P01 makes the page look functional while every save fails.
  if (error) {
    const missing = error.code === "PGRST205" || error.code === "42P01";
    return { authed: true, ready: !missing, byKind: empty, tags: [] };
  }

  const rows = (data ?? []) as unknown as CollectionItem[];
  const byKind = blank();
  for (const r of rows) byKind[r.kind]?.push(r);

  // Every tag in use, for the filter row.
  const tags = [...new Set(rows.flatMap((r) => r.tags ?? []))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );

  return { authed: true, ready: true, byKind, tags };
});
