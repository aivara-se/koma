// Every number and every word that fixes the look of a series. v1.0 locks
// these: the interface shows them and never lets the user change them. One
// series, one look, one density.

export const ART_STYLE = {
  name: "Ink & screentone",
  /** The same block, word for word, in every image call of the series. */
  block:
    "Modern manga interior art, clean black ink linework, accurate anatomy, " +
    "screentone shading, limited palette of ink black, paper white and one muted " +
    "vermilion accent, dramatic staging, high contrast. No colour gradients. " +
    "No text, no letters, no speech balloons, no panel borders, no watermark.",
} as const;

export const IMAGE = {
  /** Panels and plates are generated square; the page layout crops them. */
  width: 1024,
  height: 1024,
  format: "png",
  /** A variant sheet is one image with the same character in every view. */
  sheetViews: ["front", "three-quarter", "profile"],
} as const;

export const PAGE = {
  /** Webtoon-safe width, so a page reads on a phone without zooming. */
  width: 1080,
  panelsPerPage: 5,
  maxBalloonsPerPanel: 2,
  captionChars: 120,
} as const;

export const DENSITY = {
  /** Which share of the chapter's sentences survives compression. */
  keep: 0.45,
  minSentenceChars: 40,
  /** A beat shorter than this is folded into its neighbour. */
  mergeUnder: 60,
} as const;

export const STORY = {
  maxChars: 200_000,
  minChars: 400,
  chapterTargetWords: 1200,
} as const;

/** Shown in the interface so the locked values are never a mystery. */
export const LOCKED = [
  { label: "Art style", value: ART_STYLE.name },
  { label: "Panel size", value: `${IMAGE.width} × ${IMAGE.height}` },
  {
    label: "Density",
    value: `${Math.round(DENSITY.keep * 100)}% of beats kept`,
  },
  {
    label: "Page",
    value: `${PAGE.width} px wide, ${PAGE.panelsPerPage} panels`,
  },
] as const;
