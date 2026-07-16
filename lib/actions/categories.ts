"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, userId: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

const categorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Hex color required"),
  icon: z.string().max(40).optional(),
});

export async function createCategory(input: {
  name: string;
  color: string;
  icon?: string;
}): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };

  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return { ok: false, error: "Not signed in" };

  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true });

  const { error } = await supabase.from("categories").insert({
    user_id: userId,
    name: parsed.data.name,
    color: parsed.data.color,
    icon: parsed.data.icon ?? "folder",
    position: count ?? 0,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateCategory(
  id: string,
  input: { name?: string; color?: string; icon?: string },
): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return { ok: false, error: "Not signed in" };

  const { error } = await supabase
    .from("categories")
    .update(input)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return { ok: false, error: "Not signed in" };

  // FK is ON DELETE SET NULL — tasks keep existing, lose their category.
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
