import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

// One SQLite file beside the generated art. The directory is not versioned;
// a fresh clone starts empty and migrates itself on first touch.
export const DATA_DIR =
  process.env.KOMA_DATA_DIR ?? join(process.cwd(), "data");
export const IMAGE_DIR = join(DATA_DIR, "images");
mkdirSync(IMAGE_DIR, { recursive: true });

export const db = new Database(join(DATA_DIR, "koma.db"), { create: true });
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS projects (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	story TEXT NOT NULL,
	created_at TEXT NOT NULL,
	analysed_at TEXT,
	analyser TEXT,
	catalog_approved_at TEXT
);

CREATE TABLE IF NOT EXISTS catalog (
	id TEXT PRIMARY KEY,
	project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
	kind TEXT NOT NULL CHECK (kind IN ('character','location')),
	parent_id TEXT REFERENCES catalog(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	description TEXT NOT NULL DEFAULT '',
	visual TEXT NOT NULL DEFAULT '',
	approved INTEGER NOT NULL DEFAULT 0,
	excluded INTEGER NOT NULL DEFAULT 0,
	sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS chapters (
	id TEXT PRIMARY KEY,
	project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
	idx INTEGER NOT NULL,
	title TEXT NOT NULL,
	source TEXT NOT NULL DEFAULT '',
	status TEXT NOT NULL DEFAULT 'new',
	planned_at TEXT,
	approved_at TEXT
);

CREATE TABLE IF NOT EXISTS pages (
	id TEXT PRIMARY KEY,
	chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
	idx INTEGER NOT NULL,
	prompt TEXT NOT NULL DEFAULT '',
	note TEXT NOT NULL DEFAULT '',
	status TEXT NOT NULL DEFAULT 'planned',
	approved_at TEXT
);

CREATE TABLE IF NOT EXISTS panels (
	id TEXT PRIMARY KEY,
	page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
	idx INTEGER NOT NULL,
	shot TEXT NOT NULL,
	action TEXT NOT NULL,
	dialogue TEXT NOT NULL DEFAULT '[]',
	refs TEXT NOT NULL DEFAULT '[]',
	image_id TEXT,
	row INTEGER NOT NULL DEFAULT 0,
	col INTEGER NOT NULL DEFAULT 0,
	span INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS images (
	id TEXT PRIMARY KEY,
	project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
	owner TEXT NOT NULL,
	owner_id TEXT NOT NULL,
	path TEXT NOT NULL,
	prompt TEXT NOT NULL,
	provider TEXT NOT NULL,
	created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_catalog_project ON catalog(project_id);
CREATE INDEX IF NOT EXISTS idx_chapters_project ON chapters(project_id);
CREATE INDEX IF NOT EXISTS idx_pages_chapter ON pages(chapter_id);
CREATE INDEX IF NOT EXISTS idx_panels_page ON panels(page_id);
CREATE INDEX IF NOT EXISTS idx_images_owner ON images(owner, owner_id);
`);

export function id(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

export function all<T>(
  sql: string,
  ...params: (string | number | null)[]
): T[] {
  return db.query(sql).all(...params) as T[];
}

export function one<T>(
  sql: string,
  ...params: (string | number | null)[]
): T | null {
  return (db.query(sql).get(...params) as T | undefined) ?? null;
}

export function run(sql: string, ...params: (string | number | null)[]): void {
  db.query(sql).run(...params);
}
