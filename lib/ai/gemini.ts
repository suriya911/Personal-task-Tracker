import { aiPlanSchema, type AiProvider, type AiPlan } from "@/lib/ai/types";

// Evergreen alias — always the current fast model, never goes stale.
const MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-latest";
const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

function buildPrompt(today: string, hint?: string): string {
  return [
    "You are a proactive personal assistant inside a task manager.",
    "Look at the image the user shared — it could be an interview invite,",
    "an event, a class schedule, a bill, a flyer, or a to-do screenshot.",
    "Extract concrete, actionable tasks that prepare the user for it.",
    "",
    "Rules:",
    `- Today is ${today} (yyyy-MM-dd). Never schedule anything in the past.`,
    "- If there's a clear event/deadline date, spread prep tasks across the",
    "  days BEFORE it (not all on one day). The final prep goes the day before.",
    "- For an interview: research the company, review the role's core topics,",
    "  prepare STAR stories, do a mock round, rest/logistics the day before.",
    "- Keep each title short and imperative (e.g. 'Research Acme's product').",
    "- priority: high for time-critical/near-term, else medium or low.",
    "- 3–8 tasks is ideal. Don't invent details not implied by the image.",
    hint ? `- Extra context from the user: ${hint}` : "",
    "",
    "Return ONLY JSON matching the schema. 'summary' is one sentence on what",
    "the image is and your plan.",
  ]
    .filter(Boolean)
    .join("\n");
}

// Gemini structured-output schema (OpenAPI subset).
const responseSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          due_date: { type: "string", description: "yyyy-MM-dd or empty" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          notes: { type: "string" },
        },
        required: ["title", "priority"],
      },
    },
  },
  required: ["summary", "tasks"],
};

export const geminiProvider: AiProvider = {
  async planFromImage({ base64, mimeType, today, hint }): Promise<AiPlan> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("AI is not configured (missing GEMINI_API_KEY)");

    const res = await fetch(ENDPOINT(MODEL), {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: buildPrompt(today, hint) },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.3,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Gemini error ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = await res.json();
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned no content");

    // Normalize empty-string due_date → null before validation.
    const raw = JSON.parse(text);
    if (Array.isArray(raw?.tasks)) {
      for (const t of raw.tasks) {
        if (!t.due_date) t.due_date = null;
        if (!t.notes) t.notes = null;
      }
    }

    return aiPlanSchema.parse(raw);
  },
};
