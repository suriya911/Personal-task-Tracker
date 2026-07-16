"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, userId: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

const projectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000).nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  status: z.enum(["active", "paused", "done"]).default("active"),
});

export async function createProject(input: {
  name: string;
  description?: string | null;
  category_id?: string | null;
}): Promise<ActionResult> {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };

  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return { ok: false, error: "Not signed in" };

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      category_id: parsed.data.category_id ?? null,
      status: parsed.data.status,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, id: data.id };
}

export async function updateProject(
  id: string,
  input: {
    name?: string;
    description?: string | null;
    category_id?: string | null;
    status?: "active" | "paused" | "done";
  },
): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return { ok: false, error: "Not signed in" };

  const { error } = await supabase.from("projects").update(input).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return { ok: false, error: "Not signed in" };

  // FK on tasks is ON DELETE CASCADE — its tasks go too.
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
