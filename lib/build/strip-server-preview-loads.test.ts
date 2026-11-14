import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import registry from "@/registry/__index__";
import stripServerPreviewLoads from "./strip-server-preview-loads.cjs";

const source = readFileSync(
  join(import.meta.dir, "../../registry/__index__.tsx"),
  "utf8",
);
const stripped = stripServerPreviewLoads(source);
const entryCount = Object.keys(registry).length;

const count = (text: string, pattern: RegExp) =>
  text.match(pattern)?.length ?? 0;

describe("strip-server-preview-loads", () => {
  it("replaces the load of every registry entry", () => {
    // A new entry written in a shape the loader doesn't match would put its
    // component back into the server graph without failing anywhere else.
    expect(count(stripped, /^\s+load: serverPreviewLoad,$/gm)).toBe(entryCount);
  });

  it("leaves no component import behind a load", () => {
    expect(stripped).not.toMatch(/load: \(\) =>\s+import\(/);
  });

  it("keeps every loadConfig", () => {
    expect(count(stripped, /loadConfig: \(\) =>\s+import\(/g)).toBe(entryCount);
  });

  it("keeps the RegistryEntry type intact", () => {
    expect(stripped).toContain(
      "load: () => Promise<{ default: React.ComponentType<any> }>;",
    );
  });
});
