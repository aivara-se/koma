import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The repository opens its SQLite file when it loads, so point it at a
// scratch directory before the import runs.
const DATA_DIR = mkdtempSync(join(tmpdir(), "koma-repo-test-"));
process.env.KOMA_DATA_DIR = DATA_DIR;
const repo = await import("./repo");

const ANALYSIS = {
  characters: [
    {
      name: "Mira",
      description: "The harbour pilot.",
      visual: "Tall, cropped hair, oilskin coat.",
      variants: [
        {
          name: "Hair cut",
          description: "Her hair is cut short after the storm.",
          visual: "Cropped hair.",
        },
      ],
    },
    {
      name: "Ivo",
      description: "The lighthouse keeper.",
      visual: "Grey beard, wool sweater.",
      variants: [],
    },
  ],
  locations: [
    {
      name: "Salt Market",
      description: "The quay market.",
      visual: "Tarpaulins, crates, wet stone.",
      variants: [],
    },
  ],
  chapters: [{ title: "One", text: "Mira waits at the Salt Market." }],
};

function freshProject(): string {
  const projectId = repo.createProject("Test story", "Mira waits.");
  repo.saveAnalysis(projectId, ANALYSIS, "test analyser");
  return projectId;
}

function named(projectId: string, name: string) {
  return repo.getCatalog(projectId).find((item) => item.name === name)!;
}

afterAll(() => rmSync(DATA_DIR, { recursive: true, force: true }));

describe("updateCatalogItem", () => {
  test("a card save keeps an approval", () => {
    const projectId = freshProject();
    const mira = named(projectId, "Mira");
    repo.updateCatalogItem(mira.id, {
      name: "Mira",
      description: mira.description,
      visual: mira.visual,
      approved: true,
      excluded: false,
    });
    expect(repo.getCatalogItem(mira.id)?.approved).toBe(1);
    expect(repo.getCatalogItem(mira.id)?.excluded).toBe(0);
  });

  test("an exclusion clears the approval and reaches the variants", () => {
    const projectId = freshProject();
    const mira = named(projectId, "Mira");
    repo.updateCatalogItem(mira.id, { approved: true });
    repo.updateCatalogItem(mira.id, { excluded: true });
    const after = repo.getCatalogItem(mira.id)!;
    expect(after.excluded).toBe(1);
    expect(after.approved).toBe(0);
    expect(after.variants.every((v) => v.excluded === 1)).toBe(true);
  });

  test("a variant stays out while its parent is out", () => {
    const projectId = freshProject();
    const mira = named(projectId, "Mira");
    repo.updateCatalogItem(mira.id, { excluded: true });
    const variant = repo.getCatalogItem(mira.id)!.variants[0]!;
    repo.updateCatalogItem(variant.id, {
      name: variant.name,
      description: variant.description,
      visual: variant.visual,
      approved: true,
      excluded: false,
    });
    expect(repo.getCatalogItem(mira.id)!.variants[0]!.excluded).toBe(1);
  });

  test("a variant comes back in when its parent is in", () => {
    const projectId = freshProject();
    const mira = named(projectId, "Mira");
    const variant = repo.getCatalogItem(mira.id)!.variants[0]!;
    repo.updateCatalogItem(variant.id, { excluded: true });
    repo.updateCatalogItem(variant.id, { excluded: false });
    expect(repo.getCatalogItem(mira.id)!.variants[0]!.excluded).toBe(0);
  });
});

describe("catalogProgress", () => {
  test("is complete when every root entry is approved or excluded", () => {
    const projectId = freshProject();
    expect(repo.catalogProgress(projectId).complete).toBe(false);
    repo.updateCatalogItem(named(projectId, "Mira").id, { approved: true });
    repo.updateCatalogItem(named(projectId, "Ivo").id, { excluded: true });
    repo.updateCatalogItem(named(projectId, "Salt Market").id, {
      approved: true,
    });
    expect(repo.catalogProgress(projectId).complete).toBe(true);
  });
});

describe("reopenPage", () => {
  test("sends an approved page and its chapter back to planned", () => {
    const projectId = freshProject();
    const chapter = repo.getChapters(projectId)[0]!;
    repo.savePages(projectId, chapter.id, [
      {
        panels: [
          {
            shot: "wide",
            action: "Mira waits at the Salt Market.",
            dialogue: [],
            refs: [],
            row: 0,
            col: 0,
            span: 1,
          },
        ],
      },
    ]);
    const page = repo.getChapter(chapter.id)!.pages[0]!;
    repo.setPageStatus(page.id, true);
    repo.setChapterStatus(chapter.id, true);
    repo.reopenPage(page.id);
    const after = repo.getChapter(chapter.id)!;
    expect(after.pages[0]!.status).toBe("planned");
    expect(after.pages[0]!.approved_at).toBeNull();
    expect(repo.getChapters(projectId)[0]!.status).toBe("planned");
  });
});
