# mcp-edu-images

An MCP server for searching and downloading educational images from **Wikimedia Commons** and **Unsplash**. Built for curriculum content authoring — real photographs, historical images, maps, diagrams, and artwork with full licence tracking and attribution.

## Why

AI-generated images don't cut it for education. You need real photographs of Stonehenge, actual Viking artefacts, proper OS maps, historical paintings. This server searches free image sources and handles the attribution paperwork automatically.

## Tools

### `search_images`

Search both sources with optional curriculum context (subject, key stage, image type). Returns ranked results with thumbnails, licence info, and ready-to-use attribution.

```
query: "Viking longship"
subject: "history"         # expands search terms
key_stage: "KS2"           # optional
image_type: "photo"        # photo | diagram | map | artwork
license_preference: "free" # ranks CC0/CC-BY higher
source: "both"             # wikimedia | unsplash | both
max_results: 10
```

### `download_image`

Downloads an image from search results and writes a `.attribution.json` sidecar file beside it with full provenance.

```
image_id: "wiki-Viking_longship.png"  # from search results
filename: "viking_longship"           # optional custom name
size: "preview"                       # thumbnail | preview | full
```

### `get_attribution`

Formats attribution text for one or more images in text, markdown, or HTML.

```
image_ids: ["wiki-Viking_longship.png", "unsplash-abc123"]
format: "markdown"  # text | markdown | html
```

## Setup

### Build

```bash
npm install
npm run build
```

### Register with Claude Code

Add to `~/.claude.json` under `mcpServers`:

```json
"edu-images": {
  "type": "stdio",
  "command": "node",
  "args": ["/path/to/mcp-edu-images/dist/index.js"],
  "env": {
    "UNSPLASH_ACCESS_KEY": "optional-key-here",
    "EDU_IMAGES_OUTPUT_DIR": "/path/to/output/directory"
  }
}
```

Restart Claude Code to pick up the new server.

### Environment Variables

| Variable | Required | Default |
|----------|----------|---------|
| `UNSPLASH_ACCESS_KEY` | No | Wikimedia-only mode |
| `EDU_IMAGES_OUTPUT_DIR` | No | `~/Downloads/edu-images` |

Unsplash is entirely optional. Wikimedia Commons alone covers most educational needs — historical photos, diagrams, maps, artwork. Unsplash adds high-quality modern photography.

## Sources

**Wikimedia Commons** (no auth)
- 100M+ freely licensed media files
- Excellent for historical images, diagrams, maps, scientific illustrations
- CC0, CC-BY, CC-BY-SA licences
- Rate limit: be polite (don't hammer parallel downloads)

**Unsplash** (optional API key)
- High-quality modern photography
- Free tier: 50 requests/hour (demo), 5000/hour (production)
- Unsplash Licence (free for commercial use, attribution appreciated)
- `content_filter=high` enabled by default

## How It Works

1. **Search** queries both APIs in parallel, merges results, filters unsafe content via keyword blocklist, and ranks by licence freedom
2. **Curriculum context** optionally expands search terms — e.g. `subject: "history"` adds `"historical"` to the query
3. **Results are cached in memory** (1hr TTL, max 500 entries) so download/attribution tools can reference them by ID
4. **Download** fetches the image and writes a `.attribution.json` sidecar with full provenance (author, licence, source URL, download timestamp)
5. **Attribution** formats credit text from cached results in your choice of text/markdown/HTML

## Content Safety

This is a content authoring tool, not child-facing software. Safety measures:

- Unsplash `content_filter=high` (their moderation)
- Keyword blocklist filters results with NSFW/violent terms in title or description
- Both Wikimedia and Unsplash have their own moderation policies

## Licence

MIT
