// The text side of the model. Any OpenAI-compatible chat endpoint works. With
// no key the caller falls back to the offline analyser, so the product never
// pretends a model read the story when none did.

import type { Analysis } from "../types";

const KEY = process.env.KOMA_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
const BASE = (process.env.KOMA_BASE_URL ?? "https://api.openai.com/v1").replace(
  /\/+$/,
  "",
);
export const TEXT_MODEL = process.env.KOMA_TEXT_MODEL ?? "gpt-4.1-mini";
export const hasModel = KEY.length > 0;

/**
 * The most characters one model call reads. A longer story is refused, never
 * cut: "read it once" is the product, and a silent cut drops the ending.
 */
export const MODEL_MAX_CHARS = 120_000;

const SYSTEM = `You are a manga editor. You read a story and return a catalog of everything the artist must keep consistent.
Return JSON only, with this shape:
{"characters":[{"name":"","description":"","visual":"","variants":[{"name":"","description":"","visual":""}]}],
 "locations":[{"name":"","description":"","visual":"","variants":[...]}],
 "chapters":[{"title":"","text":""}]}

Rules:
- A character is anyone the story follows or names more than in passing. Include the narrator only if they appear.
- A location is any place the action stands in, including a room inside a named building.
- description: what the story tells us, in two sentences, no invention.
- visual: what an artist must draw — age, build, hair, eyes, clothes, scars, light, materials — one or two sentences.
- A variant is a real change shown in the story: hair cut, new uniform, injured, a house after the fire, the same street at night. Name it briefly. Do not invent one.
- chapters: split on the story's own headings. If it has none, split into chapters of about ${"1200"} words at a scene break, and keep every word of the story across them.`;

function parseJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced?.[1] ?? text).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1)
    throw new Error("model returned no JSON object");
  return JSON.parse(body.slice(start, end + 1)) as T;
}

export async function analyseWithModel(
  story: string,
): Promise<{ analysis: Analysis; provider: string }> {
  if (!hasModel) throw new Error("no model key");
  if (story.length > MODEL_MAX_CHARS)
    throw new Error(
      `story is ${story.length.toLocaleString()} characters; the model reads at most ${MODEL_MAX_CHARS.toLocaleString()}`,
    );
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
        { role: "user", content: story },
      ],
    }),
    signal: AbortSignal.timeout(180_000),
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
  return { analysis: parsed, provider: TEXT_MODEL };
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
            "You rewrite manga panel prompts. Keep every fact in the original prompt. Apply the user's note. Return the new prompt only, one paragraph, no commentary.",
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
