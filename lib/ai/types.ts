import { z } from "zod";

/** One task the assistant proposes from an image. */
export const aiTaskSchema = z.object({
  title: z.string().trim().min(1).max(500),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  notes: z.string().max(2000).nullable().optional(),
});

export const aiPlanSchema = z.object({
  summary: z.string().max(600),
  tasks: z.array(aiTaskSchema).max(20),
});

export type AiTask = z.infer<typeof aiTaskSchema>;
export type AiPlan = z.infer<typeof aiPlanSchema>;

/** Any vision provider (Gemini today, Groq/Claude tomorrow) implements this. */
export interface AiProvider {
  /**
   * Given an image + today's date, return a short summary and a set of
   * scheduled tasks. The image is passed transiently and never persisted.
   */
  planFromImage(input: {
    base64: string;
    mimeType: string;
    today: string;
    hint?: string;
  }): Promise<AiPlan>;
}
