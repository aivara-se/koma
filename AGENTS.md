# Agent Instructions

Koma turns a whole novel into a comic book that holds one cast, one set and one art style from the first page to the last.

This file is the `aivara-se` agent convention: the rules that hold in every repository. Adopt it, do not fork it. It never describes the state of the work — that lives in the documents below.

## Where a fact lives

- `PRODUCT.md` — what the product is, who it serves, what it must not do, what the work is on now, and what would make it done.
- `SYSTEMS.md` — how it is served, built and checked.
- `DESIGN.md` — the interface and the values it fixes, where there is one.
- `docs/adrs/` — a decision per file, written before the code it decides.
- `README.md` — how to run it locally.

One fact, one home: link to a document, never restate it. A sentence here that starts describing the work instead of how work is done belongs in `PRODUCT.md`.

## House rules

- The look is locked in `src/lib/config.ts`. Change it as a product decision and an ADR, never as a tuning knob inside another change.
- A page reads only from the approved catalog. A prompt may not introduce a character or a place the catalog does not hold.
- One page is one image call at 1K portrait. Do not reintroduce per-panel generation without an ADR that supersedes 007.
- The model draws art; the lettering script lives beside the page, never inside the image. Never ask an image model to write words into a picture.
- The offline path is supported, not a mock: with no key the analyser still reads the story and the plates are still drawn. Keep it working and keep it labelled.
- The pipeline (`src/lib/pipeline/`) stays pure — text in, data out, no database and no network — so it can be tested without a server.

## Tooling

- **Bun runs the scripts.** A script that runs commands is TypeScript, run with `bun run scripts/<name>.ts` — never Python, and a shell script only when it stays a few lines. A command typed at the prompt is not a script.
- **Never** add a second package manager, lockfile, formatter or test runner. The toolchain is the one the repository already declares.
- **Never** report "tests pass", "it builds" or "verified" without the command and the tree it ran against.

## Skills

The organisation's skills live in `aivara-se/.agents/skills` and every agent reads them from there; a repository carries no copy. Each declares a `when-to-use`: open the one that covers the work before starting it.

## Verify before pushing

```bash
bun run check
bun fmt --no-script --check .
```

Run the whole sequence and read every result — the last exit code says nothing about the first.

`bun run check` runs `svelte-kit sync`, `svelte-check`, `bun test` and the production build. The build and the dev server run under Bun (`bunx --bun vite`) because the server imports `bun:sqlite`; a bare `vite` under Node fails on that import.

The same commands run in `.github/workflows/validate.yml`, whose job is named `validate`: that is the check the default branch requires before a merge.

## Version Control

- **Branches**: lowercase, hyphens, one per task: `docs/`, `feat/`, `fix/` or `chore/` and a short name — `docs/adopt-agents-config`, `fix-log-timezone`. No uppercase, no underscores, no personal prefixes.
- **Commits**: Conventional Commits, lowercase, single line, no scopes — `type: short description`.
- **Never** commit to `main` directly, and **never** force-push a branch someone else has seen.
- Keep history linear: no merge commits, no empty commits, no work-in-progress commits.
- Commit under your own identity, never another agent's.
- Remote work is a branch plus a pull request: the body says what changed, what was verified and how, and what was left out. Leave the tree clean.
- Request review from the operator and one peer agent — the operator alone for a documents-only change, the operator and one peer agent for an implementation one.
