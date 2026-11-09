import { error } from "@sveltejs/kit";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { zip, type ZipEntry } from "$lib/server/cbz";
import { IMAGE_DIR } from "$lib/server/db";
import { getBook, getProject } from "$lib/server/repo";
import type { RequestHandler } from "./$types";

/** A CBZ is a ZIP of images: page order in the file name, no compression. */
export const GET: RequestHandler = async ({ params }) => {
  const project = getProject(params.project);
  if (!project) error(404, "No such story");
  const pages = getBook(params.project);
  if (pages.length === 0) error(404, "No approved pages yet");

  const entries: ZipEntry[] = [];
  for (const [i, page] of pages.entries()) {
    if (!page.image) continue;
    const bytes = await readFile(join(IMAGE_DIR, page.image.path));
    const ext = page.image.path.split(".").pop()?.toLowerCase() ?? "png";
    const index = String(i + 1).padStart(3, "0");
    entries.push({ name: `${index}-page.${ext}`, data: new Uint8Array(bytes) });
  }
  if (entries.length === 0) error(404, "No approved pages yet");

  const body = zip(entries);
  const name = `${
    project.title
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "comic"
  }.cbz`;
  const blob = new Blob([body as unknown as BlobPart], {
    type: "application/vnd.comicbook+zip",
  });
  return new Response(blob, {
    headers: {
      "content-type": "application/vnd.comicbook+zip",
      "content-disposition": `attachment; filename="${name}"`,
      "content-length": String(body.length),
    },
  });
};
