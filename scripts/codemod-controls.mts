import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Glob } from "bun";

type OldControl = {
  type: string;
  default: unknown;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
};

function convertField(control: OldControl): Record<string, unknown> {
  const description = control.label ?? "";
  switch (control.type) {
    case "text":
      return { type: "text-content", default: control.default, description };
    case "number":
      return {
        type: "number",
        min: control.min,
        max: control.max,
        step: control.step,
        default: control.default,
        description,
        hiddenFromList: false,
      };
    case "number-input":
      return {
        type: "number",
        min: control.min,
        step: control.step,
        default: control.default,
        description,
        hiddenFromList: false,
      };
    case "color":
      return { type: "color", default: control.default, description };
    case "boolean":
      return { type: "boolean", default: control.default, description };
    case "select": {
      const variants: Record<string, Record<string, never>> = {};
      for (const option of control.options ?? []) variants[option] = {};
      return {
        type: "enum",
        default: control.default,
        variants,
        description,
      };
    }
    default:
      throw new Error(`Unknown control type: ${control.type}`);
  }
}

const IDENT = /^[A-Za-z_$][\w$]*$/;

function serialize(value: unknown, indent: string): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => serialize(v, indent)).join(", ")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return "{}";
  const inner = indent + "  ";
  const lines = entries.map(([k, v]) => {
    const key = IDENT.test(k) ? k : JSON.stringify(k);
    return `${inner}${key}: ${serialize(v, inner)},`;
  });
  return `{\n${lines.join("\n")}\n${indent}}`;
}

function findControlsBlock(source: string): { start: number; end: number } {
  const matches = [...source.matchAll(/controls:\s*\{/g)];
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one "controls: {" (found ${matches.length})`,
    );
  }
  const match = matches[0];
  const braceStart = match.index + match[0].length - 1;
  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return { start: match.index, end: i + 1 };
    } else if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i++;
      while (i < source.length && source[i] !== quote) {
        if (source[i] === "\\") i++;
        i++;
      }
    }
  }
  throw new Error("Unbalanced braces in controls block");
}

const failures: string[] = [];
let changed = 0;

for (const file of new Glob("registry/*/*/config.ts").scanSync(".")) {
  try {
    const mod = await import(resolve(file));
    const config = Object.values(mod).find(
      (v) => v && typeof v === "object" && "controls" in (v as object),
    ) as { controls: Record<string, OldControl> } | undefined;
    if (!config) throw new Error("No exported config with controls");

    const schema: Record<string, unknown> = {};
    for (const [key, control] of Object.entries(config.controls)) {
      if (typeof control.type !== "string") {
        throw new Error(`Control "${key}" already migrated or malformed`);
      }
      schema[key] = convertField(control);
    }

    const source = readFileSync(file, "utf8");
    const { start, end } = findControlsBlock(source);
    const lineStart = source.lastIndexOf("\n", start) + 1;
    const indent = source.slice(lineStart, start);
    const replacement = `controls: ${serialize(schema, indent)}`;
    writeFileSync(
      file,
      source.slice(0, start) + replacement + source.slice(end),
    );
    changed++;
  } catch (error) {
    failures.push(`${file}: ${(error as Error).message}`);
  }
}

console.log(`Migrated ${changed} config files`);
if (failures.length > 0) {
  console.log(`Failed ${failures.length}:`);
  for (const f of failures) console.log("  -", f);
  process.exit(1);
}
