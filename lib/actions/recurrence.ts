"use server";

import { revalidatePath } from "next/cache";
import { parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { buildRuleFields } from "@/lib/recurrence";
import { todayStr } from "@/lib/tasks";

type Freq = "daily" | "weekly" | "monthly" | "yearly";
type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Turn a task into a recurring template (or stop it recurring).
 * Anchor + day-of-week/day-of-month are derived from the task's due date.
 */
export async function setTaskRecurrence(
  taskId: string,
  frequency: Freq | null,
  interval = 1,
): Promise<ActionResult> {
  const safeInterval = Math.max(1, Math.floor(interval));
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not signed in" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: task } = await supabase
    .from("tasks")
    .select("id, due_date, recurrence_id")
    .eq("id", taskId)
    .single();
  if (!task) return { ok: false, error: "Task not found" };

  // Stop recurring: detach EVERY task on this rule (template + instances),
  // then delete the rule. The tasks live on as plain one-offs.
  if (frequency === null) {
    if (task.recurrence_id) {
      await supabase
        .from("tasks")
        .update({ recurrence_id: null, is_recurrence_template: false })
        .eq("recurrence_id", task.recurrence_id);
      await supabase
        .from("recurrence_rules")
        .delete()
        .eq("id", task.recurrence_id);
    }
    revalidatePath("/", "layout");
    return { ok: true };
  }

  // Already recurring: update the SHARED rule in place — never create a second
  // rule or flip an instance into another template. Keep the rule's anchor.
  if (task.recurrence_id) {
    const { data: rule } = await supabase
      .from("recurrence_rules")
      .select("anchor_date")
      .eq("id", task.recurrence_id)
      .single();
    const anchorDate = parseISO(rule?.anchor_date ?? task.due_date ?? todayStr());
    const { error } = await supabase
      .from("recurrence_rules")
      .update({ frequency, ...buildRuleFields(frequency, safeInterval, anchorDate) })
      .eq("id", task.recurrence_id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/", "layout");
    return { ok: true };
  }

  // Brand-new recurrence: create the rule and make THIS task the template.
  const anchor = task.due_date ?? todayStr();
  const anchorDate = parseISO(anchor);
  const { data: rule, error: insErr } = await supabase
    .from("recurrence_rules")
    .insert({
      user_id: user.id,
      frequency,
      anchor_date: anchor,
      ...buildRuleFields(frequency, safeInterval, anchorDate),
    })
    .select("id")
    .single();
  if (insErr) return { ok: false, error: insErr.message };

  const { error } = await supabase
    .from("tasks")
    .update({ recurrence_id: rule.id, is_recurrence_template: true })
    .eq("id", taskId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
