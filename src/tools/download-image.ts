import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import type { DownloadOptions, AttributionSidecar } from "../types.js";
import { getCachedResult } from "./search-images.js";

function getOutputDir(): string {
  return process.env.EDU_IMAGES_OUTPUT_DIR || join(homedir(), "Downloads", "edu-images");
}

export async function downloadImage(
  options: DownloadOptions
): Promise<{ path: string; attribution_path: string; attribution: AttributionSidecar }> {
  const result = getCachedResult(options.image_id);
  if (!result) {
    throw new Error(
      `Image "${options.image_id}" not found in cache. Run search_images first, then use an image_id from the results.`
    );
  }

  const url =
    options.size === "thumbnail" ? result.thumbnail_url :
    options.size === "full" ? result.full_url :
    result.preview_url;

  if (!url) {
    throw new Error(`No ${options.size} URL available for this image`);
  }

  // Determine filename
  const ext = guessExtension(url, result.title);
  const baseName = options.filename || sanitizeFilename(result.title);
  const filename = baseName.endsWith(ext) ? baseName : `${baseName}${ext}`;

  const outputDir = getOutputDir();
  await mkdir(outputDir, { recursive: true });

  const filePath = join(outputDir, filename);
  const attrPath = join(outputDir, `${filename}.attribution.json`);

  // Download image
  const resp = await fetch(url, {
    headers: { "User-Agent": "mcp-edu-images/1.0 (educational curriculum tool)" },
  });

  if (!resp.ok) {
    throw new Error(`Download failed: ${resp.status} ${resp.statusText}`);
  }

  const buffer = Buffer.from(await resp.arrayBuffer());
  await writeFile(filePath, buffer);

  // Write attribution sidecar
  const attribution: AttributionSidecar = {
    image_id: result.id,
    source: result.source,
    title: result.title,
    author: result.attribution.author,
    author_url: result.attribution.author_url,
    license_name: result.license.name,
    license_url: result.license.url,
    source_page: result.attribution.source_page,
    attribution_text: result.attribution.text,
    downloaded_at: new Date().toISOString(),
  };

  await writeFile(attrPath, JSON.stringify(attribution, null, 2));

  return { path: filePath, attribution_path: attrPath, attribution };
}

function sanitizeFilename(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9_\-. ]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 100);
}

function guessExtension(url: string, title: string): string {
  const urlLower = url.toLowerCase();
  if (urlLower.includes(".png")) return ".png";
  if (urlLower.includes(".svg")) return ".svg";
  if (urlLower.includes(".gif")) return ".gif";
  if (urlLower.includes(".webp")) return ".webp";
  const titleLower = title.toLowerCase();
  if (titleLower.endsWith(".png")) return ".png";
  if (titleLower.endsWith(".svg")) return ".svg";
  return ".jpg";
}
