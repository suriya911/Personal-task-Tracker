import { geminiProvider } from "@/lib/ai/gemini";
import type { AiProvider } from "@/lib/ai/types";

/**
 * The active AI provider. Swap this one line to move to Groq / Claude / an
 * HF-router model — the rest of the app only knows the AiProvider interface.
 */
export const ai: AiProvider = geminiProvider;

export function aiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}
