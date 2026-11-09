# Koma: systems

## Architecture

SvelteKit 3 on Svelte 5, built by `adapter-node` and run under Bun, because the server imports `bun:sqlite`; `dev` and `build` force that runtime (`bunx --bun vite`). Pages are server-rendered and every change is a form action that calls `src/lib/server/repo.ts` and redirects.

Three layers. `src/lib/pipeline/` is pure: split, analyse, plan, prompt. `src/lib/server/` owns SQLite, model calls and image files. `src/routes/` is the four steps.

One SQLite file at `data/koma.db` holds projects, catalog entries, chapters, pages, panels and image rows; art is files under `data/images/`, served by `/media/[file]`.

Text model: `POST /chat/completions` for the catalog and prompt revisions. Image model: `/images/generations`, or `/images/edits` with the catalog plates as references. Both are optional and fall back to the offline analyser and placeholder plates.

## Dependencies

Bun, SvelteKit 3, Svelte 5, `bun:sqlite`, `adapter-node`. No client store, no API layer, no auth library. A model endpoint is optional.

## Failure modes

- No key: the offline analyser reads the story and SVG placeholders are drawn; every step still runs.
- Model error: the action falls back and records the reason on the project or the image, so a placeholder is never mistaken for art.
- Image directory unwritable: the server fails at boot with the path, rather than losing writes.
- A panel without art: approval is refused and the button says why.
- Two tabs on one page: the last write wins, nothing merges.
