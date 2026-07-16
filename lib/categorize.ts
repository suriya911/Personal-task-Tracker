// Keyword-based auto-categorization. Maps a task title to the best-matching
// category by scoring keyword hits. Pure + deterministic (unit-tested).

/** Keywords keyed by lowercase category name (matches the seeded defaults). */
const KEYWORDS: Record<string, string[]> = {
  household: [
    "clean", "laundry", "dishes", "vacuum", "groceries", "grocery", "cook",
    "trash", "chore", "chores", "home", "repair", "kitchen", "wash", "fold",
    "tidy", "garden", "mow",
  ],
  "job search": [
    "job", "jobs", "apply", "application", "interview", "resume", "cover letter",
    "recruiter", "linkedin", "offer", "coding assessment", "assessment",
    "leetcode", "hackerrank", "referral", "career", "networking", "oa",
    "take home", "phone screen", "onsite",
  ],
  bills: [
    "bill", "bills", "rent", "pay", "payment", "invoice", "tax", "taxes",
    "insurance", "subscription", "electric", "water", "utility", "utilities",
    "mortgage", "credit card", "loan",
  ],
  projects: [
    "project", "build", "deploy", "code", "coding", "feature", "bug", "refactor",
    "portfolio", "ship", "launch", "design", "api", "test", "prototype", "mvp",
  ],
  personal: [
    "gym", "workout", "doctor", "appointment", "call", "birthday", "gift",
    "book", "read", "meditate", "family", "friend", "dentist", "haircut",
    "exercise", "run",
  ],
};

/** Multi-word phrases are stronger signals than single words. */
function scoreFor(title: string, keywords: string[]): number {
  let score = 0;
  for (const kw of keywords) {
    const weight = kw.includes(" ") ? 2 : 1;
    const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(title)) score += weight;
  }
  return score;
}

/**
 * Pick the best category id for a title, or null if nothing scores.
 * Ties break toward the earlier category (by array order — sidebar position).
 */
export function categorizeTask(
  title: string,
  categories: { id: string; name: string }[],
): string | null {
  let best: { id: string; score: number } | null = null;

  for (const cat of categories) {
    const keywords = KEYWORDS[cat.name.trim().toLowerCase()];
    // Unknown/custom category: match on its own name as a fallback keyword.
    const list = keywords ?? [cat.name.toLowerCase()];
    const score = scoreFor(title, list);
    if (score > 0 && (!best || score > best.score)) {
      best = { id: cat.id, score };
    }
  }

  return best?.id ?? null;
}
