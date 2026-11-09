# Koma: systems

## Architecture

SvelteKit 3 on Svelte 5, built by `adapter-node` and run under Bun, which the server needs for `bun:sqlite`. Pages are server-rendered; every change is a form action that calls `src/lib/server/repo.ts` and redirects.

`src/lib/pipeline/` is pure: analyse the text, cut a chapter into pages, build prompts. `src/lib/server/` owns SQLite, the model calls, the image files and the CBZ writer. `src/routes/` is the four steps.

`data/koma.db` holds projects, catalog entries, chapters, pages and image rows; art is files under `data/images/`, served by `/media/[file]`.

A page is one image call: Gemini's image model (nano banana family, `aspectRatio` 2:3) or an OpenAI-compatible endpoint at 1024×1536. The catalog plates are sent as reference images with the prompt. Catalog text and prompt revisions use any OpenAI-compatible chat endpoint. A novel's catalog is read in 90,000-character parts beside the request, with the part count kept on the project row; the page polls it.

## Dependencies

Bun, SvelteKit 3, Svelte 5, `bun:sqlite`, `adapter-node`. A text model and an image model are optional.

## Failure modes

- No key: the offline analyser reads the story and portrait placeholder pages are drawn; every step still runs.
- Model or image error: the run records the reason and falls back to the offline analyser or a placeholder.
- Server restart during a novel read: the next boot marks that read failed, and the user runs it again.
- A page without art: approval is refused and the button says why.
- Two tabs on one page: the last write wins, nothing merges.
