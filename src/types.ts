export interface ImageResult {
  id: string;
  source: "wikimedia" | "unsplash";
  title: string;
  description: string;
  thumbnail_url: string;
  preview_url: string;
  full_url: string;
  width: number;
  height: number;
  license: {
    name: string;
    url: string;
    requires_attribution: boolean;
  };
  attribution: {
    author: string;
    author_url: string;
    source_page: string;
    text: string;
  };
  relevance_score: number;
}

export interface SearchOptions {
  query: string;
  subject?: string;
  key_stage?: string;
  image_type?: "photo" | "diagram" | "map" | "artwork";
  license_preference?: "any" | "free" | "commercial";
  max_results?: number;
  source?: "wikimedia" | "unsplash" | "both";
}

export interface DownloadOptions {
  image_id: string;
  filename?: string;
  size: "thumbnail" | "preview" | "full";
}

export interface AttributionOptions {
  image_ids: string[];
  format: "text" | "markdown" | "html";
}

export interface AttributionSidecar {
  image_id: string;
  source: "wikimedia" | "unsplash";
  title: string;
  author: string;
  author_url: string;
  license_name: string;
  license_url: string;
  source_page: string;
  attribution_text: string;
  downloaded_at: string;
}

export interface CacheEntry {
  result: ImageResult;
  timestamp: number;
}
