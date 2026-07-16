import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(500),
  description: z.string().max(5000).nullable().optional(),
  due_date: z.string().nullable().optional(),
  due_time: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  is_important: z.boolean().default(false),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type UpdateTaskInput = z.input<typeof updateTaskSchema>;
