import { describe, expect, test } from "bun:test";
import { DENSITY, PAGE } from "../config";
import { sentences } from "./analyze";
import { planChapter, splitIntoPages } from "./plan";

const TEXT = `Mira walked into the Salt Market and stopped at the corner stall.
"You are late," Sable said, and put down the lamp.
Ivo waited by the harbour office in their father's coat, saying nothing at all.
The rain came off the water in sheets and the shutters banged all night long.
At dawn the lighthouse was still dark and the whole town could see it.
Mira climbed the hundred and twelve steps with a crate of brass fittings.
The clockwork turned, slowly at first, and then the beam found the sea.`;

describe("splitIntoPages", () => {
  test("uses every sentence exactly once, in order", () => {
    const chunks = splitIntoPages(TEXT, 30);
    const source = sentences(TEXT);
    const planned = chunks.flatMap((chunk) => sentences(chunk));
    expect(planned).toEqual(source);
    expect(chunks.length).toBeGreaterThan(1);
  });

  test("honours the word budget within one sentence", () => {
    const chunks = splitIntoPages(TEXT, 30);
    for (const chunk of chunks.slice(0, -1)) {
      expect(chunk.split(/\s+/).length).toBeGreaterThanOrEqual(30);
    }
  });

  test("never returns an empty page for a non-empty chapter", () => {
    expect(splitIntoPages("One short line.").length).toBe(1);
  });
});

describe("planChapter", () => {
  const pages = planChapter(
    TEXT,
    ["Mira", "Ivo", "Sable"],
    ["Salt Market", "Lighthouse"],
  );

  test("plans one page per chunk", () => {
    expect(pages.length).toBe(splitIntoPages(TEXT).length);
    expect(pages.length).toBeGreaterThan(0);
  });

  test("gives every page a beat, a caption and a panel plan", () => {
    for (const page of pages) {
      expect(page.beat.length).toBeGreaterThan(10);
      expect(page.script.caption.length).toBeGreaterThan(0);
      expect(page.script.direction.length).toBeGreaterThan(0);
    }
  });

  test("carries the named cast and the place into the references", () => {
    const refs = pages.flatMap((page) => page.refs);
    expect(refs).toContain("Mira");
    expect(refs).toContain("Salt Market");
  });

  test("keeps a spoken line with a speaker, and no more than the cap", () => {
    const lines = pages.flatMap((page) => page.script.dialogue);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]!.text).toContain("You are late");
    expect(lines[0]!.speaker).toBe("Sable");
    for (const page of pages)
      expect(page.script.dialogue.length).toBeLessThanOrEqual(PAGE.maxDialogue);
  });

  test("a page of the demo novel stays near the configured density", () => {
    const chunkWords = splitIntoPages(TEXT).map((c) => c.split(/\s+/).length);
    expect(Math.min(...chunkWords)).toBeLessThan(DENSITY.wordsPerPage * 1.5);
  });
});
