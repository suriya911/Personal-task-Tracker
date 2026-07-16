import { createHash } from "node:crypto";
import { subDays, parseISO, format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getOccurrencesBetween, type RecurrenceRule } from "@/lib/recurrence";

/**
 * Deterministic UUID (v5-style) from a rule + date. Concurrent materialize
 * calls (Next fires several prefetch/render requests at once) compute the same
 * id, so their inserts collide on the primary key and only one survives — no
 * duplicate instances, no DB migration required.
 */
function instanceId(ruleId: string, date: string): string {
  const h = createHash("sha1").update(`${ruleId}:${date}`).digest("hex");
  return (
    `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-` +
    `8${h.slice(17, 20)}-${h.slice(20, 32)}`
  );
}

/**
 * Lazily materialize recurring tasks on read. For each template, ensure the
 * most recent occurrence on/before `today` exists as a concrete instance.
 * Idempotent — safe to call on every Today load. No backlog: miss a week, you
 * get the current occurrence, not seven.
 */
export async function materializeRecurring(today: string): Promise<void> {
  const supabase = await createClient();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: templates } = await supabase
    .from("tasks")
    .select(
      "id, title, category_id, priority, is_important, recurrence_id, rule:recurrence_rules(*)",
    )
    .eq("is_recurrence_template", true)
    .not("recurrence_id", "is", null);

  if (!templates) return;

  // Look back a bounded window so daily rules with old anchors stay cheap.
  const windowStart = format(subDays(parseISO(today), 366), "yyyy-MM-dd");

  for (const tpl of templates) {
    const rule = (tpl as { rule: RecurrenceRule | null }).rule;
    if (!rule) continue;

    const occ = getOccurrencesBetween(rule, windowStart, today);
    const target = occ[occ.length - 1];
    if (!target) continue;

    // Fast path: skip if an instance already exists for this occurrence.
    const { count } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("recurrence_id", tpl.recurrence_id!)
      .eq("due_date", target)
      .eq("is_recurrence_template", false);

    if ((count ?? 0) > 0) continue;

    // Deterministic id makes concurrent inserts collide instead of duplicating.
    const { error } = await supabase.from("tasks").insert({
      id: instanceId(tpl.recurrence_id!, target),
      user_id: user.id,
      title: tpl.title,
      category_id: tpl.category_id,
      priority: tpl.priority,
      is_important: tpl.is_important,
      recurrence_id: tpl.recurrence_id,
      is_recurrence_template: false,
      due_date: target,
    });

    // 23505 = unique_violation: another concurrent request already created it.
    if (error && error.code !== "23505") {
      console.error("materializeRecurring insert failed:", error.message);
    }
  }
}
