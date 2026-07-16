import { createClient } from "@/lib/supabase/server";
import type { CategoryRow } from "@/types/models";

export async function getCategories(): Promise<CategoryRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("position", { ascending: true });

  return data ?? [];
}
