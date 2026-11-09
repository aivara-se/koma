// Chapter planning for a whole page at a time. Every sentence of the chapter
// lands on exactly one page, in order: a novel is compressed, never skipped.

import { DENSITY, PAGE } from "../config";
import type { Dialogue, PageDraft, PageScript } from "../types";
import { sentences } from "./analyze";

const QUOTE = /["“]([^"”]{2,240})["”]/g;

export function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

function words(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

/** Sentences that carry the story: a spoken line, an action, a change. */
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
    /\b(grabbed|ran|struck|slammed|turned|opened|pulled|climbed|fell|burned|burnt|died|kissed)\b/i.test(
      s,
    )
  )
    score += 1;
  if (s.length > 110) score += 1;
  return score;
}

/**
 * Cuts the chapter into consecutive chunks of about `wordsPerPage` source
 * words, at sentence boundaries. Every sentence is used exactly once.
 */
export function splitIntoPages(
  text: string,
  wordsPerPage: number = DENSITY.wordsPerPage,
): string[] {
  const all = sentences(text);
  const chunks: string[] = [];
  let current: string[] = [];
  let count = 0;
  for (const sentence of all) {
    current.push(sentence);
    count += words(sentence);
    if (count >= wordsPerPage) {
      chunks.push(current.join(" "));
      current = [];
      count = 0;
    }
  }
  if (current.length > 0) {
    const rest = current.join(" ");
    if (chunks.length > 0 && words(rest) < DENSITY.minWordsPerPage) {
      chunks[chunks.length - 1] = `${chunks[chunks.length - 1]} ${rest}`;
    } else {
      chunks.push(rest);
    }
  }
  return chunks;
}

/** The two or three sentences a reader must see on this page. */
function beatFor(chunk: string): string {
  const all = sentences(chunk);
  if (all.length === 0) return chunk;
  const ranked = all
    .map((s, i) => ({ s, i, score: scoreSentence(s) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, 2)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s);
  const beat = ranked.join(" ");
  return beat.length > 340 ? `${beat.slice(0, 339).trimEnd()}…` : beat;
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

export function planChapter(
  text: string,
  characters: string[],
  locations: string[],
): PageDraft[] {
  const chunks = splitIntoPages(text);
  const pages: PageDraft[] = [];
  let lastLocation = locations[0] ?? "";
  let lastSpeaker: string | null = null;

  for (const chunk of chunks) {
    const cast = characters.filter((c) =>
      new RegExp(`\\b${escape(c)}\\b`, "i").test(chunk),
    );
    // The place the page opens in: the first one the chunk names, not the
    // first one the catalog happens to hold.
    const place =
      locations
        .map((l) => ({
          l,
          at: chunk.search(new RegExp(`\\b${escape(l)}\\b`, "i")),
        }))
        .filter((x) => x.at >= 0)
        .sort((a, b) => a.at - b.at)[0]?.l ?? lastLocation;
    if (place) lastLocation = place;

    const lines: Dialogue[] = [];
    const all = sentences(chunk);
    for (const [i, sentence] of all.entries()) {
      // A pronoun sentence borrows the name from a neighbour: "…," he said.
      const named = characters.find((c) =>
        new RegExp(`\\b${escape(c)}\\b`, "i").test(sentence),
      );
      const neighbour = characters.find((c) =>
        new RegExp(`\\b${escape(c)}\\b`, "i").test(
          all[i + 1] ?? all[i - 1] ?? "",
        ),
      );
      for (const said of quotes(sentence)) {
        if (lines.length >= PAGE.maxDialogue) break;
        const speaker: string =
          named?.split(" ")[0] ??
          speakerIn(
            sentence,
            characters,
            neighbour?.split(" ")[0] ?? lastSpeaker,
          );
        if (speaker !== "voice") lastSpeaker = speaker;
        lines.push({ speaker, text: said });
      }
      if (lines.length >= PAGE.maxDialogue) break;
    }

    const beat = beatFor(chunk);
    const direction = [
      place ? `Wide establishing shot of ${place}.` : "",
    ].concat(
      sentences(beat)
        .slice(0, 3)
        .map((s, i) => {
          const text = stripQuotes(s)
            .replace(/^[…,.;:"“”'\s]+/, "")
            .replace(/["“”']+$/g, "")
            .trim();
          const shot = i === 0 ? "Medium" : i === 1 ? "Close-up" : "Reaction";
          return { shot, text };
        })
        // "… he said" is not a picture; keep only a line that shows something.
        .filter(
          (line) =>
            line.text.split(/\s+/).length >= 4 &&
            !/^[A-Z][a-zà-ÿ]+ said\b/.test(line.text),
        )
        .map((line) => `${line.shot}: ${line.text}`),
    );

    const script: PageScript = {
      caption: stripQuotes(sentences(chunk)[0] ?? beat).slice(0, 160),
      dialogue: lines,
      direction,
    };

    pages.push({
      beat,
      script,
      refs: [...cast.slice(0, 3), ...(place ? [place] : [])].filter(
        (v, i, a) => a.indexOf(v) === i,
      ),
    });
  }
  return pages;
}
