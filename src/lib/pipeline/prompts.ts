// Every prompt is built here, so a page and a reference plate say the same
// thing about the same character. The style block is appended verbatim.

import { ART_STYLE, IMAGE, PAGE } from "../config";
import type { CatalogItem, Page, Panel } from "../types";

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
    `Draw ${IMAGE.sheetViews.join(", ")} views of one person, full body, identical face, identical outfit, neutral studio light, plain light grey background.`,
    ART_STYLE.block,
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
    `One wide view of the whole place, readable layout, no people in the foreground.`,
    ART_STYLE.block,
  ]);
}

export function panelPrompt(
  page: Page,
  panel: Panel,
  refs: CatalogItem[],
  setting: string,
): string {
  const cast = refs.map((r) =>
    r.kind === "character"
      ? `${r.name}: ${r.description}`
      : `${r.name} (setting): ${r.description}`,
  );
  return join([
    `Panel ${panel.idx + 1} of page ${page.idx + 1}.`,
    `Shot: ${panel.shot}.`,
    panel.action,
    setting ? `Setting: ${setting}.` : "",
    cast.length
      ? `Reference cast — keep face, hair, outfit and proportions exactly: ${cast.join(" | ")}`
      : "",
    `Single panel art at ${IMAGE.width}×${IMAGE.height}. No words in the image.`,
    ART_STYLE.block,
  ]);
}

/** The whole page as one prompt, kept for the user to read and edit. */
export function pagePrompt(
  page: Page,
  refs: CatalogItem[],
  setting: string,
): string {
  const cast = refs.filter((r) => r.kind === "character");
  const lines = page.panels.map(
    (p, i) =>
      `${i + 1}. ${p.shot} — ${p.action}${p.dialogue.length ? ` (speech: ${p.dialogue.map((d) => `${d.speaker}: "${d.text}"`).join(" / ")})` : ""}`,
  );
  return join([
    `Manga page ${page.idx + 1}, ${page.panels.length} panels, read top to bottom.`,
    setting ? `One set throughout: ${setting}.` : "",
    cast.length ? `Cast: ${cast.map((c) => c.name).join(", ")}.` : "",
    lines.join(" "),
    `Panel art is generated one panel at a time from the reference sheets; the page is assembled by Koma.`,
    ART_STYLE.block,
  ]);
}

export function caption(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= PAGE.captionChars
    ? clean
    : `${clean.slice(0, PAGE.captionChars - 1).trimEnd()}…`;
}

export function revisePrompt(original: string, note: string): string {
  const clean = note.replace(/\s+/g, " ").trim();
  return clean ? `${original}\nRevision note: ${clean}` : original;
}
