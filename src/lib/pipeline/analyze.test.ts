import { describe, expect, test } from "bun:test";
import { DEMO_STORY } from "../demo";
import { analyseStory, sentences, splitChapters } from "./analyze";

describe("splitChapters", () => {
  test("uses the story's own headings", () => {
    const chapters = splitChapters(DEMO_STORY);
    expect(chapters.length).toBe(4);
    expect(chapters[0]!.title).toContain("Chapter One");
    expect(chapters[3]!.title).toContain("Chapter Four");
  });

  test("falls back to word count when there are no headings", () => {
    const text = Array.from(
      { length: 900 },
      (_, i) => `Sentence number ${i} about the sea.`,
    ).join(" ");
    const chapters = splitChapters(text);
    expect(chapters.length).toBeGreaterThan(1);
    expect(chapters.every((c) => c.text.length > 0)).toBe(true);
  });

  test("keeps every chapter's words", () => {
    const total = splitChapters(DEMO_STORY)
      .map((c) => c.text.split(/\s+/).length)
      .reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(DEMO_STORY.split(/\s+/).length * 0.95);
  });
});

describe("analyseStory", () => {
  const analysis = analyseStory(DEMO_STORY);
  const names = analysis.characters.map((c) => c.name);

  test("finds the speaking cast", () => {
    for (const name of ["Mira", "Ivo", "Sable", "Toma", "Coyle"]) {
      expect(names.some((n) => n.includes(name))).toBe(true);
    }
  });

  test("does not turn ordinary words into characters", () => {
    for (const junk of ["The", "Chapter", "Then", "When"]) {
      expect(names).not.toContain(junk);
    }
  });

  test("finds the named places", () => {
    const places = analysis.locations.map((l) => l.name).join(" | ");
    expect(places).toContain("Blackwater");
    expect(places).toContain("Salt Market");
  });

  test("records the story's real changes as variants", () => {
    const mira = analysis.characters.find((c) => c.name.startsWith("Mira"))!;
    const ivO = analysis.characters.find((c) => c.name.startsWith("Ivo"))!;
    expect(mira.variants.some((v) => v.name === "Hair cut")).toBe(true);
    expect(ivO.variants.some((v) => v.name === "New clothes")).toBe(true);
  });

  test("gives every entry a description and a visual brief", () => {
    for (const entry of [...analysis.characters, ...analysis.locations]) {
      expect(entry.description.length).toBeGreaterThan(20);
      expect(entry.visual.length).toBeGreaterThan(0);
    }
  });
});

describe("sentences", () => {
  test("splits on terminal punctuation and keeps quotes", () => {
    const out = sentences('"You are late," he said. She left. The door shut!');
    expect(out.length).toBe(3);
    expect(out[0]).toContain("You are late");
  });
});
