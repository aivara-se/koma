// Every number and every word that fixes the look of a series. v1.0 locks
// these: the interface shows them and never lets the user change them.

const LOOK =
  "Modern manga interior art, clean black ink linework, accurate anatomy, " +
  "screentone shading, limited palette of ink black, paper white and one muted " +
  "vermilion accent, dramatic staging, high contrast. No colour gradients.";

export const ART_STYLE = {
  name: "Ink & screentone",
  /** The same block, word for word, in every page prompt of the series. */
  block:
    `${LOOK} Draw one finished comic page: a clear grid of panels separated by ` +
    "black gutters, with black panel borders. No text, no letters, no speech " +
    "balloons, no captions, no page numbers, no watermark, no signature.",
  /** The same look, for the square catalog references. */
  plate: `${LOOK} Reference art only: no comic page, no panel grid, no gutters, no text.`,
} as const;

export const PAGE = {
  /** 1K portrait, the shape of a printed comic page. */
  width: 832,
  height: 1248,
  aspect: "2:3",
  label: "1K portrait",
  /** How many panels the model may compose on one page. */
  panelRange: [4, 6] as const,
  /** Spoken lines the page script may hold, for the lettering pass. */
  maxDialogue: 3,
} as const;

export const PLATE = {
  /** Catalog references are square: a turnaround, or one wide plate. */
  width: 1024,
  height: 1024,
} as const;

export const DENSITY = {
  /** Source words one comic page stands for: the compression setting. */
  wordsPerPage: 200,
  /** A page that would take less than this is folded into the one before. */
  minWordsPerPage: 60,
} as const;

export const STORY = {
  /** A novel fits: 1.5 M characters is roughly 250,000 words. */
  maxChars: 1_500_000,
  minChars: 400,
  /** Only used when a story carries no chapter headings at all. */
  chapterTargetWords: 2500,
} as const;

/** Shown in the interface so the locked values are never a mystery. */
export const LOCKED = [
  { label: "Art style", value: ART_STYLE.name },
  { label: "Page", value: `${PAGE.width} × ${PAGE.height} · ${PAGE.label}` },
  {
    label: "Panels",
    value: `${PAGE.panelRange[0]}–${PAGE.panelRange[1]} per page`,
  },
  { label: "Density", value: `${DENSITY.wordsPerPage} source words per page` },
] as const;
