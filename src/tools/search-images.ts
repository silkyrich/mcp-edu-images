import type { ImageResult, SearchOptions, CacheEntry } from "../types.js";
import { searchWikimedia } from "../clients/wikimedia.js";
import { searchUnsplash, isUnsplashAvailable } from "../clients/unsplash.js";
import { expandSearchTerms } from "../curriculum-context.js";
import { rankResults } from "../filters.js";

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const CACHE_MAX = 500;
const resultCache = new Map<string, CacheEntry>();

export function getCachedResult(imageId: string): ImageResult | undefined {
  const entry = resultCache.get(imageId);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    resultCache.delete(imageId);
    return undefined;
  }
  return entry.result;
}

function cacheResults(results: ImageResult[]): void {
  for (const result of results) {
    if (resultCache.size >= CACHE_MAX) {
      // Evict oldest entry
      const oldestKey = resultCache.keys().next().value;
      if (oldestKey) resultCache.delete(oldestKey);
    }
    resultCache.set(result.id, { result, timestamp: Date.now() });
  }
}

export async function searchImages(options: SearchOptions): Promise<ImageResult[]> {
  const {
    query,
    subject,
    key_stage,
    image_type,
    license_preference = "any",
    max_results = 10,
    source = "both",
  } = options;

  const expandedQuery = expandSearchTerms(query, subject, key_stage, image_type);

  const searches: Promise<ImageResult[]>[] = [];

  if (source === "wikimedia" || source === "both") {
    searches.push(
      searchWikimedia(expandedQuery, max_results).catch((err) => {
        console.error("Wikimedia search error:", err);
        return [] as ImageResult[];
      })
    );
  }

  if ((source === "unsplash" || source === "both") && isUnsplashAvailable()) {
    searches.push(
      searchUnsplash(expandedQuery, max_results).catch((err) => {
        console.error("Unsplash search error:", err);
        return [] as ImageResult[];
      })
    );
  }

  if (source === "unsplash" && !isUnsplashAvailable()) {
    return [{
      id: "error-no-unsplash",
      source: "unsplash",
      title: "Unsplash not configured",
      description: "Set UNSPLASH_ACCESS_KEY environment variable to enable Unsplash search",
      thumbnail_url: "",
      preview_url: "",
      full_url: "",
      width: 0,
      height: 0,
      license: { name: "", url: "", requires_attribution: false },
      attribution: { author: "", author_url: "", source_page: "", text: "" },
      relevance_score: 0,
    }];
  }

  const allResults = (await Promise.all(searches)).flat();
  const ranked = rankResults(allResults, license_preference).slice(0, max_results);

  cacheResults(ranked);

  return ranked;
}
