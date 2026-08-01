import { createHash } from "node:crypto";
import { subDays, parseISO, format } from "date-fns";
import { createClient, getSessionUser } from "@/lib/supabase/server";
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
 * A repeating task belongs to its own day. Once that day has passed, an
 * *unfinished* instance is swept away rather than nagging forever in Overdue —
 * tomorrow brings a fresh one. Finished instances are deliberately kept: they
 * carry `completed_at`, which is what the streak and statistics are counted
 * from, and they are invisible in every view anyway (Today filters by
 * `due_date = today`, Overdue by `status = todo`).
 */
async function purgeStaleRecurringInstances(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  today: string,
): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("is_recurrence_template", false)
    .not("recurrence_id", "is", null)
    .eq("status", "todo")
    .lt("due_date", today);

  if (error) console.error("purgeStaleRecurringInstances:", error.message);
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
  const user = await getSessionUser();
  if (!user) return;

  // The purge and the template read don't depend on each other, so they go
  // out together rather than one after the other.
  const [, { data: templates }] = await Promise.all([
    purgeStaleRecurringInstances(supabase, today),
    supabase
      .from("tasks")
      .select(
        "id, title, category_id, priority, is_important, recurrence_id, rule:recurrence_rules(*)",
      )
      .eq("is_recurrence_template", true)
      .not("recurrence_id", "is", null),
  ]);

  if (!templates || templates.length === 0) return;

  // Look back a bounded window so daily rules with old anchors stay cheap.
  const windowStart = format(subDays(parseISO(today), 366), "yyyy-MM-dd");

  // Work out every template's target date first, then settle all of them in
  // one round trip each rather than a serial query-per-template walk.
  const wanted = templates.flatMap((tpl) => {
    const rule = (tpl as { rule: RecurrenceRule | null }).rule;
    if (!rule) return [];
    const occ = getOccurrencesBetween(rule, windowStart, today);
    const target = occ[occ.length - 1];
    return target ? [{ tpl, target }] : [];
  });

  if (wanted.length === 0) return;

  // One query answers "which of these already exist?" for every template.
  const { data: existing } = await supabase
    .from("tasks")
    .select("recurrence_id, due_date")
    .eq("is_recurrence_template", false)
    .in("recurrence_id", wanted.map((w) => w.tpl.recurrence_id!))
    .in("due_date", [...new Set(wanted.map((w) => w.target))]);

  const have = new Set(
    (existing ?? []).map((r) => `${r.recurrence_id}:${r.due_date}`),
  );

  for (const { tpl, target } of wanted) {
    if (have.has(`${tpl.recurrence_id}:${target}`)) continue;

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
