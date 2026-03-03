#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchImages } from "./tools/search-images.js";
import { downloadImage } from "./tools/download-image.js";
import { getAttribution } from "./tools/get-attribution.js";
import { isUnsplashAvailable } from "./clients/unsplash.js";

const server = new McpServer({
  name: "edu-images",
  version: "1.0.0",
});

// Tool 1: search_images
server.tool(
  "search_images",
  "Search for educational images across Wikimedia Commons and Unsplash. Returns real photographs, historical images, maps, diagrams, and artwork with license info and attribution. Use subject and key_stage to get curriculum-relevant results.",
  {
    query: z.string().describe("Search query (e.g. 'Stonehenge', 'volcanic eruption', 'Tudor rose')"),
    subject: z.string().optional().describe("Curriculum subject for context expansion (e.g. 'history', 'science', 'geography')"),
    key_stage: z.string().optional().describe("Key stage for age-appropriate filtering (e.g. 'KS1', 'KS2', 'KS3', 'KS4')"),
    image_type: z.enum(["photo", "diagram", "map", "artwork"]).optional().describe("Type of image to prioritise"),
    license_preference: z.enum(["any", "free", "commercial"]).optional().describe("License preference — 'free' ranks CC0/CC-BY higher"),
    max_results: z.number().min(1).max(20).optional().describe("Maximum number of results (default 10)"),
    source: z.enum(["wikimedia", "unsplash", "both"]).optional().describe("Which source to search (default 'both')"),
  },
  async (params) => {
    try {
      const results = await searchImages(params);

      if (results.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: `No images found for "${params.query}". Try broader search terms or a different source.`,
          }],
        };
      }

      const unsplashNote = !isUnsplashAvailable()
        ? "\n\n(Unsplash not configured — showing Wikimedia Commons results only. Set UNSPLASH_ACCESS_KEY to enable Unsplash.)"
        : "";

      const formatted = results.map((r, i) => {
        const lines = [
          `### ${i + 1}. ${r.title}`,
          r.description ? `> ${r.description.slice(0, 200)}` : "",
          `- **ID**: \`${r.id}\``,
          `- **Source**: ${r.source === "wikimedia" ? "Wikimedia Commons" : "Unsplash"}`,
          `- **Size**: ${r.width}x${r.height}`,
          `- **License**: ${r.license.name}`,
          `- **Thumbnail**: ${r.thumbnail_url}`,
          `- **Preview**: ${r.preview_url}`,
          `- **Attribution**: ${r.attribution.text}`,
        ];
        return lines.filter(Boolean).join("\n");
      });

      return {
        content: [{
          type: "text" as const,
          text: `Found ${results.length} images for "${params.query}":\n\n${formatted.join("\n\n")}${unsplashNote}`,
        }],
      };
    } catch (err) {
      return {
        content: [{
          type: "text" as const,
          text: `Search error: ${err instanceof Error ? err.message : String(err)}`,
        }],
        isError: true,
      };
    }
  }
);

// Tool 2: download_image
server.tool(
  "download_image",
  "Download an image from search results and save it with an attribution sidecar file. Use an image_id from search_images results.",
  {
    image_id: z.string().describe("Image ID from search_images results (e.g. 'wiki-Stonehenge.jpg' or 'unsplash-abc123')"),
    filename: z.string().optional().describe("Custom filename (extension auto-added if missing)"),
    size: z.enum(["thumbnail", "preview", "full"]).describe("Image size to download"),
  },
  async (params) => {
    try {
      const result = await downloadImage(params);

      return {
        content: [{
          type: "text" as const,
          text: [
            `Image downloaded successfully:`,
            `- **File**: ${result.path}`,
            `- **Attribution**: ${result.attribution_path}`,
            `- **Credit**: ${result.attribution.attribution_text}`,
          ].join("\n"),
        }],
      };
    } catch (err) {
      return {
        content: [{
          type: "text" as const,
          text: `Download error: ${err instanceof Error ? err.message : String(err)}`,
        }],
        isError: true,
      };
    }
  }
);

// Tool 3: get_attribution
server.tool(
  "get_attribution",
  "Format attribution/credit text for downloaded images. Provide image IDs from search results and choose output format.",
  {
    image_ids: z.array(z.string()).min(1).describe("Array of image IDs from search_images results"),
    format: z.enum(["text", "markdown", "html"]).describe("Output format for attribution text"),
  },
  (params) => {
    try {
      const result = getAttribution(params);

      const formatted = result.attributions
        .map((a) => `- **${a.image_id}**: ${a.text}`)
        .join("\n");

      return {
        content: [{
          type: "text" as const,
          text: `Attribution (${params.format}):\n\n${formatted}`,
        }],
      };
    } catch (err) {
      return {
        content: [{
          type: "text" as const,
          text: `Attribution error: ${err instanceof Error ? err.message : String(err)}`,
        }],
        isError: true,
      };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`edu-images MCP server running (Unsplash: ${isUnsplashAvailable() ? "enabled" : "disabled"})`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
