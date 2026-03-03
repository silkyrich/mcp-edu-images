import type { ImageResult } from "../types.js";

const API_BASE = "https://api.unsplash.com";

interface UnsplashPhoto {
  id: string;
  description: string | null;
  alt_description: string | null;
  width: number;
  height: number;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    html: string;
  };
  user: {
    name: string;
    links: { html: string };
  };
}

export function isUnsplashAvailable(): boolean {
  return !!process.env.UNSPLASH_ACCESS_KEY;
}

export async function searchUnsplash(
  query: string,
  maxResults: number
): Promise<ImageResult[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return [];

  const params = new URLSearchParams({
    query,
    per_page: String(Math.min(maxResults, 30)),
    content_filter: "high",
    orientation: "landscape",
  });

  const resp = await fetch(`${API_BASE}/search/photos?${params}`, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
  });

  if (!resp.ok) {
    if (resp.status === 401 || resp.status === 403) {
      console.error("Unsplash API key invalid or rate-limited, falling back to Wikimedia-only");
      return [];
    }
    throw new Error(`Unsplash search failed: ${resp.status} ${resp.statusText}`);
  }

  const data = await resp.json() as { results: UnsplashPhoto[] };

  return data.results.map((photo): ImageResult => ({
    id: `unsplash-${photo.id}`,
    source: "unsplash",
    title: photo.description || photo.alt_description || "Untitled",
    description: photo.alt_description || photo.description || "",
    thumbnail_url: photo.urls.small,
    preview_url: photo.urls.regular,
    full_url: photo.urls.full,
    width: photo.width,
    height: photo.height,
    license: {
      name: "Unsplash License",
      url: "https://unsplash.com/license",
      requires_attribution: true,
    },
    attribution: {
      author: photo.user.name,
      author_url: photo.user.links.html,
      source_page: photo.links.html,
      text: `Photo by ${photo.user.name} on Unsplash`,
    },
    relevance_score: 0.6,
  }));
}
