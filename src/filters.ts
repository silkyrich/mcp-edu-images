import type { ImageResult } from "./types.js";

const BLOCKED_KEYWORDS = new Set([
  "nsfw",
  "nude",
  "nudity",
  "erotic",
  "pornograph",
  "sexual",
  "gore",
  "graphic violence",
  "torture",
  "execution",
  "beheading",
  "drug use",
  "smoking",
  "alcohol abuse",
  "self-harm",
  "suicide method",
]);

export function isContentSafe(result: ImageResult): boolean {
  const text = `${result.title} ${result.description}`.toLowerCase();
  for (const keyword of BLOCKED_KEYWORDS) {
    if (text.includes(keyword)) return false;
  }
  return true;
}

const LICENSE_RANK: Record<string, number> = {
  "cc0": 5,
  "public domain": 5,
  "cc-by": 4,
  "cc-by-sa": 3,
  "unsplash": 3,
  "cc-by-nc": 2,
  "cc-by-nc-sa": 2,
  "cc-by-nd": 1,
  "cc-by-nc-nd": 1,
};

export function licenseFreedom(licenseName: string): number {
  const lower = licenseName.toLowerCase();
  for (const [key, rank] of Object.entries(LICENSE_RANK)) {
    if (lower.includes(key)) return rank;
  }
  return 0;
}

export function rankResults(
  results: ImageResult[],
  preference: "any" | "free" | "commercial"
): ImageResult[] {
  return results
    .filter(isContentSafe)
    .sort((a, b) => {
      if (preference === "free" || preference === "commercial") {
        const licDiff = licenseFreedom(b.license.name) - licenseFreedom(a.license.name);
        if (licDiff !== 0) return licDiff;
      }
      return b.relevance_score - a.relevance_score;
    });
}
