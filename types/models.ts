// Convenience aliases derived from the generated Supabase types.
// Lives outside database.ts so `npm run types` never overwrites it.
import type { Database } from "./database";

export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

/**
 * "Groups" is what these are called in the product now. The table is still
 * `categories` — renaming it is a migration for later, and this alias lets the
 * UI speak the new word without one.
 */
export type GroupRow = CategoryRow;

export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];
export type ProjectStatus = Database["public"]["Enums"]["project_status"];
export type RecurFreq = Database["public"]["Enums"]["recur_freq"];

/** A task plus its (optional) category + recurrence rule — the UI shape. */
export type Task = TaskRow & {
  category: Pick<CategoryRow, "id" | "name" | "color" | "icon"> | null;
  recurrence?: { frequency: RecurFreq; interval: number } | null;
};

/** Minimal project shape for pickers. */
export interface ProjectOption {
  id: string;
  name: string;
}
