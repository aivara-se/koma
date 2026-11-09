# Koma

A novel in, a comic book out. Koma reads a whole story once, locks a catalog of
its people and places, then draws page by page against that catalog: one image
call per page, 1K portrait, four to six panels.

## The four steps

1. **Read.** The novel goes in once. A long book is read in parts and the
   catalogs are merged. Koma lists every character and place, with the variants
   the story shows: a haircut in chapter four, a market after the fire.
2. **Cast.** Each entry gets a description, a visual brief and a square
   reference plate. You approve or exclude each, then lock. Nothing downstream
   reads an unlocked catalog.
3. **Pages.** A chapter becomes consecutive pages of about 200 source words:
   every sentence lands on exactly one page, with a beat, a panel plan and the
   references the drawing must hold.
4. **Draw.** One image call draws the whole page. Edit the prompt, apply a
   note, redraw, approve. A chapter is done when every page is approved. The
   book tab shows the approved pages in order and downloads them as a CBZ.

## Run it

```sh
bun install
bun run dev           # http://127.0.0.1:5173
bun run build
bun run start         # PORT=3000 by default
```

Data lives in `data/` (SQLite file and generated art) and is not committed.

### Models

Koma runs fully without a key. Without one it uses a deterministic local
analyser and draws portrait placeholder pages, so the whole loop can be tried
end to end.

Point it at an image model:

```sh
export KOMA_GEMINI_KEY=...        # nano banana: gemini-2.5-flash-image, 2:3
export KOMA_IMAGE_MODEL=...       # override the image model name
export KOMA_API_KEY=...           # or an OpenAI-compatible images endpoint
export KOMA_BASE_URL=...          # default https://api.openai.com/v1
```

The text model is any OpenAI-compatible chat endpoint (`KOMA_API_KEY`,
`KOMA_TEXT_MODEL`, default `gpt-4.1-mini`). A novel is read in
90,000-character parts beside the request; the project page shows the part
count and refreshes itself.

## The locked parameters

The art style, the page size (832 × 1248, 1K portrait), the panel count (4–6)
and the density (200 source words per page) are fixed in `src/lib/config.ts`
and are not exposed in the interface. One series, one look.

## Checks

```sh
bun run check
bun fmt --no-script --check .
```

`check` runs `svelte-kit sync`, `svelte-check`, the unit tests and the
production build.

## Documents

- `docs/PRODUCT.md` — what it is for, how it is judged, what it never does.
- `docs/SYSTEMS.md` — how it is served, the data it writes, how it fails.
- `docs/DESIGN.md` — the interface and the values it fixes.
- `docs/adrs/` — one decision per file.
- `AGENTS.md` — the rules for an agent working here.
