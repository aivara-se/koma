// The text side of the model. Any OpenAI-compatible chat endpoint works. A
// novel is read in consecutive chunks and the catalogs are merged, so a long
// story is not cut at a character limit. With no key the caller falls back to
// the offline analyser, so the product never pretends a model read the story.

import type { Analysis, CatalogDraft } from "../types";

const KEY = process.env.KOMA_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
const BASE = (process.env.KOMA_BASE_URL ?? "https://api.openai.com/v1").replace(
  /\/+$/,
  "",
);
export const TEXT_MODEL = process.env.KOMA_TEXT_MODEL ?? "gpt-4.1-mini";
export const hasModel = KEY.length > 0;

/** One call reads this much of a novel; a longer story is read in parts. */
export const CHUNK_CHARS = 90_000;

const SYSTEM = `You are a manga editor. You read part of a story and return a catalog of everything the artist must keep consistent.
Return JSON only, with this shape:
{"characters":[{"name":"","description":"","visual":"","variants":[{"name":"","description":"","visual":""}]}],
 "locations":[{"name":"","description":"","visual":"","variants":[{"name":"","description":"","visual":""}]}],
 "chapters":[{"title":"","text":""}]}

Rules:
- A character is anyone the story follows or names more than in passing. Include the narrator only if they appear.
- A location is any place the action stands in, including a room inside a named building.
- description: what the story tells us, in two sentences, no invention.
- visual: what an artist must draw — age, build, hair, eyes, clothes, scars, light, materials — one or two sentences.
- A variant is a real change shown in the story: hair cut, new uniform, injured, a house after the fire, the same street at night. Name it briefly. Do not invent one.
- chapters: split on the story's own headings in the part you were given. Keep every word of the text across them.
- This may be one part of a longer novel. Return only what this part shows.`;

function parseJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced?.[1] ?? text).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1)
    throw new Error("model returned no JSON object");
  return JSON.parse(body.slice(start, end + 1)) as T;
}

/** Cuts a story at chapter headings into parts a model can read in one call. */
export function chunkStory(story: string, limit = CHUNK_CHARS): string[] {
  const blocks = story
    .split(/(?=^\s*(?:chapter|part|episode|book)\b)/gim)
    .filter((b) => b.trim());
  const parts: string[] = [];
  let current = "";
  for (const block of blocks.length ? blocks : [story]) {
    if (block.length > limit) {
      if (current.trim()) parts.push(current);
      current = "";
      const words = block.split(/\s+/);
      let piece = "";
      for (const word of words) {
        if (piece.length + word.length + 1 > limit) {
          parts.push(piece);
          piece = "";
        }
        piece += `${word} `;
      }
      if (piece.trim()) parts.push(piece.trim());
      continue;
    }
    if (current.length + block.length > limit) {
      parts.push(current);
      current = "";
    }
    current += block;
  }
  if (current.trim()) parts.push(current);
  return parts;
}

function mergeItems(into: CatalogDraft[], from: CatalogDraft[] = []): void {
  for (const item of from) {
    if (!item?.name) continue;
    const found = into.find(
      (i) => i.name.toLowerCase() === item.name.toLowerCase(),
    );
    if (!found) {
      into.push({ ...item, variants: [...(item.variants ?? [])] });
      continue;
    }
    if (item.description && item.description.length > found.description.length)
      found.description = item.description;
    if (item.visual && item.visual.length > found.visual.length)
      found.visual = item.visual;
    for (const variant of item.variants ?? []) {
      if (
        !found.variants.some(
          (v) => v.name.toLowerCase() === variant.name.toLowerCase(),
        )
      ) {
        found.variants.push(variant);
      }
    }
  }
}

/** Merges the catalogs of consecutive parts into one; names match case-blind. */
export function mergeAnalyses(parts: Analysis[]): Analysis {
  const merged: Analysis = { characters: [], locations: [], chapters: [] };
  for (const part of parts) {
    mergeItems(merged.characters, part.characters);
    mergeItems(merged.locations, part.locations);
    for (const chapter of part.chapters ?? []) {
      if (!chapter?.text) continue;
      if (
        !merged.chapters.some(
          (c) => c.title === chapter.title && c.text === chapter.text,
        )
      ) {
        merged.chapters.push(chapter);
      }
    }
  }
  return merged;
}

async function readOnce(text: string): Promise<Analysis> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: text },
      ],
    }),
    signal: AbortSignal.timeout(300_000),
  });
  if (!res.ok)
    throw new Error(`model ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content ?? "";
  const parsed = parseJson<Analysis>(content);
  if (
    !Array.isArray(parsed.characters) ||
    !Array.isArray(parsed.locations) ||
    !Array.isArray(parsed.chapters)
  ) {
    throw new Error("model returned an incomplete catalog");
  }
  return parsed;
}

/** Reads the parts in order and reports progress after each one. */
export async function analyseParts(
  parts: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ analysis: Analysis; provider: string }> {
  const results: Analysis[] = [];
  for (const [i, part] of parts.entries()) {
    results.push(await readOnce(part));
    onProgress?.(i + 1, parts.length);
  }
  return {
    analysis: mergeAnalyses(results),
    provider:
      parts.length > 1 ? `${TEXT_MODEL} · ${parts.length} parts` : TEXT_MODEL,
  };
}

export async function analyseWithModel(
  story: string,
): Promise<{ analysis: Analysis; provider: string }> {
  if (!hasModel) throw new Error("no model key");
  return analyseParts(chunkStory(story));
}

export async function rewritePrompt(
  prompt: string,
  note: string,
): Promise<string> {
  if (!hasModel) return `${prompt}\nRevision note: ${note.trim()}`;
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You rewrite manga page prompts. Keep every fact in the original prompt. Apply the user's note. Return the new prompt only, one paragraph, no commentary.",
        },
        { role: "user", content: `PROMPT:\n${prompt}\n\nNOTE:\n${note}` },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) return `${prompt}\nRevision note: ${note.trim()}`;
  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return payload.choices?.[0]?.message?.content?.trim() || prompt;
}
