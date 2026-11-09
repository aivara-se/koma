// The image side. A page is one image call, portrait 1K. Two providers:
// Google's image model (nano banana, or any Gemini image model) and any
// OpenAI-compatible images endpoint. Without a key a placeholder is drawn, so
// the pipeline is runnable and visibly not final art.

import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { ART_STYLE, PAGE, PLATE } from "../config";
import { IMAGE_DIR } from "./db";

const GEMINI_KEY =
  process.env.KOMA_GEMINI_KEY ?? process.env.GEMINI_API_KEY ?? "";
const OPENAI_KEY = process.env.KOMA_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
const OPENAI_BASE = (
  process.env.KOMA_BASE_URL ?? "https://api.openai.com/v1"
).replace(/\/+$/, "");

const GEMINI_MODEL = process.env.KOMA_IMAGE_MODEL ?? "gemini-2.5-flash-image";
const OPENAI_MODEL = process.env.KOMA_IMAGE_MODEL ?? "gpt-image-1";

export const hasImages = GEMINI_KEY.length > 0 || OPENAI_KEY.length > 0;
export const imageProvider = GEMINI_KEY
  ? GEMINI_MODEL
  : OPENAI_KEY
    ? OPENAI_MODEL
    : "placeholder";

export interface Artwork {
  /** File name inside the image directory. */
  file: string;
  href: string;
  provider: string;
  prompt: string;
}

interface Shape {
  width: number;
  height: number;
  aspect: string;
  /** The nearest size the OpenAI endpoint offers. */
  size: string;
}

const PAGE_SHAPE: Shape = { ...PAGE, size: "1024x1536" };
const PLATE_SHAPE: Shape = { ...PLATE, aspect: "1:1", size: "1024x1024" };

const INK = "#141414";
const PAPER = "#efe9dc";
const ACCENT = "#c8382a";

function escapeXml(s: string): string {
  return s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function wrap(text: string, chars: number, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > chars) {
      if (line) lines.push(line.trim());
      line = word;
    } else line = `${line} ${word}`;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.slice(0, max);
}

/** A portrait page mock: a panel grid, gutters, the page number, the beat. */
function pageSvg(pageNumber: number, beat: string): string {
  const h = hash(`${pageNumber}:${beat}`);
  const lines = wrap(beat, 54, 4)
    .map(
      (l, i) =>
        `<text x="416" y="${1080 + i * 30}" font-family="Georgia,serif" font-size="22" fill="${INK}" text-anchor="middle" opacity="0.75">${escapeXml(l)}</text>`,
    )
    .join("");
  const panels = [
    { x: 36, y: 36, w: 760, h: 330 },
    { x: 36, y: 386, w: 370, h: 280 },
    { x: 426, y: 386, w: 370, h: 280 },
    { x: 36, y: 686, w: 370, h: 300 },
    { x: 426, y: 686, w: 370, h: 300 },
  ];
  const frames = panels
    .map(
      (p) =>
        `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="url(#tone)" stroke="${INK}" stroke-width="7"/>
				 <path d="M${p.x + 20} ${p.y + p.h - 20} L${p.x + p.w - 20} ${p.y + 20}" stroke="${INK}" stroke-width="2" opacity="0.2"/>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE.width}" height="${PAGE.height}" viewBox="0 0 832 1248">
	<defs>
		<pattern id="tone" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
			<circle cx="2" cy="2" r="1" fill="${INK}" opacity="0.14"/>
		</pattern>
		<pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
			<line x1="0" y1="0" x2="0" y2="14" stroke="${INK}" stroke-width="2" opacity="0.07"/>
		</pattern>
	</defs>
	<rect width="832" height="1248" fill="${PAPER}"/>
	<rect x="20" y="20" width="792" height="1208" fill="url(#hatch)"/>
	${frames}
	<rect x="36" y="1006" width="760" height="60" fill="${INK}"/>
	<text x="56" y="1046" font-family="Helvetica,Arial,sans-serif" font-size="23" letter-spacing="5" fill="${PAPER}">KOMA · PLACEHOLDER PAGE</text>
	<text x="600" y="1046" font-family="Helvetica,Arial,sans-serif" font-size="23" letter-spacing="3" fill="${ACCENT}">PAGE ${String(pageNumber).padStart(2, "0")}</text>
	${lines}
	<text x="416" y="1210" font-family="Helvetica,Arial,sans-serif" font-size="17" fill="${INK}" opacity="0.45" text-anchor="middle">Set KOMA_GEMINI_KEY or KOMA_API_KEY to draw this page · ${escapeXml(ART_STYLE.name)}</text>
	<text x="760" y="${70 + (h % 12)}" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="${ACCENT}" opacity="0.6">mock</text>
</svg>`;
}

/** A square catalog mock: a silhouette for a character, blocks for a place. */
function plateSvg(
  label: string,
  kind: "character" | "location",
  description: string,
): string {
  const h = hash(label);
  const lines = wrap(description, 46, 3)
    .map(
      (l, i) =>
        `<text x="512" y="${900 + i * 32}" font-family="Georgia,serif" font-size="24" fill="${INK}" text-anchor="middle" opacity="0.75">${escapeXml(l)}</text>`,
    )
    .join("");
  const figure =
    kind === "location"
      ? `<g stroke="${INK}" stroke-width="6" fill="${PAPER}">
					<path d="M210 560 L210 330 L420 240 L630 330 L630 560" />
					<path d="M160 560 H760" />
					<path d="M300 400 H360 V470 H300 Z"/><path d="M500 400 H560 V470 H500 Z"/>
				</g>`
      : `<g stroke="${INK}" stroke-width="7" fill="${PAPER}">
					<circle cx="512" cy="300" r="78"/>
					<path d="M512 380 q-150 26 -168 250 h336 q-18 -224 -168 -250 z"/>
					<path d="M468 234 q44 -46 88 0 q-44 -18 -88 0" fill="${INK}" stroke="none"/>
				</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PLATE.width}" height="${PLATE.height}" viewBox="0 0 1024 1024">
	<defs>
		<pattern id="tone" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
			<circle cx="2" cy="2" r="1.1" fill="${INK}" opacity="0.16"/>
		</pattern>
		<pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
			<line x1="0" y1="0" x2="0" y2="14" stroke="${INK}" stroke-width="2" opacity="0.1"/>
		</pattern>
	</defs>
	<rect width="1024" height="1024" fill="${PAPER}"/>
	<rect x="24" y="24" width="976" height="976" fill="url(#hatch)"/>
	<rect x="24" y="24" width="976" height="976" fill="none" stroke="${INK}" stroke-width="10"/>
	<rect x="24" y="24" width="976" height="76" fill="${INK}"/>
	<text x="52" y="74" font-family="Helvetica,Arial,sans-serif" font-size="26" letter-spacing="6" fill="${PAPER}">KOMA · PLACEHOLDER</text>
	${figure}
	<text x="512" y="690" font-family="Georgia,serif" font-size="58" font-weight="bold" fill="${INK}" text-anchor="middle">${escapeXml(label.slice(0, 32))}</text>
	<text x="512" y="742" font-family="Helvetica,Arial,sans-serif" font-size="21" letter-spacing="4" fill="${ACCENT}" text-anchor="middle">${kind.toUpperCase()} REFERENCE</text>
	${lines}
	<text x="512" y="968" font-family="Helvetica,Arial,sans-serif" font-size="19" fill="${INK}" opacity="0.45" text-anchor="middle">Set KOMA_GEMINI_KEY or KOMA_API_KEY · ${escapeXml(ART_STYLE.name)} · ${h % 97}</text>
</svg>`;
}

async function fromGemini(
  prompt: string,
  refs: string[],
  file: string,
  shape: Shape,
): Promise<Artwork> {
  const parts: Record<string, unknown>[] = [];
  for (const ref of refs.slice(0, 3)) {
    const bytes = await readFile(ref);
    parts.push({
      inline_data: {
        mime_type: "image/png",
        data: Buffer.from(bytes).toString("base64"),
      },
    });
  }
  parts.push({ text: prompt });

  const call = async (withAspect: boolean): Promise<Response> => {
    const generationConfig: Record<string, unknown> = {
      responseModalities: ["IMAGE"],
    };
    if (withAspect)
      generationConfig.imageConfig = { aspectRatio: shape.aspect };
    return fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig,
        }),
        signal: AbortSignal.timeout(240_000),
      },
    );
  };

  let res = await call(true);
  if (res.status === 400) res = await call(false);
  if (!res.ok)
    throw new Error(
      `gemini ${res.status}: ${(await res.text()).slice(0, 300)}`,
    );
  const payload = (await res.json()) as {
    candidates?: {
      content?: { parts?: { inlineData?: { data?: string } }[] };
    }[];
  };
  const data = payload.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData?.data,
  )?.inlineData?.data;
  if (!data) throw new Error("gemini returned no image");
  await writeFile(join(IMAGE_DIR, file), Buffer.from(data, "base64"));
  return { file, href: `/media/${file}`, provider: GEMINI_MODEL, prompt };
}

async function fromOpenAI(
  prompt: string,
  refs: string[],
  file: string,
  shape: Shape,
): Promise<Artwork> {
  const headers = { authorization: `Bearer ${OPENAI_KEY}` };
  let res: Response;
  if (refs.length > 0) {
    const form = new FormData();
    form.set("model", OPENAI_MODEL);
    form.set("prompt", prompt);
    form.set("size", shape.size);
    form.set("n", "1");
    for (const ref of refs.slice(0, 4)) {
      const bytes = await readFile(ref);
      form.append(
        "image[]",
        new Blob([bytes], { type: "image/png" }),
        basename(ref),
      );
    }
    res = await fetch(`${OPENAI_BASE}/images/edits`, {
      method: "POST",
      headers,
      body: form,
    });
    if (!res.ok) {
      res = await fetch(`${OPENAI_BASE}/images/generations`, {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          prompt,
          size: shape.size,
          n: 1,
        }),
      });
    }
  } else {
    res = await fetch(`${OPENAI_BASE}/images/generations`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        prompt,
        size: shape.size,
        n: 1,
      }),
    });
  }
  if (!res.ok)
    throw new Error(`image ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const payload = (await res.json()) as {
    data?: { b64_json?: string; url?: string }[];
  };
  const item = payload.data?.[0];
  if (item?.b64_json) {
    await writeFile(
      join(IMAGE_DIR, file),
      Buffer.from(item.b64_json, "base64"),
    );
    return { file, href: `/media/${file}`, provider: OPENAI_MODEL, prompt };
  }
  if (item?.url) {
    const bin = await fetch(item.url);
    if (!bin.ok) throw new Error(`image download ${bin.status}`);
    await writeFile(
      join(IMAGE_DIR, file),
      Buffer.from(await bin.arrayBuffer()),
    );
    return { file, href: `/media/${file}`, provider: OPENAI_MODEL, prompt };
  }
  throw new Error("image endpoint returned no data");
}

function usable(refs: string[] | undefined): string[] {
  return (refs ?? []).filter((r) => /\.(png|jpe?g|webp)$/i.test(r));
}

export async function drawPage(
  prompt: string,
  options: { pageNumber: number; beat: string; refs?: string[] },
): Promise<Artwork> {
  if (!hasImages) {
    const file = `${randomUUID()}.svg`;
    await writeFile(
      join(IMAGE_DIR, file),
      pageSvg(options.pageNumber, options.beat),
      "utf8",
    );
    return { file, href: `/media/${file}`, provider: "placeholder", prompt };
  }
  const file = `${randomUUID()}.png`;
  try {
    return GEMINI_KEY
      ? await fromGemini(prompt, usable(options.refs), file, PAGE_SHAPE)
      : await fromOpenAI(prompt, usable(options.refs), file, PAGE_SHAPE);
  } catch (error) {
    const placeholder = `${randomUUID()}.svg`;
    await writeFile(
      join(IMAGE_DIR, placeholder),
      pageSvg(options.pageNumber, options.beat),
      "utf8",
    );
    return {
      file: placeholder,
      href: `/media/${placeholder}`,
      provider: `placeholder (${error instanceof Error ? error.message : "image call failed"})`,
      prompt,
    };
  }
}

export async function drawPlate(
  prompt: string,
  options: {
    label: string;
    kind: "character" | "location";
    description: string;
    refs?: string[];
  },
): Promise<Artwork> {
  const placeholder = async (): Promise<Artwork> => {
    const file = `${randomUUID()}.svg`;
    await writeFile(
      join(IMAGE_DIR, file),
      plateSvg(options.label, options.kind, options.description),
      "utf8",
    );
    return { file, href: `/media/${file}`, provider: "placeholder", prompt };
  };
  if (!hasImages) return placeholder();
  const file = `${randomUUID()}.png`;
  try {
    return GEMINI_KEY
      ? await fromGemini(prompt, usable(options.refs), file, PLATE_SHAPE)
      : await fromOpenAI(prompt, usable(options.refs), file, PLATE_SHAPE);
  } catch (error) {
    const art = await placeholder();
    art.provider = `placeholder (${error instanceof Error ? error.message : "image call failed"})`;
    return art;
  }
}
