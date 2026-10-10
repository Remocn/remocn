/**
 * Pure archetype logic for `plan_video`: pick an archetype from a brief and
 * package a recipe markdown file into a structured beats array. The recipe is
 * the authority — this module only reads what the recipe says (its tables) and
 * never invents beats or components the recipe does not name.
 */

export const ARCHETYPES = [
  "product-demo",
  "changelog",
  "feature-announcement",
  "oss-showcase",
  "cli-tool-demo",
  "testimonial-reel",
  "year-in-review",
  "pricing-reveal",
  "logo-bumper",
] as const;

export type Archetype = (typeof ARCHETYPES)[number];

/** Phrase → weight. Multi-word phrases are matched on the normalized brief. */
const KEYWORDS: Record<Archetype, Record<string, number>> = {
  "product-demo": {
    demo: 2,
    "product demo": 4,
    walkthrough: 3,
    explainer: 3,
    saas: 2,
    app: 1,
    product: 1,
    startup: 1,
    onboarding: 2,
    "how it works": 3,
  },
  changelog: {
    changelog: 5,
    "release notes": 5,
    "what's new": 3,
    "whats new": 3,
    release: 2,
    version: 2,
    patch: 2,
    update: 1,
    updates: 1,
    fixed: 1,
  },
  "feature-announcement": {
    feature: 2,
    "new feature": 4,
    announce: 3,
    announcement: 3,
    announcing: 3,
    introducing: 3,
    spotlight: 2,
    "now available": 3,
    "now in beta": 3,
  },
  "oss-showcase": {
    "open source": 4,
    "open-source": 4,
    oss: 4,
    github: 3,
    repo: 3,
    repository: 3,
    stars: 2,
    contributors: 3,
    library: 1,
  },
  "cli-tool-demo": {
    cli: 5,
    terminal: 4,
    "command line": 5,
    "command-line": 5,
    command: 1,
    shell: 2,
    npx: 3,
    "dev tool": 3,
    devtool: 3,
    sdk: 1,
  },
  "testimonial-reel": {
    testimonial: 5,
    testimonials: 5,
    quotes: 3,
    quote: 2,
    reviews: 3,
    review: 1,
    customers: 2,
    "social proof": 5,
    "what people say": 4,
    "what users say": 4,
  },
  "year-in-review": {
    "year in review": 6,
    "year-in-review": 6,
    recap: 4,
    wrapped: 4,
    annual: 3,
    yearly: 3,
    milestones: 2,
    metrics: 2,
    stats: 2,
    numbers: 1,
  },
  "pricing-reveal": {
    pricing: 5,
    price: 3,
    prices: 3,
    plans: 3,
    tiers: 3,
    subscription: 2,
    "free trial": 2,
  },
  "logo-bumper": {
    logo: 3,
    bumper: 5,
    sting: 4,
    ident: 4,
    intro: 2,
    outro: 2,
    wordmark: 4,
    "brand reveal": 4,
    "logo reveal": 6,
  },
};

export interface ArchetypePick {
  archetype: Archetype;
  matched: string[];
  /** True when nothing matched and the flagship default was used. */
  fallback: boolean;
}

function normalizeText(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' -]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

export function pickArchetype(brief: string): ArchetypePick {
  const text = normalizeText(brief);
  let best: ArchetypePick & { score: number } = {
    archetype: "product-demo",
    matched: [],
    fallback: true,
    score: 0,
  };
  for (const archetype of ARCHETYPES) {
    let score = 0;
    const matched: string[] = [];
    for (const [phrase, weight] of Object.entries(KEYWORDS[archetype])) {
      if (text.includes(` ${phrase} `)) {
        score += weight;
        matched.push(phrase);
      }
    }
    // Strict `>` keeps ARCHETYPES order as the deterministic tie-break.
    if (score > best.score) {
      best = { archetype, matched, fallback: false, score };
    }
  }
  return {
    archetype: best.archetype,
    matched: best.matched,
    fallback: best.fallback,
  };
}

export function isArchetype(value: string): value is Archetype {
  return (ARCHETYPES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Recipe parsing
// ---------------------------------------------------------------------------

export interface PlanBeat {
  name: string;
  startFrame?: number;
  endFrame?: number;
  what?: string;
  /** Catalog components the recipe names for this beat, in recipe order. */
  components: string[];
  /** Components the recipe says to build because the catalog lacks them. */
  buildNew: string[];
}

export interface PlanExtra {
  label: string;
  components: string[];
  buildNew: string[];
}

export interface ParsedRecipe {
  meta: Record<string, string>;
  /** Heading of the beats table used (e.g. `Short (~18s / 540f)`), when the recipe has several. */
  variant?: string;
  /** Frames the picked variant runs for, per the recipe. */
  totalFrames?: number;
  beats: PlanBeat[];
  transitions: string[];
  extras: PlanExtra[];
  notes: string[];
}

interface Table {
  heading?: string;
  header: string[];
  rows: string[][];
}

/** Split a markdown table row on `|`, honoring `\|` escapes and code spans. */
export function splitRow(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inCode = false;
  const body = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "\\" && body[i + 1] === "|") {
      current += "|";
      i++;
      continue;
    }
    if (ch === "`") inCode = !inCode;
    if (ch === "|" && !inCode) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function parseTables(markdown: string): Table[] {
  const tables: Table[] = [];
  const lines = markdown.split("\n");
  let heading: string | undefined;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h = /^#{2,4}\s+(.*)$/.exec(line);
    if (h) {
      heading = h[1].trim();
      continue;
    }
    if (!line.trim().startsWith("|")) continue;
    const next = lines[i + 1] ?? "";
    if (!/^\s*\|[\s:|-]+\|\s*$/.test(next)) continue;
    const header = splitRow(line);
    const rows: string[][] = [];
    let j = i + 2;
    while (j < lines.length && lines[j].trim().startsWith("|")) {
      rows.push(splitRow(lines[j]));
      j++;
    }
    tables.push({ heading, header, rows });
    i = j - 1;
  }
  return tables;
}

function stripMd(text: string): string {
  return text.replace(/\*\*/g, "").trim();
}

function beatKey(name: string): string {
  return (
    stripMd(name)
      .toLowerCase()
      .match(/[a-z]+/)?.[0] ?? ""
  );
}

function backticked(text: string): string[] {
  return [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim());
}

function uniq(values: string[]): string[] {
  return [...new Set(values)];
}

function catalogNames(text: string, known: Set<string>): string[] {
  return backticked(text).filter((n) => known.has(n));
}

function buildNewNames(text: string, known: Set<string>): string[] {
  return [...text.matchAll(/\*\*`([a-z0-9-]+)`\*\*/g)]
    .map((m) => m[1])
    .filter((n) => !known.has(n));
}

function parseFrames(cell: string): { start?: number; end?: number } {
  const m = /(\d+)\s*f?\s*[–—-]\s*(\d+)/.exec(cell);
  if (!m) return {};
  return { start: Number(m[1]), end: Number(m[2]) };
}

export function parseMetaLine(markdown: string): Record<string, string> {
  const line = markdown.split("\n").find((l) => l.startsWith("**Family:**"));
  if (!line) return {};
  const meta: Record<string, string> = {};
  for (const part of line.split(" · ")) {
    const m = /^\*\*(.+?):\*\*\s*(.*)$/.exec(part.trim());
    if (m) meta[m[1].toLowerCase().replace(/\s+/g, "")] = m[2].trim();
  }
  return meta;
}

/** First `(\d+)f` in the recipe's default duration, e.g. `~45s (1350f @30fps…)` → 1350. */
export function defaultFrames(
  meta: Record<string, string>,
): number | undefined {
  const m = /(\d+)f\b/.exec(meta.defaultduration ?? "");
  return m ? Number(m[1]) : undefined;
}

/** `Hook 165 · Positioning 120 · Product reveal 150` → ordered name/frames pairs. */
function parseSplit(markdown: string): { name: string; frames: number }[] {
  // Join soft-wrapped prose lines so a split that wraps mid-sentence parses.
  const prose = markdown.replace(/([^\n])\n(?=[^\n])/g, "$1 ");
  const m = /split:\s*([^\n]+?)\.\s*$/m.exec(prose);
  if (!m) return [];
  return m[1]
    .split("·")
    .map((part) => /^\s*([A-Za-z][A-Za-z /-]*?)\s+(\d+)/.exec(part))
    .filter((p): p is RegExpExecArray => p !== null)
    .map((p) => ({ name: p[1].trim(), frames: Number(p[2]) }));
}

function isBeatsTable(t: Table): boolean {
  return (
    t.header.some((h) => /^beat$/i.test(h)) &&
    t.header.some((h) => /^frames/i.test(h))
  );
}

function isSlotsTable(t: Table): boolean {
  return (
    /^beat$/i.test(t.header[0] ?? "") &&
    t.header.some((h) => /component|slot/i.test(h))
  );
}

function isVariantTable(t: Table): boolean {
  return /^variant$/i.test(t.header[0] ?? "");
}

function variantFrames(cell: string): number | undefined {
  const m = /(\d[\d,]*)/.exec(cell);
  return m ? Number(m[1].replace(/,/g, "")) : undefined;
}

export function parseRecipe(
  markdown: string,
  knownComponents: Iterable<string>,
  durationSeconds?: number,
): ParsedRecipe {
  const known = new Set(knownComponents);
  const meta = parseMetaLine(markdown);
  const tables = parseTables(markdown);
  const notes: string[] = [];
  const targetFrames =
    durationSeconds !== undefined
      ? Math.round(durationSeconds * 30)
      : defaultFrames(meta);

  // Slot rows: what the recipe says goes into each beat.
  const slots = tables.find(isSlotsTable);
  const slotRows = (slots?.rows ?? []).map((row) => {
    const label = stripMd(row[0] ?? "");
    const catalogCol = slots?.header.findIndex((h) =>
      /catalog|slot candidates/i.test(h),
    );
    const newCol = slots?.header.findIndex((h) => /new component/i.test(h));
    const catalogText =
      catalogCol !== undefined && catalogCol >= 0
        ? (row[catalogCol] ?? "")
        : row.slice(1).join(" ");
    const newText =
      newCol !== undefined && newCol >= 0 ? (row[newCol] ?? "") : "";
    return {
      label,
      key: beatKey(label),
      components: catalogNames(catalogText, known),
      buildNew: uniq([
        ...buildNewNames(newText, known),
        ...buildNewNames(catalogText, known),
      ]),
      used: false,
    };
  });

  const transitionsRow = slotRows.find((r) => r.key === "transitions");
  const transitions = transitionsRow?.components ?? [];
  if (transitionsRow) transitionsRow.used = true;

  let beats: PlanBeat[] = [];
  let variant: string | undefined;
  let totalFrames: number | undefined;

  const beatTables = tables.filter(isBeatsTable);
  if (beatTables.length > 0) {
    // Several beats tables = duration variants (e.g. Short / Standard). Pick
    // the one whose length is closest to the requested (or default) duration.
    const withTotals = beatTables.map((t) => {
      const frameCol = t.header.findIndex((h) => /^frames/i.test(h));
      const ends = t.rows.map((r) => parseFrames(r[frameCol] ?? "").end ?? 0);
      return { table: t, total: Math.max(0, ...ends) };
    });
    const chosen =
      targetFrames === undefined
        ? withTotals[withTotals.length - 1]
        : withTotals.reduce((a, b) =>
            Math.abs(b.total - targetFrames) < Math.abs(a.total - targetFrames)
              ? b
              : a,
          );
    if (beatTables.length > 1) variant = chosen.table.heading;
    totalFrames = chosen.total || undefined;

    const { header, rows } = chosen.table;
    const frameCol = header.findIndex((h) => /^frames/i.test(h));
    const beatCol = header.findIndex((h) => /^beat$/i.test(h));
    const whatCol = header.findIndex((h) => /what happens/i.test(h));
    beats = rows.map((row) => {
      const name = stripMd(row[beatCol] ?? "");
      const frames = parseFrames(row[frameCol] ?? "");
      const what = whatCol >= 0 ? row[whatCol] : undefined;
      const key = beatKey(name);
      const matches = slotRows.filter((s) => s.key === key);
      for (const m of matches) m.used = true;
      return {
        name,
        startFrame: frames.start,
        endFrame: frames.end,
        what,
        components: uniq([
          ...matches.flatMap((m) => m.components),
          ...catalogNames(what ?? "", known),
        ]),
        buildNew: uniq(matches.flatMap((m) => m.buildNew)),
      };
    });
  } else if (slotRows.length > 0) {
    // No frames table (product-demo): the slots table is the beat list and
    // the prose "split:" line carries the frame budget.
    const split = parseSplit(markdown);
    let cursor = 0;
    beats = slotRows
      .filter((r) => !r.used)
      .map((r) => {
        r.used = true;
        const budget = split.find((s) => beatKey(s.name) === r.key);
        const beat: PlanBeat = {
          name: r.label,
          components: r.components,
          buildNew: r.buildNew,
        };
        if (budget) {
          beat.startFrame = cursor;
          beat.endFrame = cursor + budget.frames;
          cursor += budget.frames;
        }
        return beat;
      });
    if (cursor > 0) totalFrames = cursor;

    const variants = tables.find(isVariantTable);
    if (variants && durationSeconds !== undefined && targetFrames) {
      const framesCol = variants.header.findIndex((h) => /^frames/i.test(h));
      const beatsCol = variants.header.findIndex((h) => /^beats$/i.test(h));
      const options = variants.rows
        .map((row) => ({
          label: stripMd(row[0] ?? ""),
          frames: variantFrames(row[framesCol] ?? ""),
          beats: row[beatsCol] ?? "",
        }))
        .filter((v): v is typeof v & { frames: number } => !!v.frames);
      if (options.length > 0) {
        const best = options.reduce((a, b) =>
          Math.abs(b.frames - targetFrames) < Math.abs(a.frames - targetFrames)
            ? b
            : a,
        );
        variant = best.label;
        if (!/^all\b/i.test(best.beats.trim())) {
          const order = best.beats
            .split(/→|\/|,/)
            .map((part) => beatKey(part))
            .filter(Boolean);
          const subset = beats
            .filter((b) => order.includes(beatKey(b.name)))
            .sort(
              (a, b) =>
                order.indexOf(beatKey(a.name)) - order.indexOf(beatKey(b.name)),
            );
          if (subset.length > 0 && subset.length < beats.length) {
            beats = rescale(subset, best.frames);
            totalFrames = best.frames;
            notes.push(
              `Beat frames were scaled from the recipe's standard split to the ${best.label} variant (${best.frames}f). Treat them as a starting budget.`,
            );
          }
        }
      }
    }
  }

  const extras = slotRows
    .filter((r) => !r.used)
    .map(({ label, components, buildNew }) => ({
      label,
      components,
      buildNew,
    }));

  if (
    durationSeconds !== undefined &&
    totalFrames !== undefined &&
    Math.abs(totalFrames - durationSeconds * 30) > 30
  ) {
    notes.push(
      `The recipe's beats run ${totalFrames}f (~${Math.round(totalFrames / 30)}s) vs the requested ${durationSeconds}s. Adjust hold time, not component lengths, and check the recipe's duration guidance.`,
    );
  }

  return { meta, variant, totalFrames, beats, transitions, extras, notes };
}

function rescale(beats: PlanBeat[], total: number): PlanBeat[] {
  const sum = beats.reduce(
    (acc, b) => acc + ((b.endFrame ?? 0) - (b.startFrame ?? 0)),
    0,
  );
  if (sum <= 0) return beats;
  let cursor = 0;
  return beats.map((b, i) => {
    const length = (b.endFrame ?? 0) - (b.startFrame ?? 0);
    const scaled =
      i === beats.length - 1
        ? total - cursor
        : Math.round((length / sum) * total);
    const out = { ...b, startFrame: cursor, endFrame: cursor + scaled };
    cursor += scaled;
    return out;
  });
}

/** `## 3. Good vs slop` section of anatomy.md — the quality bar every recipe points at. */
export function extractQualityBar(anatomy: string): string | undefined {
  const start = anatomy.search(/^## 3\./m);
  if (start < 0) return undefined;
  const rest = anatomy.slice(start);
  const next = rest.slice(1).search(/^## /m);
  return (next < 0 ? rest : rest.slice(0, next + 1)).trim();
}
