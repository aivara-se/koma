import { fail, redirect } from "@sveltejs/kit";
import { join } from "node:path";
import { characterPrompt, locationPrompt } from "$lib/pipeline/prompts";
import { IMAGE_DIR } from "$lib/server/db";
import { drawPlate } from "$lib/server/images";
import { hasModel } from "$lib/server/llm";
import {
  approveCatalog,
  catalogProgress,
  getCatalog,
  getCatalogItem,
  getProject,
  saveImage,
  updateCatalogItem,
} from "$lib/server/repo";
import type { CatalogItem } from "$lib/types";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ params }) => {
  const items = getCatalog(params.project);
  return {
    characters: items.filter((i) => i.kind === "character"),
    locations: items.filter((i) => i.kind === "location"),
    progress: catalogProgress(params.project),
    locked: Boolean(getProject(params.project)?.catalog_approved_at),
    model: hasModel,
  };
};

function refsFor(item: CatalogItem): string[] {
  const paths: string[] = [];
  if (item.image) paths.push(join(IMAGE_DIR, item.image.path));
  return paths;
}

export const actions: Actions = {
  save: async ({ request, params }) => {
    if (getProject(params.project)?.catalog_approved_at)
      return fail(409, {
        message: "The catalog is locked. Read the story again to change it.",
      });
    const form = await request.formData();
    const itemId = String(form.get("itemId") ?? "");
    if (!itemId) return fail(400, { message: "Missing entry" });
    // A card form always carries a name, so it owns every field; a bare
    // approve/exclude post from elsewhere only touches the box it sends.
    const patch: {
      name?: string;
      description?: string;
      visual?: string;
      approved?: boolean;
      excluded?: boolean;
    } = {};
    const isCard =
      form.has("name") || form.has("description") || form.has("visual");
    if (isCard) {
      patch.name = String(form.get("name") ?? "");
      patch.description = String(form.get("description") ?? "");
      patch.visual = String(form.get("visual") ?? "");
      patch.approved = form.get("approved") === "on";
      patch.excluded = form.get("excluded") === "on";
    } else {
      if (form.has("approved")) patch.approved = form.get("approved") === "on";
      if (form.has("excluded")) patch.excluded = form.get("excluded") === "on";
    }
    updateCatalogItem(itemId, patch);
    redirect(303, `/p/${params.project}/catalog`);
  },

  draw: async ({ request, params }) => {
    if (getProject(params.project)?.catalog_approved_at)
      return fail(409, {
        message: "The catalog is locked. Read the story again to change it.",
      });
    const form = await request.formData();
    const itemId = String(form.get("itemId") ?? "");
    const item = getCatalogItem(itemId);
    if (!item) return fail(404, { message: "Missing entry" });

    const parent = item.parent_id ? getCatalogItem(item.parent_id) : null;
    const prompt =
      item.kind === "character"
        ? parent
          ? characterPrompt(parent, item)
          : characterPrompt(item)
        : parent
          ? locationPrompt(parent, item)
          : locationPrompt(item);

    const refs = parent ? refsFor(parent) : [];
    const art = await drawPlate(prompt, {
      label: parent ? `${parent.name} — ${item.name}` : item.name,
      kind: item.kind,
      description: item.description,
      refs,
    });
    saveImage(params.project, "catalog", item.id, art);
    redirect(303, `/p/${params.project}/catalog`);
  },

  approve: async ({ params }) => {
    const progress = catalogProgress(params.project);
    if (!progress.complete) {
      return fail(409, {
        message: "Approve or exclude every entry before the catalog is locked.",
      });
    }
    approveCatalog(params.project);
    redirect(303, `/p/${params.project}/chapters`);
  },
};
