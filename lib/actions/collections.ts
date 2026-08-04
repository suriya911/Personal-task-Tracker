"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { COLLECTION_KINDS, COLLECTION_STATUSES } from "@/types/collections";
import { untyped } from "@/lib/supabase/untyped";

type Result = { ok: true } | { ok: false; error: string };

const MIGRATION_HINT =
  "Collections table is missing — run supabase/migrations/0001_collections.sql";

const itemSchema = z.object({
  kind: z.enum(COLLECTION_KINDS),
  status: z.enum(COLLECTION_STATUSES).default("backlog"),
  title: z.string().trim().min(1, "Title required").max(300),
  notes: z.string().max(2000).nullable().optional(),
  group_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  source: z.string().trim().max(200).nullable().optional(),
  due_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  price: z.number().nonnegative().max(9_999_999).nullable().optional(),
  url: z.string().trim().url().max(2000).nullable().optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

export type CollectionInput = z.input<typeof itemSchema>;

function revalidateAll() {
  revalidatePath("/collections");
  revalidatePath("/dashboard");
}

export async function createCollectionItem(
  input: CollectionInput,
): Promise<Result> {
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }

  const supabase = await createClient();
  const user = await getSessionUser();
  if (!supabase || !user) return { ok: false, error: "Not signed in" };

  const { url, ...rest } = parsed.data;
  const { error } = await untyped(supabase).from("collection_items").insert({
    ...rest,
    url: url || null,
    user_id: user.id,
  });

  if (error) {
    const missing = error.code === "PGRST205" || error.code === "42P01";
    return { ok: false, error: missing ? MIGRATION_HINT : error.message };
  }
  revalidateAll();
  return { ok: true };
}

export async function updateCollectionItem(
  id: string,
  patch: Partial<CollectionInput>,
): Promise<Result> {
  const parsed = itemSchema.partial().safeParse(patch);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }

  const supabase = await createClient();
  const user = await getSessionUser();
  if (!supabase || !user) return { ok: false, error: "Not signed in" };

  const { error } = await untyped(supabase)
    .from("collection_items")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function deleteCollectionItem(id: string): Promise<Result> {
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!supabase || !user) return { ok: false, error: "Not signed in" };

  const { error } = await untyped(supabase).from("collection_items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}
