// The offline analyser. It reads a story with no model at all: names are the
// capitalised words that keep coming back, and a sentence that mentions a name
// and a change ("cut her hair") is a variant. It is deterministic, so the same
// story always yields the same catalog, and it is what runs when no model key
// is set. A real model replaces it, not the other way round.

import { STORY } from "../config";
import type {
  Analysis,
  CatalogDraft,
  ChapterDraft,
  VariantDraft,
} from "../types";

const STOP = new Set(
  `The A An And But Or So Then When While After Before Because If He She They It I We You His Her Their Its My Our Your
	There Here That This These Those What Who Why How Not No Yes Chapter Part Episode Book One Two Three Four Five Six
	Seven Eight Nine Ten Later Meanwhile Suddenly Finally Soon Once Now Still Even Just Only Very Well Oh Ah Eh Mr Mrs
	Miss Dr Sir God Lord Come Go Look Wait What Where Why Who Then Than Them With From Into Over Under Through About
	Again Never Always Back Down Up Out Off Away Home Yes Right Left North South East West Monday Tuesday Wednesday
	Thursday Friday Saturday Sunday January February March April May June July August September October November December`
    .split(/\s+/)
    .filter(Boolean),
);

const PLACE_NOUNS = `Station|House|Hall|Room|Street|Market|Forest|Castle|Tower|Temple|Cafe|Café|Shop|School|Bridge|River|Garden|Library|Kitchen|Office|Alley|City|Village|Gate|Chamber|Cave|Beach|Park|Court|Yard|Inn|Tavern|Ship|Train|Bus|Roof|Basement|Attic|Garage|Church|Shrine|Palace|Mansion|Apartment|Lab|Laboratory|Hospital|Airport|Harbour|Harbor|Cliff|Hill|Mountain|Island|Desert|Swamp|Tunnel|Museum|Theatre|Theater|Stadium|Gym|Bar|Club|Cabin|Farm|Field|Orchard|Mine|Factory|Warehouse|Dock|Docks|Pier|Quay|Plaza|Square|Boulevard|Lane|Road|Highway|Path|Trail|Woods|Valley|Lake|Pond|Waterfall|Shore|Coast|Yard|Kitchen|Workshop|Studio|Greenhouse|Bakery|Butchery|Phoarmacy|Pharmacy|Clinic|Diner|Restaurant|Hotel|Motel|Hostel|Depot|Platform|Terminus|Cemetery|Graveyard|Ruins|Outpost|Camp|Fort|Barracks|Armoury|Vault|Cellar|Corridor|Stairwell|Balcony|Terrace|Rooftop|Harbourside|Riverside|Seafront|Highstreet|Crossroads|Cape|Point|Bay|Cove|Head|Headland|Reef|Moor|Heath|Lighthouse|Boathouse|Pumphouse|Chapel|Kiln|Quarry|Dunes`;

const APPEARANCE: { label: string; re: RegExp }[] = [
  {
    label: "Hair cut",
    re: /\b(hair|braid|ponytail|curls?|bun|shaved|bangs|fringe|dyed)\b/i,
  },
  {
    label: "New clothes",
    re: /\b(wore|wearing|dressed|coat|jacket|dress|uniform|shirt|boots|scarf|hat|gloves|armour|armor|cloak|apron)\b/i,
  },
  {
    label: "Injured",
    re: /\b(scar|wound|wounded|bruise|burn|bandage|sling|limp|crippled|blood|stitches)\b/i,
  },
  {
    label: "Changed build",
    re: /\b(taller|shorter|thinner|heavier|broad|slim|gaunt|older|younger|grown)\b/i,
  },
];

const LOCATION_CHANGE: { label: string; re: RegExp }[] = [
  {
    label: "After the fire",
    re: /\b(burnt|burned|burning|fire|ashes|ash|charred|smoke)\b/i,
  },
  {
    label: "In ruin",
    re: /\b(ruin|ruined|collapsed|crumbled|bombed|wrecked|destroyed|derelict)\b/i,
  },
  {
    label: "Rebuilt",
    re: /\b(rebuilt|renovat|restored|refurbish|new paint|scaffold)\b/i,
  },
  {
    label: "Flooded",
    re: /\b(flood|flooded|waterlogged|swamped|submerged)\b/i,
  },
  { label: "Abandoned", re: /\b(abandoned|empty|deserted|vacant|sealed)\b/i },
];

const SPEAKER_VERB =
  /([A-Z][a-zà-ÿ]{2,})\s+(?:said|asked|replied|shouted|whispered|cried|answered|murmured|snapped|laughed|called|began|added)/g;

export function sentences(text: string): string[] {
  const body = text
    .split(/\r?\n/)
    .filter((line) => !/^\s*(chapter|part|episode|book)\b/i.test(line))
    .join("\n");
  return body
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?…]["”']?)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

/** Splits on explicit chapter headings, else on word count. */
export function splitChapters(story: string): ChapterDraft[] {
  const lines = story.split(/\r?\n/);
  const headings: { at: number; title: string }[] = [];
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t.length < 90 && /^(chapter|part|episode|book)\b/i.test(t))
      headings.push({ at: i, title: t });
  });

  if (headings.length > 0) {
    return headings.map((h, i) => {
      const end = headings[i + 1]?.at ?? lines.length;
      const body = lines
        .slice(h.at + 1, end)
        .join("\n")
        .trim();
      return { title: h.title, text: body || lines[h.at]?.trim() || h.title };
    });
  }

  const words = story.trim().split(/\s+/);
  if (words.length <= STORY.chapterTargetWords)
    return [{ title: "Chapter 1", text: story.trim() }];
  const count = Math.ceil(words.length / STORY.chapterTargetWords);
  const size = Math.ceil(words.length / count);
  const out: ChapterDraft[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      title: `Chapter ${i + 1}`,
      text: words.slice(i * size, (i + 1) * size).join(" "),
    });
  }
  return out.filter((c) => c.text.trim().length > 0);
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w.length > 2 ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function pickSentence(
  list: string[],
  name: string,
  cue?: RegExp,
): string | undefined {
  const re = new RegExp(
    `\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    "i",
  );
  const mentioning = list.filter((s) => re.test(s));
  const pool = cue ? mentioning.filter((s) => cue.test(s)) : [];
  const chosen = pool[0] ?? mentioning[0];
  return chosen;
}

function trim(s: string, n: number): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length <= n ? clean : `${clean.slice(0, n - 1).trimEnd()}…`;
}

function variantsFor(
  list: string[],
  name: string,
  rules: { label: string; re: RegExp }[],
  limit: number,
  others: string[] = [],
): VariantDraft[] {
  // "Mira Vale" is also written "Mira"; either form marks the character.
  const forms = [name, name.split(" ")[0]!].filter(
    (v, i, a) => a.indexOf(v) === i,
  );
  const self = forms.map(
    (f) => new RegExp(`\\b${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"),
  );
  const isSelf = (s: string) => self.some((r) => r.test(s));
  const rival = others
    .filter((o) => o !== name)
    .flatMap((o) => [o, o.split(" ")[0]!])
    .filter((v, i, a) => a.indexOf(v) === i && !forms.includes(v))
    .map(
      (o) =>
        new RegExp(`\\b${o.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"),
    );
  // A change often follows the name as a pronoun sentence: "Mira said… She
  // had cut her hair short." A sentence that names someone else is not this
  // character's change, however close it sits.
  const candidates: number[] = [];
  list.forEach((s, i) => {
    if (isSelf(s)) candidates.push(i);
    else if (
      i > 0 &&
      isSelf(list[i - 1]!) &&
      /\b(he|she|they|his|her|their|him)\b/i.test(s)
    ) {
      candidates.push(i);
    }
  });
  const clean = candidates.filter((i) => !rival.some((r) => r.test(list[i]!)));
  const out: VariantDraft[] = [];
  for (const rule of rules) {
    if (out.length >= limit) break;
    const at = clean.find((i) => rule.re.test(list[i]!));
    if (at === undefined) continue;
    const found = list[at]!;
    out.push({
      name: rule.label,
      description: trim(found, 260),
      visual: trim(found, 200),
    });
  }
  return out;
}

function characterCandidates(all: string[]): Map<string, number> {
  const score = new Map<string, number>();
  for (const s of all) {
    const seen = new Set<string>();
    for (const m of s.matchAll(
      /\b([A-Z][a-zà-ÿ']{2,}(?:\s+[A-Z][a-zà-ÿ']{2,})?)\b/g,
    )) {
      const name = m[1]!;
      if (STOP.has(name.split(" ")[0]!)) continue;
      if (seen.has(name)) continue;
      seen.add(name);
      score.set(name, (score.get(name) ?? 0) + 1);
    }
  }
  for (const s of all) {
    for (const m of s.matchAll(SPEAKER_VERB)) {
      const name = m[1]!;
      if (STOP.has(name)) continue;
      score.set(name, (score.get(name) ?? 0) + 2);
    }
  }
  return score;
}

/** "Mira" and "Mira Vale" are one person: prefer the full name the story gives. */
function mergeNames(ranked: string[]): string[] {
  const set = new Set(ranked);
  const out = new Set<string>();
  for (const name of ranked) {
    const parts = name.split(" ");
    if (parts.length === 1) {
      const full = ranked.find(
        (o) => o.split(" ").length === 2 && o.startsWith(`${name} `),
      );
      out.add(full ?? name);
    } else if (!(
      set.has(parts[0]!) && ranked.indexOf(parts[0]!) < ranked.indexOf(name)
    )) {
      out.add(name);
    }
  }
  return [...out];
}

export function analyseStory(story: string): Analysis {
  const all = sentences(story);
  const score = characterCandidates(all);
  const ranked = [...score.entries()]
    .filter(([name, n]) => n >= 3 && name.length >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name]) => name);
  const names = [
    ...new Set(
      mergeNames(ranked).map((name) => {
        if (name.includes(" ")) return name;
        const m = story.match(
          new RegExp(`\\b${name}\\s+([A-Z][a-zà-ÿ']{2,})\\b`),
        );
        const second = m?.[1];
        if (!second || STOP.has(second)) return name;
        if (new RegExp(`^(?:${PLACE_NOUNS})$`, "i").test(second)) return name;
        return `${name} ${second}`;
      }),
    ),
  ];

  const characters: CatalogDraft[] = names.map((name) => {
    const first = pickSentence(all, name);
    const looks = pickSentence(
      all,
      name,
      /hair|eyes|wore|wearing|tall|short|scar|coat|dress|uniform|beard/i,
    );
    const description = trim(
      [first, looks && looks !== first ? looks : ""].filter(Boolean).join(" "),
      460,
    );
    return {
      name: titleCase(name),
      description: description || `${name}, a character in the story.`,
      visual: trim(looks ?? description, 220),
      variants: variantsFor(all, name, APPEARANCE, 3, names),
    };
  });

  const placeRe = new RegExp(
    `\\b(?:the\\s+)?((?:[A-Z][\\w']+\\s+){0,3}(?:${PLACE_NOUNS}))\\b`,
    "g",
  );
  const places = new Map<string, number>();
  for (const s of all) {
    for (const m of s.matchAll(placeRe)) {
      let raw = m[1]!.replace(/\s+/g, " ").trim();
      if (!raw || raw.length < 3) continue;
      // "Cape" alone is not the place; the name runs on: "Cape Wren".
      if (
        /^(?:Cape|Point|Bay|Cove|Head|Headland|Reef|Lake|Mount|Port)$/i.test(
          raw,
        )
      ) {
        const tail = s
          .slice((m.index ?? 0) + m[0].length)
          .match(/^\s+([A-Z][a-zà-ÿ']{2,})/);
        if (tail) raw = `${raw} ${tail[1]}`;
      }
      const key = raw.replace(/^the\s+/i, "");
      const proper = /[A-Z]/.test(key.slice(1));
      places.set(key, (places.get(key) ?? 0) + (proper ? 2 : 1));
    }
  }
  const locations: CatalogDraft[] = [...places.entries()]
    .filter(([name, n]) => n >= 2 && name.length >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => {
      const first = pickSentence(all, name);
      const plate = pickSentence(
        all,
        name,
        /wall|door|window|floor|roof|street|light|smell|stood|room/i,
      );
      const description = trim(
        [first, plate && plate !== first ? plate : ""]
          .filter(Boolean)
          .join(" "),
        460,
      );
      return {
        name: titleCase(name),
        description: description || `${name}, a place in the story.`,
        visual: trim(plate ?? description, 220),
        variants: variantsFor(all, name, LOCATION_CHANGE, 3),
      };
    });

  const chapters = splitChapters(story).map((c) => ({
    title: c.title,
    text: c.text.slice(0, 400_000),
  }));

  return { characters, locations, chapters };
}

/** Used only to report what the offline pass will keep. */
export function offlineNote(story: string): string {
  const kept = sentences(story).filter((s) => s.length >= 40).length;
  return `${kept} usable beats found`;
}
