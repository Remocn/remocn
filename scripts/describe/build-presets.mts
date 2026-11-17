/**
 * Writes each component's presets to registry/presets/<name>.json with the
 * Message Batches API (half the price of single requests).
 *
 *   bun run presets:build -- --submit [--names a,b] [--missing] [--limit 20]
 *   bun run presets:build -- --collect [--wait]
 *   bun run presets:build -- --dry-run --names abacus-count
 *   bun run presets:build -- --try abacus-count
 *
 * `--submit` sends one request per component and remembers the batch in
 * .presets-batch.json (git-ignored); `--collect` reads its results once the
 * batch has ended, and `--wait` polls until then. Needs ANTHROPIC_API_KEY.
 * Every preset is checked against the component's controls before it's
 * written, so a preset can't set a prop or value the customizer wouldn't.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import Anthropic from "@anthropic-ai/sdk";
import {
  getDefaults,
  type ResolvedComponentConfig,
} from "@/lib/customizer-config";
import {
  answerSchema,
  CHANGE_SCHEMA,
  changesToPatch,
} from "@/lib/describe/model-schema";
import { sanitizePatch } from "@/lib/describe/patch";
import { PRESETS_DIR, type PresetFile } from "@/lib/describe/presets";
import type { Preset } from "@/lib/describe/types";
import registry, { loadComponentConfig } from "@/registry/__index__";
import remocnRegistry from "@/registry/remocn/registry.json";
import templatesRegistry from "@/registry/remocn-templates/registry.json";
import remocnUiRegistry from "@/registry/remocn-ui/registry.json";

const MODEL = "claude-opus-5-5";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const outDir = path.join(root, PRESETS_DIR);
const stateFile = path.join(root, ".presets-batch.json");

const { values: args } = parseArgs({
  options: {
    submit: { type: "boolean" },
    collect: { type: "boolean" },
    wait: { type: "boolean" },
    "dry-run": { type: "boolean" },
    names: { type: "string" },
    missing: { type: "boolean" },
    limit: { type: "string" },
    try: { type: "string" },
  },
  allowPositionals: true,
});

type Facts = {
  title: string;
  description: string;
  vibe?: string;
  useWhen: string[];
};

function registryFacts(): Map<string, Facts> {
  const facts = new Map<string, Facts>();
  for (const items of [
    remocnRegistry.items,
    remocnUiRegistry.items,
    templatesRegistry.items,
  ]) {
    for (const item of items as {
      name: string;
      title?: string;
      description?: string;
    }[]) {
      facts.set(item.name, {
        title: item.title ?? item.name,
        description: item.description ?? "",
        useWhen: [],
      });
    }
  }
  // The docs frontmatter says what a component is for (CLAUDE.md, "Документация").
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? walk(path.join(dir, entry.name))
        : entry.name.endsWith(".mdx")
          ? [path.join(dir, entry.name)]
          : [],
    );
  for (const file of walk(path.join(root, "content/docs"))) {
    const head = /^---\n([\s\S]*?)\n---/.exec(readFileSync(file, "utf8"))?.[1];
    const name = head && /^component:\s*(\S+)/m.exec(head)?.[1];
    const fact = name && facts.get(name);
    if (!head || !fact) continue;
    fact.vibe = /^vibe:\s*(.+)$/m.exec(head)?.[1]?.trim();
    const list = /^useWhen:\n((?:\s+-.*\n?)+)/m.exec(head)?.[1] ?? "";
    fact.useWhen = [...list.matchAll(/-\s*"?(.+?)"?\s*$/gm)].map((m) => m[1]);
  }
  return facts;
}

const SYSTEM = `You are a senior motion designer writing presets for a library of Remotion video components. A preset is a named set of prop values that gives the component a distinct, tasteful look a person would pick from a row of chips.

Rules:
- Write 4 to 6 presets that differ clearly from the defaults and from each other: different pace, palette, scale or type, not small nudges.
- Presets are about look and motion. Don't change what the component says or shows as content (counts, values, copy, list items); leave those props out.
- Each preset changes 1 to 6 props. Leave everything else at its default by not listing it.
- Stay inside each prop's range. Colours are hex. Prefer restrained, contemporary palettes; avoid neon-on-neon and clashing hues.
- Keep text readable: when you change a background, set the text colour to contrast with it.
- label: 1 to 3 words, Title Case, no emoji. description: one plain sentence on the look.
- askedAs: 5 short phrasings someone might type to get this look without knowing its name, 3 in English and 2 in Russian.
- id: kebab-case, unique within the component.
- changes: one { prop, value } per prop the preset sets, using the exact prop names listed. Every preset must set at least one prop.`;

function requestFor(
  name: string,
  config: ResolvedComponentConfig,
  fact: Facts | undefined,
) {
  if (!answerSchema(config.controls)) return null;
  const defaults = getDefaults(config.controls);
  const props = Object.entries(config.controls)
    .filter(([, control]) => control.type !== "text" && control.type !== "list")
    .map(([key, control]) => {
      const range =
        control.type === "number"
          ? ` (${control.min}–${control.max}, step ${control.step})`
          : control.type === "select" || control.type === "font"
            ? ` (one of: ${control.options.join(", ")})`
            : "";
      return `- ${key} — ${control.label}, ${control.type}${range}, default ${JSON.stringify(defaults[key])}`;
    })
    .join("\n");
  const about = [
    `Component: ${fact?.title ?? name} (${name})`,
    fact?.description ? `What it is: ${fact.description}` : "",
    fact?.vibe ? `Vibe: ${fact.vibe}` : "",
    fact?.useWhen.length ? `Used for: ${fact.useWhen.join("; ")}` : "",
    `Props you may set:\n${props}`,
  ]
    .filter(Boolean)
    .join("\n");
  return {
    custom_id: name,
    params: {
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      messages: [{ role: "user" as const, content: about }],
      output_config: {
        format: {
          type: "json_schema" as const,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["presets"],
            properties: {
              presets: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "id",
                    "label",
                    "description",
                    "askedAs",
                    "changes",
                  ],
                  properties: {
                    id: { type: "string" },
                    label: { type: "string" },
                    description: { type: "string" },
                    askedAs: { type: "array", items: { type: "string" } },
                    changes: { type: "array", items: CHANGE_SCHEMA },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

async function pickNames(): Promise<string[]> {
  let names = args.names
    ? args.names.split(",").map((n) => n.trim())
    : Object.keys(registry);
  for (const name of names) {
    if (!registry[name]) throw new Error(`Unknown component: ${name}`);
  }
  if (args.missing) {
    names = names.filter(
      (name) => !existsSync(path.join(outDir, `${name}.json`)),
    );
  }
  if (args.limit) names = names.slice(0, Number(args.limit));
  return names;
}

async function submit() {
  const facts = registryFacts();
  const requests = [];
  for (const name of await pickNames()) {
    const config = await loadComponentConfig(name);
    const request = requestFor(name, config, facts.get(name));
    if (request) requests.push(request);
  }
  if (requests.length === 0) {
    console.log("Nothing to generate.");
    return;
  }
  if (args["dry-run"]) {
    console.log(JSON.stringify(requests[0], null, 2));
    console.log(
      `\n${requests.length} request(s) would be sent to ${MODEL} (batch, 50% off).`,
    );
    return;
  }
  const client = new Anthropic();
  const batch = await client.messages.batches.create({ requests });
  writeFileSync(
    stateFile,
    JSON.stringify({ id: batch.id, createdAt: batch.created_at }, null, 2),
  );
  console.log(`Submitted ${requests.length} request(s) as batch ${batch.id}.`);
  console.log(
    "Run `bun run presets:build -- --collect --wait` to write the results.",
  );
}

async function collect() {
  if (!existsSync(stateFile))
    throw new Error("No batch submitted yet (.presets-batch.json is missing).");
  const { id } = JSON.parse(readFileSync(stateFile, "utf8")) as { id: string };
  const client = new Anthropic();
  let batch = await client.messages.batches.retrieve(id);
  while (batch.processing_status !== "ended") {
    if (!args.wait) {
      console.log(
        `Batch ${id} is ${batch.processing_status} (${batch.request_counts.processing} processing). Try again later or pass --wait.`,
      );
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 30_000));
    batch = await client.messages.batches.retrieve(id);
  }

  await mkdir(outDir, { recursive: true });
  let written = 0;
  let input = 0;
  let output = 0;
  for await (const item of await client.messages.batches.results(id)) {
    const name = item.custom_id;
    if (item.result.type !== "succeeded") {
      console.warn(`✗ ${name}: ${item.result.type}`);
      continue;
    }
    const message = item.result.message;
    input += message.usage.input_tokens;
    output += message.usage.output_tokens;
    if (message.stop_reason !== "end_turn") {
      console.warn(`✗ ${name}: stopped with ${message.stop_reason}`);
      continue;
    }
    const text = message.content.find((block) => block.type === "text");
    let raw: { presets?: unknown };
    try {
      raw = JSON.parse(text?.type === "text" ? text.text : "");
    } catch {
      console.warn(`✗ ${name}: unreadable answer`);
      continue;
    }
    const config = await loadComponentConfig(name);
    const presets = (Array.isArray(raw.presets) ? raw.presets : []).flatMap(
      (entry): Preset[] => {
        const {
          id: presetId,
          label,
          description,
          askedAs,
          changes,
        } = entry as Record<string, unknown>;
        const props = sanitizePatch(config.controls, changesToPatch(changes));
        if (
          typeof presetId !== "string" ||
          typeof label !== "string" ||
          Object.keys(props).length === 0
        )
          return [];
        return [
          {
            id: presetId,
            label,
            description: typeof description === "string" ? description : label,
            askedAs: Array.isArray(askedAs)
              ? askedAs.filter((a): a is string => typeof a === "string")
              : [],
            props,
          },
        ];
      },
    );
    if (presets.length === 0) {
      console.warn(`✗ ${name}: no usable presets`);
      continue;
    }
    const file: PresetFile = {
      component: name,
      model: MODEL,
      generatedAt: new Date().toISOString().slice(0, 10),
      presets,
    };
    writeFileSync(
      path.join(outDir, `${name}.json`),
      `${JSON.stringify(file, null, 2)}\n`,
    );
    written++;
  }
  // Batch prices: half of Opus 5.5's $4 / $20 per million tokens.
  const cost = (input * 2 + output * 10) / 1_000_000;
  console.log(
    `Wrote ${written} preset file(s) to ${PRESETS_DIR}. Tokens: ${input} in, ${output} out (≈ $${cost.toFixed(2)}).`,
  );
}

/** One component, answered right away instead of in a batch: a quick check of the prompt. */
async function tryOne(name: string) {
  const config = await loadComponentConfig(name);
  const request = requestFor(name, config, registryFacts().get(name));
  if (!request) throw new Error(`${name} has no props a preset could set.`);
  const message = await new Anthropic().messages.create(request.params);
  const text = message.content.find((block) => block.type === "text");
  console.log(
    text?.type === "text"
      ? JSON.stringify(JSON.parse(text.text), null, 2)
      : message,
  );
  console.log(
    `stop: ${message.stop_reason}, tokens: ${message.usage.input_tokens} in, ${message.usage.output_tokens} out`,
  );
}

if (args.try) await tryOne(args.try);
else if (args.collect) await collect();
else if (args.submit || args["dry-run"]) await submit();
else
  console.log(
    "Pass --submit, --collect or --dry-run. See the header of this file.",
  );
