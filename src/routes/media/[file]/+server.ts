import { error } from "@sveltejs/kit";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { IMAGE_DIR } from "$lib/server/db";
import type { RequestHandler } from "./$types";

const TYPES: Record<string, string> = {
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
  jpg: "image/jpeg",
};

export const GET: RequestHandler = async ({ params }) => {
  if (!/^[a-f0-9-]+\.(png|svg|webp|jpg)$/i.test(params.file))
    error(404, "Not found");
  const ext = params.file.split(".").pop()!.toLowerCase();
  try {
    const bytes = await readFile(join(IMAGE_DIR, params.file));
    return new Response(bytes, {
      headers: {
        "content-type": TYPES[ext] ?? "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    error(404, "Not found");
  }
};
