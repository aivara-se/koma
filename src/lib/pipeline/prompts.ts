// Every prompt is built here, so a page and a reference plate say the same
// thing about the same character. The style block is appended verbatim.

import { ART_STYLE, PAGE, PLATE } from "../config";
import type { CatalogItem, Chapter, Page } from "../types";

function join(parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export function characterPrompt(
  item: CatalogItem,
  variant?: CatalogItem,
): string {
  const subject = variant
    ? `${item.name}, ${variant.name.toLowerCase()}`
    : item.name;
  const detail = variant ? variant.description : item.description;
  return join([
    `Character reference sheet of ${subject}.`,
    detail,
    item.visual,
    `Draw front, three-quarter and profile views of one person, full body, identical face, identical outfit, neutral studio light, plain light grey background, at ${PLATE.width}×${PLATE.height}.`,
    ART_STYLE.plate,
  ]);
}

export function locationPrompt(
  item: CatalogItem,
  variant?: CatalogItem,
): string {
  const subject = variant
    ? `${item.name} — ${variant.name.toLowerCase()}`
    : item.name;
  const detail = variant ? variant.description : item.description;
  return join([
    `Establishing plate of ${subject}.`,
    detail,
    item.visual,
    `One wide view of the whole place at ${PLATE.width}×${PLATE.height}, readable layout, no people in the foreground.`,
    ART_STYLE.plate,
  ]);
}

/** One prompt, one finished comic page, drawn in a single image call. */
export function pagePrompt(
  pageNumber: number,
  chapterTitle: string,
  beat: string,
  direction: string[],
  refs: CatalogItem[],
  setting: string,
): string {
  const cast = refs
    .filter((r) => r.kind === "character")
    .map((r) => `${r.name}: ${r.description}`);
  const [min, max] = PAGE.panelRange;
  return join([
    `Page ${pageNumber} of the chapter "${chapterTitle}". One complete manga page.`,
    `Compose ${min} to ${max} panels in a clear grid, black gutters between them, black panel borders, read top to bottom.`,
    setting ? `The scene: ${setting}.` : "",
    `This page shows: ${beat}`,
    direction.length ? `Panel plan: ${direction.join(" ")}` : "",
    cast.length
      ? `Cast — keep every face, hairstyle, body and outfit identical to the reference images: ${cast.join(" | ")}`
      : "",
    "Art only. The letterer adds every word later, so draw no text, no balloons and no captions.",
    ART_STYLE.block,
  ]);
}

/** The page prompt shown to the user, assembled from the same parts. */
export function pageDocument(
  page: Page,
  chapter: Chapter,
  refs: CatalogItem[],
): string {
  const setting = refs.find((r) => r.kind === "location")?.description ?? "";
  return pagePrompt(
    page.idx + 1,
    chapter.title,
    page.beat,
    page.script.direction,
    refs,
    setting,
  );
}

export function revisePrompt(original: string, note: string): string {
  const clean = note.replace(/\s+/g, " ").trim();
  return clean ? `${original}\nRevision note: ${clean}` : original;
}
