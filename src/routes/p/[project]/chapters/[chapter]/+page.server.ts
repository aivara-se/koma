import { error, fail, redirect } from "@sveltejs/kit";
import { join } from "node:path";
import { planChapter } from "$lib/pipeline/plan";
import { panelPrompt } from "$lib/pipeline/prompts";
import { IMAGE_DIR } from "$lib/server/db";
import { drawArt } from "$lib/server/images";
import { rewritePrompt } from "$lib/server/llm";
import {
  catalogProgress,
  chapterProgress,
  getCatalog,
  getChapter,
  getPage,
  saveImage,
  savePages,
  setChapterStatus,
  setPagePrompt,
  setPageStatus,
  setPanelImage,
} from "$lib/server/repo";
import type { CatalogItem } from "$lib/types";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ params }) => {
  const chapter = getChapter(params.chapter);
  if (!chapter) error(404, "No such chapter");
  const catalog = getCatalog(params.project);
  return {
    chapter,
    catalog,
    progress: chapterProgress(params.chapter),
    byId: Object.fromEntries(
      catalog.flatMap((c) => [c, ...c.variants]).map((c) => [c.id, c]),
    ) as Record<string, CatalogItem>,
  };
};

function refPaths(items: CatalogItem[]): string[] {
  return items
    .map((i) => i.image)
    .filter((i): i is NonNullable<typeof i> => Boolean(i))
    .map((i) => join(IMAGE_DIR, i.path));
}

export const actions: Actions = {
  plan: async ({ params }) => {
    const chapter = getChapter(params.chapter);
    if (!chapter) return fail(404, { message: "No such chapter" });
    const catalog = getCatalog(params.project);
    const characters = catalog
      .filter((c) => c.kind === "character" && !c.excluded)
      .map((c) => c.name);
    const locations = catalog
      .filter((c) => c.kind === "location" && !c.excluded)
      .map((c) => c.name);
    if (characters.length === 0)
      return fail(409, { message: "The catalog has no approved characters." });
    savePages(
      params.project,
      params.chapter,
      planChapter(chapter.source, characters, locations),
    );
    redirect(303, `/p/${params.project}/chapters/${params.chapter}`);
  },

  panel: async ({ request, params }) => {
    const form = await request.formData();
    const panelId = String(form.get("panelId") ?? "");
    const pageId = String(form.get("pageId") ?? "");
    const page = getPage(pageId);
    const panel = page?.panels.find((p) => p.id === panelId);
    if (!page || !panel) return fail(404, { message: "No such panel" });

    const catalog = getCatalog(params.project);
    const map = new Map(
      catalog.flatMap((c) => [c, ...c.variants]).map((c) => [c.id, c]),
    );
    const refs = panel.refs
      .map((id) => map.get(id))
      .filter((i): i is CatalogItem => Boolean(i));
    const setting = refs.find((r) => r.kind === "location");
    const prompt = panelPrompt(page, panel, refs, setting?.description ?? "");
    const art = await drawArt(prompt, {
      label: `${page.idx + 1}.${panel.idx + 1}`,
      kind: "panel",
      refs: refPaths(refs),
    });
    const image = saveImage(params.project, "panel", panel.id, art);
    setPanelImage(panel.id, image.id);
    redirect(303, `/p/${params.project}/chapters/${params.chapter}`);
  },

  draw: async ({ request, params }) => {
    const form = await request.formData();
    const pageId = String(form.get("pageId") ?? "");
    const force = form.get("force") === "on";
    const page = getPage(pageId);
    if (!page) return fail(404, { message: "No such page" });
    const catalog = getCatalog(params.project);
    const map = new Map(
      catalog.flatMap((c) => [c, ...c.variants]).map((c) => [c.id, c]),
    );
    for (const panel of page.panels) {
      if (panel.image && !force) continue;
      const refs = panel.refs
        .map((id) => map.get(id))
        .filter((i): i is CatalogItem => Boolean(i));
      const setting = refs.find((r) => r.kind === "location");
      const prompt = panelPrompt(page, panel, refs, setting?.description ?? "");
      const art = await drawArt(prompt, {
        label: `${page.idx + 1}.${panel.idx + 1}`,
        kind: "panel",
        refs: refPaths(refs),
      });
      const image = saveImage(params.project, "panel", panel.id, art);
      setPanelImage(panel.id, image.id);
    }
    redirect(303, `/p/${params.project}/chapters/${params.chapter}`);
  },

  prompt: async ({ request, params }) => {
    const form = await request.formData();
    setPagePrompt(
      String(form.get("pageId") ?? ""),
      String(form.get("prompt") ?? ""),
    );
    redirect(303, `/p/${params.project}/chapters/${params.chapter}`);
  },

  revise: async ({ request, params }) => {
    const form = await request.formData();
    const pageId = String(form.get("pageId") ?? "");
    const note = String(form.get("note") ?? "").trim();
    const page = getPage(pageId);
    if (!page || !note) return fail(400, { message: "Write a note first." });
    setPagePrompt(pageId, await rewritePrompt(page.prompt, note));
    redirect(303, `/p/${params.project}/chapters/${params.chapter}`);
  },

  approve: async ({ request, params }) => {
    const form = await request.formData();
    const pageId = String(form.get("pageId") ?? "");
    const approve = form.get("approve") === "1";
    const page = getPage(pageId);
    if (!page) return fail(404, { message: "No such page" });
    if (approve && page.panels.some((p) => !p.image)) {
      return fail(409, {
        message: "Draw every panel before the page is approved.",
      });
    }
    setPageStatus(pageId, approve);
    if (!approve) setChapterStatus(params.chapter, false);
    redirect(303, `/p/${params.project}/chapters/${params.chapter}`);
  },

  "chapter-approve": async ({ params }) => {
    const progress = chapterProgress(params.chapter);
    if (progress.pages === 0)
      return fail(409, { message: "This chapter has no pages yet." });
    if (progress.approved !== progress.pages) {
      return fail(409, { message: "Every page must be approved first." });
    }
    setChapterStatus(params.chapter, true);
    redirect(303, `/p/${params.project}/chapters`);
  },
};
