"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ai, aiConfigured } from "@/lib/ai";
import { aiTaskSchema, type AiPlan, type AiTask } from "@/lib/ai/types";
import { createTask } from "@/lib/actions/tasks";
import { todayStr } from "@/lib/tasks";
import { z } from "zod";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

type PlanResult = { ok: true; plan: AiPlan } | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Analyze an image and return a proposed task plan. The image is handled
 * transiently — sent to the AI provider and then discarded. It is NEVER
 * written to the database or storage.
 */
export async function planFromImage(input: {
  base64: string;
  mimeType: string;
  hint?: string;
}): Promise<PlanResult> {
  if (!aiConfigured()) return { ok: false, error: "AI is not configured yet" };

  const userId = await requireUser();
  if (!userId) return { ok: false, error: "Not signed in" };

  if (!ALLOWED.includes(input.mimeType)) {
    return { ok: false, error: "Unsupported image type" };
  }
  // base64 is ~4/3 of the raw byte size.
  if ((input.base64.length * 3) / 4 > MAX_BYTES) {
    return { ok: false, error: "Image exceeds 5 MB" };
  }

  try {
    const plan = await ai.planFromImage({
      base64: input.base64,
      mimeType: input.mimeType,
      today: todayStr(),
      hint: input.hint,
    });
    return { ok: true, plan };
    // `input.base64` goes out of scope here — nothing persisted.
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "AI failed" };
  }
}

/** Create the user-approved tasks. Reuses createTask (auto-categorizes). */
export async function commitAiTasks(
  tasks: AiTask[],
): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  const parsed = z.array(aiTaskSchema).max(20).safeParse(tasks);
  if (!parsed.success) return { ok: false, error: "Invalid tasks" };

  const userId = await requireUser();
  if (!userId) return { ok: false, error: "Not signed in" };

  let created = 0;
  for (const t of parsed.data) {
    const res = await createTask({
      title: t.title,
      priority: t.priority,
      due_date: t.due_date ?? null,
      description: t.notes ?? null,
    });
    if (res.ok) created += 1;
  }

  revalidatePath("/", "layout");
  return { ok: true, created };
}
