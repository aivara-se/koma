import { describe, expect, test } from "bun:test";
import { PAGE } from "../config";
import { layoutFor, planChapter, selectBeats } from "./plan";

const TEXT = `Mira walked into the Salt Market and stopped at the corner stall.
"You are late," Sable said, and put down the lamp.
Ivo waited by the harbour office in their father's coat, saying nothing at all.
The rain came off the water in sheets and the shutters banged all night long.
At dawn the lighthouse was still dark and the whole town could see it.
Mira climbed the hundred and twelve steps with a crate of brass fittings.
The clockwork turned, slowly at first, and then the beam found the sea.`;

describe("selectBeats", () => {
  test("keeps fewer beats than sentences and never none", () => {
    const beats = selectBeats(TEXT);
    const all = TEXT.split("\n").filter(Boolean);
    expect(beats.length).toBeGreaterThan(0);
    expect(beats.length).toBeLessThanOrEqual(all.length);
  });
});

describe("layoutFor", () => {
  test("covers every panel exactly once", () => {
    for (let n = 1; n <= 9; n++) {
      const boxes = layoutFor(n);
      expect(boxes.length).toBe(n);
      expect(new Set(boxes.map((b) => `${b.row}:${b.col}`)).size).toBe(n);
    }
  });

  test("starts with a full-width row", () => {
    expect(layoutFor(5)[0]!.span).toBe(2);
    expect(layoutFor(5)[0]!.col).toBe(0);
  });
});

describe("planChapter", () => {
  const pages = planChapter(
    TEXT,
    ["Mira", "Ivo", "Sable"],
    ["Salt Market", "Lighthouse"],
  );

  test("never puts more panels on a page than the config allows", () => {
    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages)
      expect(page.panels.length).toBeLessThanOrEqual(PAGE.panelsPerPage);
  });

  test("carries the named cast into the panel references", () => {
    const refs = pages.flatMap((p) => p.panels.flatMap((pn) => pn.refs));
    expect(refs).toContain("Mira");
    expect(refs).toContain("Sable");
  });

  test("keeps a spoken line with a speaker", () => {
    const lines = pages.flatMap((p) => p.panels.flatMap((pn) => pn.dialogue));
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]!.text).toContain("You are late");
    expect(lines[0]!.speaker.length).toBeGreaterThan(0);
  });

  test("gives every panel the position the page needs", () => {
    for (const page of pages) {
      for (const panel of page.panels) {
        expect(panel.row).toBeGreaterThanOrEqual(0);
        expect(panel.span === 1 || panel.span === 2).toBe(true);
      }
    }
  });
});
