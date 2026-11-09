// The image side. With a key it calls an OpenAI-compatible image endpoint and
// passes the catalog plates as references. Without one it draws a deterministic
// placeholder plate, so the pipeline is runnable and visibly not final art.

import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { ART_STYLE, IMAGE } from "../config";
import { IMAGE_DIR } from "./db";

const KEY = process.env.KOMA_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
const BASE = (process.env.KOMA_BASE_URL ?? "https://api.openai.com/v1").replace(
  /\/+$/,
  "",
);
const MODEL = process.env.KOMA_IMAGE_MODEL ?? "gpt-image-1";
export const hasImages = KEY.length > 0;

export interface Artwork {
  /** File name inside the image directory. */
  file: string;
  href: string;
  provider: string;
  prompt: string;
}

const INK = "#141414";
const PAPER = "#efe9dc";
const ACCENT = "#c8402f";

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

function wrap(text: string, width: number, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > width) {
      if (line) lines.push(line.trim());
      line = w;
    } else line = `${line} ${w}`;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.slice(0, max);
}

function placeholderSvg(
  name: string,
  description: string,
  kind: "character" | "location" | "panel",
): string {
  const h = hash(name);
  const tone = h % 3;
  const head = 260 + (h % 60);
  const body = wrap(description, 52, 5);
  const lines = body
    .map(
      (l, i) =>
        `<text x="512" y="${880 + i * 34}" font-family="Georgia,serif" font-size="26" fill="${INK}" text-anchor="middle" opacity="0.78">${escapeXml(l)}</text>`,
    )
    .join("");

  const figure =
    kind === "location"
      ? `<g stroke="${INK}" stroke-width="6" fill="none" opacity="0.9">
					<path d="M210 560 L210 330 L420 240 L630 330 L630 560" fill="${PAPER}" />
					<path d="M160 560 H760" />
					<path d="M820 560 V300 H900 V560" fill="${PAPER}" />
					<path d="M300 400 H360 V470 H300 Z" fill="${PAPER}" />
					<path d="M500 400 H560 V470 H500 Z" fill="${PAPER}" />
				</g>`
      : `<g stroke="${INK}" stroke-width="7" fill="${PAPER}">
					<circle cx="512" cy="${head}" r="78" />
					<path d="M512 ${head + 80} q-150 26 -168 250 h336 q-18 -224 -168 -250 z" />
					<path d="M${468} ${head - 66} q44 -46 88 0 q-44 -18 -88 0" fill="${INK}" stroke="none" />
					${tone === 1 ? `<path d="M430 ${head} h164" />` : ""}
					${tone === 2 ? `<circle cx="486" cy="${head - 6}" r="6" fill="${INK}" stroke="none"/><circle cx="538" cy="${head - 6}" r="6" fill="${INK}" stroke="none"/>` : ""}
				</g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${IMAGE.width}" height="${IMAGE.height}" viewBox="0 0 1024 1024">
	<defs>
		<pattern id="tone" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
			<circle cx="2" cy="2" r="1.1" fill="${INK}" opacity="0.18"/>
		</pattern>
		<pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
			<line x1="0" y1="0" x2="0" y2="14" stroke="${INK}" stroke-width="2" opacity="0.12"/>
		</pattern>
	</defs>
	<rect width="1024" height="1024" fill="${PAPER}"/>
	<rect x="24" y="24" width="976" height="976" fill="url(#hatch)"/>
	<rect x="24" y="24" width="976" height="976" fill="none" stroke="${INK}" stroke-width="10"/>
	<rect x="24" y="24" width="976" height="80" fill="${INK}"/>
	<text x="52" y="78" font-family="Helvetica,Arial,sans-serif" font-size="28" letter-spacing="6" fill="${PAPER}">KOMA · PLACEHOLDER</text>
	<rect x="760" y="44" width="200" height="40" fill="${ACCENT}"/>
	${figure}
	<text x="512" y="${kind === "location" ? 660 : 650}" font-family="Georgia,serif" font-size="64" font-weight="bold" fill="${INK}" text-anchor="middle">${escapeXml(name.slice(0, 34))}</text>
	<text x="512" y="${kind === "location" ? 710 : 700}" font-family="Helvetica,Arial,sans-serif" font-size="22" letter-spacing="4" fill="${ACCENT}" text-anchor="middle">${kind.toUpperCase()} REFERENCE</text>
	${lines}
	<text x="512" y="962" font-family="Helvetica,Arial,sans-serif" font-size="20" fill="${INK}" opacity="0.5" text-anchor="middle">Set KOMA_API_KEY to replace this plate with generated art · ${escapeXml(ART_STYLE.name)}</text>
</svg>`;
}

async function placeholder(
  prompt: string,
  label: string,
  kind: "character" | "location" | "panel",
): Promise<Artwork> {
  const file = `${randomUUID()}.svg`;
  const body =
    prompt.split("Character reference sheet of")[1]?.slice(0, 220) ?? label;
  await writeFile(
    join(IMAGE_DIR, file),
    placeholderSvg(label, body, kind),
    "utf8",
  );
  return { file, href: `/media/${file}`, provider: "placeholder", prompt };
}

async function fromApi(
  prompt: string,
  refs: string[],
  file: string,
  mime: string,
): Promise<Artwork> {
  const headers = { authorization: `Bearer ${KEY}` };
  let res: Response;
  if (refs.length > 0) {
    const form = new FormData();
    form.set("model", MODEL);
    form.set("prompt", prompt);
    form.set("size", `${IMAGE.width}x${IMAGE.height}`);
    form.set("n", "1");
    for (const ref of refs.slice(0, 4)) {
      const bytes = await readFile(ref);
      const type = ref.endsWith(".svg") ? "image/png" : "image/png";
      form.append("image[]", new Blob([bytes], { type }), basename(ref));
      void type;
    }
    res = await fetch(`${BASE}/images/edits`, {
      method: "POST",
      headers,
      body: form,
    });
    if (!res.ok)
      res = await fetch(`${BASE}/images/generations`, {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          prompt,
          size: `${IMAGE.width}x${IMAGE.height}`,
          n: 1,
        }),
      });
  } else {
    res = await fetch(`${BASE}/images/generations`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        size: `${IMAGE.width}x${IMAGE.height}`,
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
    return { file, href: `/media/${file}`, provider: MODEL, prompt };
  }
  if (item?.url) {
    const bin = await fetch(item.url);
    if (!bin.ok) throw new Error(`image download ${bin.status}`);
    await writeFile(
      join(IMAGE_DIR, file),
      Buffer.from(await bin.arrayBuffer()),
    );
    return { file, href: `/media/${file}`, provider: MODEL, prompt };
  }
  throw new Error("image endpoint returned no data");
}

export async function drawArt(
  prompt: string,
  options: {
    label: string;
    kind: "character" | "location" | "panel";
    refs?: string[];
  },
): Promise<Artwork> {
  const file = `${randomUUID()}.${hasImages ? "png" : "svg"}`;
  if (!hasImages) return placeholder(prompt, options.label, options.kind);
  try {
    return await fromApi(prompt, options.refs ?? [], file, "image/png");
  } catch (error) {
    const art = await placeholder(prompt, options.label, options.kind);
    art.provider = `placeholder (${error instanceof Error ? error.message : "image call failed"})`;
    return art;
  }
}
