# 001 — One Bun process, one SQLite file

**Status:** accepted

## Context

The studio holds a story, a catalog, a plan and a growing pile of images. The alternative to a database is a JSON file rewritten on every action, which loses a write on a crash and cannot filter or sort without loading everything.

v1 has no accounts, so a hosted database with a connection pool and a migration service buys nothing.

## Decision

SQLite through `bun:sqlite`, in a file at `data/koma.db`, in the same process that serves the pages. Images are files beside it. The app is built with `adapter-node` and run with Bun.

## Consequences

The app is one deployable directory and one process. A backup is a copy of `data/`. `bun:sqlite` binds the server to Bun: the build and dev scripts must force the Bun runtime (`bunx --bun vite`), and a move to plain Node means moving to `node:sqlite` or `better-sqlite3` first.

Single writer: fine for one person, a hard limit on any future sharing. That is the point at which this ADR is revisited.
