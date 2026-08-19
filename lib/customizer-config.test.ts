import { describe, expect, it } from "bun:test";
import { resolve } from "node:path";
import { Glob } from "bun";
import type { ComponentConfig } from "./customizer-config";
import { schemaFieldToControl } from "./customizer-config";

const configFiles = [...new Glob("registry/*/*/config.ts").scanSync(".")];

async function loadConfigs(): Promise<[string, ComponentConfig][]> {
  return Promise.all(
    configFiles.map(async (file) => {
      const mod = await import(resolve(file));
      const config = Object.values(mod).find(
        (v) => v && typeof v === "object" && "controls" in (v as object),
      ) as ComponentConfig | undefined;
      if (!config) throw new Error(`${file}: no exported config with controls`);
      return [file, config] as [string, ComponentConfig];
    }),
  );
}

describe("config schemas", () => {
  it("every schema field has a concrete default", async () => {
    const bad: string[] = [];
    for (const [file, config] of await loadConfigs()) {
      for (const [key, field] of Object.entries(config.controls)) {
        if (field.type === "hidden") continue;
        if (!("default" in field) || field.default === undefined || field.default === null) {
          bad.push(`${file}: ${key}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("every schema field renders in the docs customizer", async () => {
    const bad: string[] = [];
    for (const [file, config] of await loadConfigs()) {
      for (const [key, field] of Object.entries(config.controls)) {
        if (schemaFieldToControl(field) === null) {
          bad.push(`${file}: ${key} (${field.type})`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
