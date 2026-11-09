// Chapter planning without a model: pick the beats, give each a shot, find the
// speaker, and name the catalog entries the panel has to reference. A model
// layer can replace the picking; the shape it returns is this one.

import { DENSITY, PAGE } from "../config";
import type { Dialogue, PageDraft, PanelDraft } from "../types";
import { sentences } from "./analyze";

const QUOTE = /["“]([^"”]{2,240})["”]/g;

function quotes(s: string): string[] {
  return [...s.matchAll(QUOTE)].map((m) => m[1]!.trim()).filter(Boolean);
}

function stripQuotes(s: string): string {
  return s
    .replace(QUOTE, "…")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function speakerIn(
  sentence: string,
  names: string[],
  fallback: string | null,
): string {
  // "…," Ivo said — the name often follows the quote, not the person.
  const after = sentence.match(
    /["”]\s*,?\s*([A-Z][a-zà-ÿ]+)\s+(?:said|asked|replied|shouted|whispered|answered|called|murmured)/,
  );
  if (after?.[1] && names.some((n) => n.split(" ")[0] === after[1]))
    return after[1];
  const found = names.find((n) =>
    new RegExp(`\\b${escape(n)}\\b`, "i").test(sentence),
  );
  if (found) return found.split(" ")[0]!;
  return fallback ?? "voice";
}

export function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Sentences that carry the story: a spoken line, a name, a change, a length. */
function scoreSentence(s: string): number {
  let score = 0;
  if (/["“]/.test(s)) score += 4;
  if (
    /\b(said|asked|shouted|whispered|replied|answered|called|murmured)\b/i.test(
      s,
    )
  )
    score += 2;
  if (
    /\b(grabbed|ran|struck|slammed|turned|opened|pulled|climbed|fell|burned|burnt)\b/i.test(
      s,
    )
  )
    score += 1;
  if (s.length > 110) score += 1;
  return score;
}

/** Splits one chapter into the beats that survive compression. */
export function selectBeats(text: string): string[] {
  const raw = sentences(text).filter(
    (s) => s.length >= DENSITY.minSentenceChars,
  );
  if (raw.length === 0) return [];
  const budget = Math.max(1, Math.round(raw.length * DENSITY.keep));
  const ranked = raw
    .map((s, i) => ({ s, i, score: scoreSentence(s) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, budget)
    .map((x) => x.i);
  const keep = new Set(ranked);
  keep.add(0);
  const kept = raw.filter((_, i) => keep.has(i));
  // Fold anything too short to draw into the beat before it.
  const merged: string[] = [];
  for (const s of kept) {
    const prev = merged[merged.length - 1];
    if (prev && s.length < DENSITY.mergeUnder)
      merged[merged.length - 1] = `${prev} ${s}`;
    else merged.push(s);
  }
  return merged;
}

export function shotFor(
  sentence: string,
  hasDialogue: boolean,
  index: number,
  first: boolean,
): string {
  if (first) return "establishing — wide";
  if (/\b(turned|looked|stared|glared|noticed|saw)\b/i.test(sentence))
    return "close-up on the face";
  if (hasDialogue && sentence.length < 140) return "medium two-shot";
  if (
    /\b(ran|slammed|grabbed|struck|burst|threw|pulled|kicked)\b/i.test(sentence)
  )
    return "low angle, action";
  if (index % PAGE.panelsPerPage === 4) return "wide, from above";
  return index % 2 === 0 ? "medium shot" : "over-the-shoulder";
}

/** Rows of one or two panels; the first row is always a wide establishing beat. */
export function layoutFor(
  count: number,
): { row: number; col: number; span: number }[] {
  // Each row is the span of its panels: [2] is one wide panel, [1, 1] a pair.
  const rows: number[][] = [];
  let left = count;
  if (count >= 3) {
    rows.push([2]);
    left -= 1;
  }
  while (left > 0) {
    if (left === 1) {
      rows.push([2]);
      left -= 1;
    } else if (left === 3) {
      rows.push([1, 1]);
      rows.push([2]);
      left = 0;
    } else {
      rows.push([1, 1]);
      left -= 2;
    }
  }
  const out: { row: number; col: number; span: number }[] = [];
  rows.forEach((row, r) => {
    row.forEach((span, c) => out.push({ row: r, col: c, span }));
  });
  return out;
}

export function planChapter(
  text: string,
  characters: string[],
  locations: string[],
): PageDraft[] {
  const beats = selectBeats(text);
  const pages: PageDraft[] = [];
  let lastLocation = locations[0] ?? "";
  let lastSpeaker: string | null = null;

  for (let i = 0; i < beats.length; i += PAGE.panelsPerPage) {
    const slice = beats.slice(i, i + PAGE.panelsPerPage);
    const boxes = layoutFor(slice.length);
    const panels: PanelDraft[] = slice.map((sentence, j) => {
      const said = quotes(sentence);
      const location = locations.find((l) =>
        new RegExp(`\\b${escape(l)}\\b`, "i").test(sentence),
      );
      if (location) lastLocation = location;
      const refs = characters.filter((c) =>
        new RegExp(`\\b${escape(c)}\\b`, "i").test(sentence),
      );
      if (refs[0]) lastSpeaker = refs[0].split(" ")[0]!;
      const dialogue: Dialogue[] = said
        .slice(0, PAGE.maxBalloonsPerPanel)
        .map((line) => ({
          speaker: speakerIn(sentence, characters, lastSpeaker),
          text: line,
        }));
      if (dialogue[0] && dialogue[0].speaker !== "voice")
        lastSpeaker = dialogue[0].speaker;
      const box = boxes[j] ?? { row: j, col: 0, span: 1 };
      return {
        shot: shotFor(
          sentence,
          dialogue.length > 0,
          j,
          j === 0 && pages.length === 0,
        ),
        action: stripQuotes(sentence),
        dialogue,
        refs: refs.slice(0, 3).length ? refs.slice(0, 3) : [],
        row: box.row,
        col: box.col,
        span: box.span,
      };
    });

    // A panel with no named character still needs the place it stands in.
    for (const p of panels)
      if (p.refs.length === 0 && lastLocation) p.refs = [lastLocation];

    pages.push({ panels });
  }
  return pages;
}
