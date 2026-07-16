import { createClient } from "@/lib/supabase/server";
import { taskComparator } from "@/lib/tasks";
import type { Task } from "@/types/models";
import type { Database } from "@/types/database";

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

const SELECT =
  "*, category:categories(id, name, color, icon), recurrence:recurrence_rules(frequency, interval)";

export async function getProjects(): Promise<
  (ProjectRow & { taskCount: number; doneCount: number })[]
> {
  const supabase = await createClient();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: projects }, { data: tasks }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at"),
    supabase.from("tasks").select("project_id, status"),
  ]);

  return (projects ?? []).map((p) => {
    const own = (tasks ?? []).filter((t) => t.project_id === p.id);
    return {
      ...p,
      taskCount: own.length,
      doneCount: own.filter((t) => t.status === "done").length,
    };
  });
}

export async function getProject(id: string): Promise<{
  authed: boolean;
  project: ProjectRow | null;
  tasks: Task[];
}> {
  const supabase = await createClient();
  if (!supabase) return { authed: false, project: null, tasks: [] };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { authed: false, project: null, tasks: [] };

  const [{ data: project }, { data: tasks }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("tasks")
      .select(SELECT)
      .eq("project_id", id)
      .is("parent_task_id", null).eq("is_recurrence_template", false),
  ]);

  return {
    authed: true,
    project: project ?? null,
    tasks: ((tasks as Task[] | null) ?? []).slice().sort(taskComparator),
  };
}
