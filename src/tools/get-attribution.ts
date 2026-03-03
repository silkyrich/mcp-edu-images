import type { AttributionOptions } from "../types.js";
import { getCachedResult } from "./search-images.js";

export function getAttribution(
  options: AttributionOptions
): { attributions: Array<{ image_id: string; text: string }> } {
  const { image_ids, format } = options;
  const attributions: Array<{ image_id: string; text: string }> = [];

  for (const id of image_ids) {
    const result = getCachedResult(id);
    if (!result) {
      attributions.push({
        image_id: id,
        text: `[Image "${id}" not found in cache — run search_images first]`,
      });
      continue;
    }

    const { author, author_url, source_page } = result.attribution;
    const { name: licenseName, url: licenseUrl } = result.license;

    let text: string;

    switch (format) {
      case "markdown":
        if (result.source === "unsplash") {
          text = `Photo by [${author}](${author_url}) on [Unsplash](${source_page})`;
        } else {
          text = `[${result.title}](${source_page}) by ${author_url ? `[${author}](${author_url})` : author}, [${licenseName}](${licenseUrl}), via Wikimedia Commons`;
        }
        break;

      case "html":
        if (result.source === "unsplash") {
          text = `Photo by <a href="${author_url}">${author}</a> on <a href="${source_page}">Unsplash</a>`;
        } else {
          text = `<a href="${source_page}">${result.title}</a> by ${author_url ? `<a href="${author_url}">${author}</a>` : author}, <a href="${licenseUrl}">${licenseName}</a>, via Wikimedia Commons`;
        }
        break;

      default:
        text = result.attribution.text;
        break;
    }

    attributions.push({ image_id: id, text });
  }

  return { attributions };
}
