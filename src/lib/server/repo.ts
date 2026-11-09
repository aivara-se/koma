// All reads and writes of the studio's state. Routes call these; nothing else
// touches SQL.

import type {
  Analysis,
  CatalogItem,
  CatalogRow,
  Chapter,
  ChapterRow,
  ImageRow,
  Page,
  PageDraft,
  PageRow,
  Panel,
  PanelRow,
  Project,
} from "../types";
import { all, id, now, one, run } from "./db";
import { pagePrompt } from "../pipeline/prompts";

export interface ProjectSummary extends Project {
  chapters: number;
  pages: number;
  approved_pages: number;
  characters: number;
  locations: number;
}

export function createProject(title: string, story: string): string {
  const pid = id();
  run(
    "INSERT INTO projects (id, title, story, created_at) VALUES (?, ?, ?, ?)",
    pid,
    title.trim() || "Untitled story",
    story.trim(),
    now(),
  );
  return pid;
}

export function listProjects(): ProjectSummary[] {
  return all<ProjectSummary>(`
		SELECT p.*,
			(SELECT COUNT(*) FROM chapters c WHERE c.project_id = p.id) AS chapters,
			(SELECT COUNT(*) FROM pages pg JOIN chapters c ON c.id = pg.chapter_id WHERE c.project_id = p.id) AS pages,
			(SELECT COUNT(*) FROM pages pg JOIN chapters c ON c.id = pg.chapter_id WHERE c.project_id = p.id AND pg.status = 'approved') AS approved_pages,
			(SELECT COUNT(*) FROM catalog k WHERE k.project_id = p.id AND k.kind = 'character' AND k.parent_id IS NULL) AS characters,
			(SELECT COUNT(*) FROM catalog k WHERE k.project_id = p.id AND k.kind = 'location' AND k.parent_id IS NULL) AS locations
		FROM projects p ORDER BY p.created_at DESC`);
}

export function getProject(projectId: string): Project | null {
  return one<Project>("SELECT * FROM projects WHERE id = ?", projectId);
}

export function deleteProject(projectId: string): void {
  run("DELETE FROM projects WHERE id = ?", projectId);
}

export function imageFor(
  projectId: string,
  owner: "catalog" | "panel",
  ownerId: string,
): ImageRow | null {
  return one<ImageRow>(
    "SELECT *, '/media/' || path AS href FROM images WHERE project_id = ? AND owner = ? AND owner_id = ? ORDER BY created_at DESC LIMIT 1",
    projectId,
    owner,
    ownerId,
  );
}

export function saveImage(
  projectId: string,
  owner: "catalog" | "panel",
  ownerId: string,
  art: { file: string; href: string; provider: string; prompt: string },
): ImageRow {
  const imageId = id();
  run(
    "INSERT INTO images (id, project_id, owner, owner_id, path, prompt, provider, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    imageId,
    projectId,
    owner,
    ownerId,
    art.file,
    art.prompt,
    art.provider,
    now(),
  );
  return one<ImageRow>(
    "SELECT *, '/media/' || path AS href FROM images WHERE id = ?",
    imageId,
  )!;
}

function toCatalogItem(
  row: CatalogRow,
  projectId: string,
  variants: CatalogRow[],
): CatalogItem {
  return {
    ...row,
    image: imageFor(projectId, "catalog", row.id),
    variants: variants
      .filter((v) => v.parent_id === row.id)
      .map((v) => ({
        ...v,
        image: imageFor(projectId, "catalog", v.id),
        variants: [],
      })),
  };
}

export function getCatalog(projectId: string): CatalogItem[] {
  const rows = all<CatalogRow>(
    "SELECT * FROM catalog WHERE project_id = ? ORDER BY kind DESC, sort ASC",
    projectId,
  );
  const roots = rows.filter((r) => !r.parent_id);
  return roots.map((r) => toCatalogItem(r, projectId, rows));
}

export function getCatalogItem(itemId: string): CatalogItem | null {
  const row = one<CatalogRow>("SELECT * FROM catalog WHERE id = ?", itemId);
  if (!row) return null;
  const variants = all<CatalogRow>(
    "SELECT * FROM catalog WHERE parent_id = ? ORDER BY sort ASC",
    itemId,
  );
  return toCatalogItem(row, row.project_id, variants);
}

export function getCatalogByName(
  projectId: string,
  name: string,
): CatalogRow | null {
  return one<CatalogRow>(
    "SELECT * FROM catalog WHERE project_id = ? AND name = ? COLLATE NOCASE AND parent_id IS NULL",
    projectId,
    name,
  );
}

export function updateCatalogItem(
  itemId: string,
  patch: {
    name?: string;
    description?: string;
    visual?: string;
    approved?: boolean;
    excluded?: boolean;
  },
): void {
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (name) run("UPDATE catalog SET name = ? WHERE id = ?", name, itemId);
  }
  if (patch.description !== undefined)
    run(
      "UPDATE catalog SET description = ? WHERE id = ?",
      patch.description,
      itemId,
    );
  if (patch.visual !== undefined)
    run("UPDATE catalog SET visual = ? WHERE id = ?", patch.visual, itemId);
  if (patch.approved !== undefined)
    run(
      "UPDATE catalog SET approved = ? WHERE id = ?",
      patch.approved ? 1 : 0,
      itemId,
    );
  if (patch.excluded !== undefined) {
    run(
      "UPDATE catalog SET excluded = ?, approved = 0 WHERE id = ?",
      patch.excluded ? 1 : 0,
      itemId,
    );
    // A variant follows its parent out of the comic, never back in.
    if (patch.excluded) {
      run(
        "UPDATE catalog SET excluded = 1, approved = 0 WHERE parent_id = ?",
        itemId,
      );
    }
  }
}

export interface CatalogProgress {
  total: number;
  excluded: number;
  approved: number;
  withImage: number;
  complete: boolean;
}

export function catalogProgress(projectId: string): CatalogProgress {
  const row = one<{
    total: number;
    excluded: number;
    approved: number;
    withImage: number;
  }>(
    `SELECT COUNT(*) AS total,
			SUM(CASE WHEN excluded = 1 THEN 1 ELSE 0 END) AS excluded,
			SUM(CASE WHEN approved = 1 THEN 1 ELSE 0 END) AS approved,
			SUM(CASE WHEN EXISTS (SELECT 1 FROM images i WHERE i.owner = 'catalog' AND i.owner_id = catalog.id) THEN 1 ELSE 0 END) AS withImage
		FROM catalog WHERE project_id = ? AND parent_id IS NULL`,
    projectId,
  );
  const total = row?.total ?? 0;
  const excluded = row?.excluded ?? 0;
  const approved = row?.approved ?? 0;
  return {
    total,
    excluded,
    approved,
    withImage: row?.withImage ?? 0,
    complete: total > 0 && approved + excluded === total,
  };
}

export function approveCatalog(projectId: string): void {
  run(
    "UPDATE projects SET catalog_approved_at = ? WHERE id = ?",
    now(),
    projectId,
  );
}

export function saveAnalysis(
  projectId: string,
  analysis: Analysis,
  provider: string,
): void {
  run("DELETE FROM catalog WHERE project_id = ?", projectId);
  run("DELETE FROM chapters WHERE project_id = ?", projectId);
  const insert = (
    kind: "character" | "location",
    name: string,
    description: string,
    visual: string,
    sort: number,
    parentId: string | null,
  ): string => {
    const cid = id();
    run(
      "INSERT INTO catalog (id, project_id, kind, parent_id, name, description, visual, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      cid,
      projectId,
      kind,
      parentId,
      name,
      description,
      visual,
      sort,
    );
    return cid;
  };
  (
    [
      ["character", analysis.characters],
      ["location", analysis.locations],
    ] as const
  ).forEach(([kind, drafts]) => {
    drafts.forEach((d, i) => {
      const pid = insert(kind, d.name, d.description, d.visual, i, null);
      d.variants.forEach((v, j) =>
        insert(kind, v.name, v.description, v.visual, j, pid),
      );
    });
  });
  analysis.chapters.forEach((c, i) => {
    run(
      "INSERT INTO chapters (id, project_id, idx, title, source, status) VALUES (?, ?, ?, ?, ?, 'new')",
      id(),
      projectId,
      i,
      c.title,
      c.text,
    );
  });
  run(
    "UPDATE projects SET analysed_at = ?, analyser = ?, catalog_approved_at = NULL WHERE id = ?",
    now(),
    provider,
    projectId,
  );
}

export function getChapters(
  projectId: string,
): (ChapterRow & { pages: number; approved: number })[] {
  return all<ChapterRow & { pages: number; approved: number }>(
    `SELECT c.*,
			(SELECT COUNT(*) FROM pages p WHERE p.chapter_id = c.id) AS pages,
			(SELECT COUNT(*) FROM pages p WHERE p.chapter_id = c.id AND p.status = 'approved') AS approved
		FROM chapters c WHERE c.project_id = ? ORDER BY c.idx ASC`,
    projectId,
  );
}

export function getChapter(chapterId: string): Chapter | null {
  const chapter = one<ChapterRow>(
    "SELECT * FROM chapters WHERE id = ?",
    chapterId,
  );
  if (!chapter) return null;
  const pages = all<PageRow>(
    "SELECT * FROM pages WHERE chapter_id = ? ORDER BY idx ASC",
    chapterId,
  );
  return {
    ...chapter,
    pages: pages.map((p) => toPage(p)),
  };
}

function toPage(page: PageRow): Page {
  const rows = all<PanelRow>(
    "SELECT * FROM panels WHERE page_id = ? ORDER BY idx ASC",
    page.id,
  );
  const projectRow = one<{ project_id: string }>(
    "SELECT c.project_id FROM chapters c WHERE c.id = ?",
    page.chapter_id,
  );
  const projectId = projectRow?.project_id ?? "";
  const panels: Panel[] = rows.map((r) => ({
    ...r,
    dialogue: JSON.parse(r.dialogue || "[]") as Panel["dialogue"],
    refs: JSON.parse(r.refs || "[]") as string[],
    image: imageFor(projectId, "panel", r.id),
  }));
  return { ...page, panels };
}

export function savePages(
  projectId: string,
  chapterId: string,
  drafts: PageDraft[],
): void {
  run("DELETE FROM pages WHERE chapter_id = ?", chapterId);
  for (const [i, draft] of drafts.entries()) {
    const pageId = id();
    run(
      "INSERT INTO pages (id, chapter_id, idx, prompt, status) VALUES (?, ?, ?, '', 'planned')",
      pageId,
      chapterId,
      i,
    );
    const refIds = new Set<string>();
    for (const [j, panel] of draft.panels.entries()) {
      const ids = panel.refs
        .map((name) => getCatalogByName(projectId, name)?.id)
        .filter((v): v is string => Boolean(v));
      ids.forEach((v) => refIds.add(v));
      run(
        "INSERT INTO panels (id, page_id, idx, shot, action, dialogue, refs, row, col, span) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        id(),
        pageId,
        j,
        panel.shot,
        panel.action,
        JSON.stringify(panel.dialogue),
        JSON.stringify(ids),
        panel.row,
        panel.col,
        panel.span,
      );
    }
    const page = toPage(
      one<PageRow>("SELECT * FROM pages WHERE id = ?", pageId)!,
    );
    const refs = [...refIds]
      .map((rid) => getCatalogItem(rid))
      .filter((v): v is CatalogItem => Boolean(v));
    const setting = refs.find((r) => r.kind === "location");
    run(
      "UPDATE pages SET prompt = ? WHERE id = ?",
      pagePrompt(page, refs, setting?.description ?? ""),
      pageId,
    );
  }
  run(
    "UPDATE chapters SET status = 'planned', planned_at = ? WHERE id = ?",
    now(),
    chapterId,
  );
}

export function getPage(pageId: string): Page | null {
  const row = one<PageRow>("SELECT * FROM pages WHERE id = ?", pageId);
  return row ? toPage(row) : null;
}

export function setPagePrompt(pageId: string, prompt: string): void {
  run("UPDATE pages SET prompt = ? WHERE id = ?", prompt, pageId);
}

export function setPageNote(pageId: string, note: string): void {
  run("UPDATE pages SET note = ? WHERE id = ?", note, pageId);
}

export function setPanelImage(panelId: string, imageId: string): void {
  run("UPDATE panels SET image_id = ? WHERE id = ?", imageId, panelId);
  const page = one<{ page_id: string }>(
    "SELECT page_id FROM panels WHERE id = ?",
    panelId,
  );
  if (!page) return;
  const missing = one<{ n: number }>(
    "SELECT COUNT(*) AS n FROM panels WHERE page_id = ? AND image_id IS NULL",
    page.page_id,
  );
  if ((missing?.n ?? 1) === 0)
    run(
      "UPDATE pages SET status = 'drawn' WHERE id = ? AND status = 'planned'",
      page.page_id,
    );
}

export function setPageStatus(pageId: string, approved: boolean): void {
  run(
    "UPDATE pages SET status = ?, approved_at = ? WHERE id = ?",
    approved ? "approved" : "drawn",
    approved ? now() : null,
    pageId,
  );
}

export function setChapterStatus(chapterId: string, approved: boolean): void {
  run(
    "UPDATE chapters SET status = ?, approved_at = ? WHERE id = ?",
    approved ? "approved" : "planned",
    approved ? now() : null,
    chapterId,
  );
}

export function chapterProgress(chapterId: string): {
  pages: number;
  approved: number;
  drawn: number;
} {
  const row = one<{ pages: number; approved: number; drawn: number }>(
    `SELECT COUNT(*) AS pages,
			SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
			SUM(CASE WHEN status = 'drawn' THEN 1 ELSE 0 END) AS drawn
		FROM pages WHERE chapter_id = ?`,
    chapterId,
  );
  return {
    pages: row?.pages ?? 0,
    approved: row?.approved ?? 0,
    drawn: row?.drawn ?? 0,
  };
}

export function firstUnfinishedChapter(projectId: string): ChapterRow | null {
  return one<ChapterRow>(
    "SELECT * FROM chapters WHERE project_id = ? AND status != 'approved' ORDER BY idx ASC LIMIT 1",
    projectId,
  );
}
