"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createTaskSchema, updateTaskSchema } from "@/lib/validations";
import { todayStr, nextPostpone } from "@/lib/tasks";
import { categorizeTask } from "@/lib/categorize";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validations";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/important");
}

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, userId: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

/** Quick-add / dialog create. Defaults a bare quick-add to "due today". */
export async function createTask(input: CreateTaskInput): Promise<ActionResult> {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid task" };
  }

  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return { ok: false, error: "Not signed in" };

  const { title, priority, is_important, category_id, project_id, description } =
    parsed.data;
  // Bare quick-add defaults to "due today"; project quick-add passes null.
  const due_date =
    parsed.data.due_date === undefined ? todayStr() : parsed.data.due_date;

  // Auto-categorize from the title when the caller didn't pick a category.
  let finalCategoryId = category_id ?? null;
  if (!finalCategoryId) {
    const { data: cats } = await supabase
      .from("categories")
      .select("id, name")
      .order("position");
    finalCategoryId = categorizeTask(title, cats ?? []);
  }

  const { error } = await supabase.from("tasks").insert({
    user_id: userId,
    title,
    description: description ?? null,
    priority,
    is_important,
    category_id: finalCategoryId,
    project_id: project_id ?? null,
    due_date,
  });

  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function toggleComplete(
  id: string,
  done: boolean,
): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return { ok: false, error: "Not signed in" };

  const { error } = await supabase
    .from("tasks")
    .update({
      status: done ? "done" : "todo",
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return { ok: false, error: "Not signed in" };

  // Purge any attachment blobs from Storage first (rows cascade with the task).
  const { data: files } = await supabase
    .from("task_attachments")
    .select("storage_path")
    .eq("task_id", id);
  if (files && files.length > 0) {
    await supabase.storage
      .from("task-attachments")
      .remove(files.map((f) => f.storage_path));
  }

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

/** Full edit from the task dialog. */
export async function updateTask(input: UpdateTaskInput): Promise<ActionResult> {
  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid task" };
  }

  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return { ok: false, error: "Not signed in" };

  const { id, ...fields } = parsed.data;

  const { error } = await supabase.from("tasks").update(fields).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

type Snapshot = {
  due_date: string | null;
  original_due_date: string | null;
  postponed_count: number;
};

type PostponeResult =
  | { ok: true; prev: Snapshot }
  | { ok: false; error: string };

/** Signature action: push a task to tomorrow, tracking the postpone count. */
export async function postponeTask(id: string): Promise<PostponeResult> {
  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return { ok: false, error: "Not signed in" };

  const { data: task, error: readErr } = await supabase
    .from("tasks")
    .select("due_date, original_due_date, postponed_count")
    .eq("id", id)
    .single();

  if (readErr || !task) {
    return { ok: false, error: readErr?.message ?? "Task not found" };
  }

  const prev: Snapshot = {
    due_date: task.due_date,
    original_due_date: task.original_due_date,
    postponed_count: task.postponed_count,
  };

  const next = nextPostpone(prev);

  const { error } = await supabase
    .from("tasks")
    .update({
      due_date: next.due_date,
      postponed_count: next.postponed_count,
      original_due_date: next.original_due_date,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true, prev };
}

/** Undo a postpone by restoring the pre-postpone snapshot. */
export async function restorePostpone(
  id: string,
  prev: Snapshot,
): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return { ok: false, error: "Not signed in" };

  const { error } = await supabase
    .from("tasks")
    .update({
      due_date: prev.due_date,
      original_due_date: prev.original_due_date,
      postponed_count: prev.postponed_count,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}
