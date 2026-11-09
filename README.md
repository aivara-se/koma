# Koma

A story-to-manga studio. Paste a story, lock the cast and the sets, then work
chapter by chapter until the last page is approved.

## The four steps

1. **Read.** The whole story goes in once. Koma lists every character and every
   location it finds, with the variants a story tends to hide: a character's
   hair cut short in chapter four, a house after the fire.
2. **Cast.** Each entry gets a written description and a reference image: a
   turnaround for a character, a plate or map for a location. You approve the
   catalog before any page is drawn. Nothing downstream can drift from an
   approved catalog.
3. **Plan.** Chapter by chapter, Koma picks the moments that must survive the
   compression and writes them as pages of panels — shot, action, speaker,
   which catalog references the panel needs.
4. **Draw.** One page at a time: edit the prompt, generate the art, review it.
   A page you approve is locked; the chapter is done when every page is.

## Run it

```sh
bun install
bun run dev           # http://127.0.0.1:5173
```

The data lives in `data/` (SQLite file plus generated images) and is not
committed.

### Models

Koma runs fully without a key. Without one it uses a deterministic local
analyser and draws placeholder plates, so the whole four-step loop can be tried
end to end. Point it at any OpenAI-compatible endpoint to use a real model:

```sh
export KOMA_API_KEY=...            # enables both text and image calls
export KOMA_BASE_URL=...           # default https://api.openai.com/v1
export KOMA_TEXT_MODEL=...         # default gpt-4.1-mini
export KOMA_IMAGE_MODEL=...        # default gpt-image-1
```

## The locked parameters

For v1 the art style, image resolution, page density and panel size are fixed in
`src/lib/config.ts` and are not exposed in the interface. One series, one look.

## Checks

```sh
bun run check
```

runs `svelte-check`, the unit tests and the production build. The same command
is the `validate` job.

## Documents

- `docs/PRODUCT.md` — what it is for, how it is judged, what it never does.
- `docs/SYSTEMS.md` — how it is served, the data it writes, how it fails.
- `docs/DESIGN.md` — the interface and the values it fixes.
- `docs/adrs/` — one decision per file.
- `AGENTS.md` — the rules for an agent working here.
