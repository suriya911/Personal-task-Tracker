import { createClient } from "@/lib/supabase/server";
import { todayStr } from "@/lib/tasks";
import type { CategoryRow } from "@/types/models";
import type { ProjectRow } from "@/lib/queries/projects";

export interface SidebarData {
  authed: boolean;
  categories: (CategoryRow & { count: number })[];
  projects: (Pick<ProjectRow, "id" | "name" | "status"> & { count: number })[];
  counts: { today: number; important: number; scheduled: number };
}

const EMPTY: SidebarData = {
  authed: false,
  categories: [],
  projects: [],
  counts: { today: 0, important: 0, scheduled: 0 },
};

export async function getSidebarData(): Promise<SidebarData> {
  const supabase = await createClient();
  if (!supabase) return EMPTY;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  const today = todayStr();

  const [{ data: categories }, { data: projects }, { data: tasks }] =
    await Promise.all([
      supabase.from("categories").select("*").order("position"),
      supabase.from("projects").select("id, name, status").order("created_at"),
      supabase
        .from("tasks")
        .select("due_date, category_id, project_id, is_important")
        .eq("status", "todo")
        .is("parent_task_id", null).eq("is_recurrence_template", false),
    ]);

  const rows = tasks ?? [];

  return {
    authed: true,
    categories: (categories ?? []).map((c) => ({
      ...c,
      count: rows.filter((t) => t.category_id === c.id).length,
    })),
    projects: (projects ?? []).map((p) => ({
      ...p,
      count: rows.filter((t) => t.project_id === p.id).length,
    })),
    counts: {
      today: rows.filter((t) => t.due_date === today).length,
      important: rows.filter((t) => t.is_important).length,
      scheduled: rows.filter((t) => t.due_date && t.due_date > today).length,
    },
  };
}
