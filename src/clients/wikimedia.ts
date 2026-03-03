import type { ImageResult } from "../types.js";

const API_BASE = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "mcp-edu-images/1.0 (educational curriculum tool; https://github.com/richardmorgan)";

interface WikiSearchResult {
  title: string;
  pageid: number;
  snippet: string;
}

interface WikiImageInfo {
  url: string;
  descriptionurl: string;
  thumburl?: string;
  width: number;
  height: number;
  extmetadata?: Record<string, { value: string }>;
}

function extractLicense(meta: Record<string, { value: string }> | undefined): {
  name: string;
  url: string;
  requires_attribution: boolean;
} {
  if (!meta) return { name: "Unknown", url: "", requires_attribution: true };

  const licenseName = meta["LicenseShortName"]?.value || "Unknown";
  const licenseUrl = meta["LicenseUrl"]?.value || "";

  const lower = licenseName.toLowerCase();
  const requiresAttribution = !lower.includes("cc0") && !lower.includes("public domain");

  return { name: licenseName, url: licenseUrl, requires_attribution: requiresAttribution };
}

function extractAttribution(
  meta: Record<string, { value: string }> | undefined,
  descriptionUrl: string
): { author: string; author_url: string; source_page: string; text: string } {
  const author = meta?.["Artist"]?.value?.replace(/<[^>]*>/g, "").trim() || "Unknown";
  const credit = meta?.["Credit"]?.value?.replace(/<[^>]*>/g, "").trim() || "";
  const licenseName = meta?.["LicenseShortName"]?.value || "";

  let authorUrl = "";
  const hrefMatch = meta?.["Artist"]?.value?.match(/href="([^"]+)"/);
  if (hrefMatch) authorUrl = hrefMatch[1];

  const text = `${author}${credit ? `, ${credit}` : ""}, via Wikimedia Commons (${licenseName})`;

  return { author, author_url: authorUrl, source_page: descriptionUrl, text };
}

export async function searchWikimedia(
  query: string,
  maxResults: number
): Promise<ImageResult[]> {
  // Step 1: Search for files
  const searchParams = new URLSearchParams({
    action: "query",
    list: "search",
    srnamespace: "6",
    srsearch: query,
    srlimit: String(Math.min(maxResults * 2, 50)),
    format: "json",
    origin: "*",
  });

  const searchResp = await fetch(`${API_BASE}?${searchParams}`, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!searchResp.ok) {
    throw new Error(`Wikimedia search failed: ${searchResp.status} ${searchResp.statusText}`);
  }

  const searchData = await searchResp.json() as {
    query?: { search: WikiSearchResult[] };
  };

  const pages = searchData.query?.search || [];
  if (pages.length === 0) return [];

  // Step 2: Get image info for all results
  const titles = pages.map((p) => p.title).join("|");
  const infoParams = new URLSearchParams({
    action: "query",
    titles,
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "640",
    format: "json",
    origin: "*",
  });

  const infoResp = await fetch(`${API_BASE}?${infoParams}`, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!infoResp.ok) {
    throw new Error(`Wikimedia imageinfo failed: ${infoResp.status} ${infoResp.statusText}`);
  }

  const infoData = await infoResp.json() as {
    query?: { pages: Record<string, { title: string; imageinfo?: WikiImageInfo[] }> };
  };

  const infoPages = infoData.query?.pages || {};
  const results: ImageResult[] = [];

  for (const page of Object.values(infoPages)) {
    const info = page.imageinfo?.[0];
    if (!info) continue;

    const meta = info.extmetadata;
    const license = extractLicense(meta);
    const attribution = extractAttribution(meta, info.descriptionurl);
    const description = meta?.["ImageDescription"]?.value?.replace(/<[^>]*>/g, "").trim() || "";

    results.push({
      id: `wiki-${page.title.replace(/^File:/, "").replace(/\s+/g, "_")}`,
      source: "wikimedia",
      title: page.title.replace(/^File:/, ""),
      description,
      thumbnail_url: info.thumburl || info.url,
      preview_url: info.thumburl || info.url,
      full_url: info.url,
      width: info.width,
      height: info.height,
      license,
      attribution,
      relevance_score: 0.5,
    });
  }

  return results.slice(0, maxResults);
}
