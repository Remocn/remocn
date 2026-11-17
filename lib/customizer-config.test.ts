import { describe, expect, it } from "bun:test";
import { resolve } from "node:path";
import { Glob } from "bun";
import type { ComponentConfig } from "./customizer-config";
import {
  groundControl,
  resolveControls,
  sceneControls,
  schemaFieldToControl,
  toProps,
} from "./customizer-config";

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
        // A colour without a default is auto: the component picks it from
        // its theme, and the customizer starts on Auto.
        if (field.type === "color") continue;
        if (
          !("default" in field) ||
          field.default === undefined ||
          field.default === null
        ) {
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

  // People read the panel by label and agents address controls by it, so
  // two fields with one label leave one of them unreachable.
  it("labels are unique within a panel", async () => {
    const bad: string[] = [];
    for (const [file, config] of await loadConfigs()) {
      const slug = file.split("/").at(-2) ?? "";
      const seen = new Set<string>();
      for (const control of Object.values(
        resolveControls(slug, config.controls, config.lists),
      )) {
        if (seen.has(control.label)) bad.push(`${file}: ${control.label}`);
        seen.add(control.label);
      }
    }
    expect(bad).toEqual([]);
  });

  // ui-sdk's slider ends on the last whole step below `max`, so a step that
  // doesn't divide the range would make `max` unreachable.
  it("every slider's step divides its range", async () => {
    const bad: string[] = [];
    for (const [file, config] of await loadConfigs()) {
      const slug = file.split("/").at(-2) ?? "";
      const controls = resolveControls(slug, config.controls, config.lists);
      for (const [key, control] of Object.entries(controls)) {
        if (control.type !== "number") continue;
        const steps = (control.max - control.min) / control.step;
        if (Math.abs(steps - Math.round(steps)) > 1e-9) {
          bad.push(
            `${file}: ${key} (${control.min}..${control.max} step ${control.step})`,
          );
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("Launch Pack fields", () => {
  it("a colour without a default starts on auto", () => {
    expect(
      schemaFieldToControl({
        type: "color",
        default: undefined,
        description: "Ink",
      }),
    ).toEqual({ type: "color", default: "", label: "Ink" });
  });

  it("a font offers the component's face first, then the preview fonts", () => {
    const control = schemaFieldToControl({
      type: "font-family",
      default: "Golos Text",
      description: "Font",
    });
    expect(control?.type).toBe("font");
    if (control?.type !== "font") return;
    expect(control.options[0]).toBe("Golos Text");
    expect(control.options).toContain("Inter");
    expect(new Set(control.options).size).toBe(control.options.length);
  });

  it("lists lead, with a tuple's length", () => {
    const controls = resolveControls(
      "demo",
      { title: { type: "text-content", default: "Hi", description: "Title" } },
      { pair: { default: ["A", "B"], description: "Pair", min: 2, max: 2 } },
    );
    expect(Object.keys(controls)).toEqual(["pair", "title", "speed"]);
    expect(controls.pair).toEqual({
      type: "list",
      default: ["A", "B"],
      label: "Pair",
      min: 2,
      max: 2,
    });
  });

  it("auto colours and the auto ground never reach the component", () => {
    const controls = resolveControls("demo", {
      ink: { type: "color", default: undefined, description: "Text color" },
      accent: { type: "color", default: "#3B5BFD", description: "Accent" },
      ground: groundControl(),
    });
    expect(
      toProps(controls, {
        ink: "",
        accent: "#3B5BFD",
        ground: "auto",
        speed: 1,
      }),
    ).toEqual({ accent: "#3B5BFD", speed: 1 });
    expect(toProps(controls, { ink: "#fff", ground: "ember" })).toEqual({
      ink: "#fff",
      ground: "ember",
    });
  });

  it("scene fields follow the options", () => {
    expect(Object.keys(sceneControls({ font: "Geist", grain: true }))).toEqual([
      "fontFamily",
      "ink",
      "background",
      "scale",
      "delay",
      "grain",
    ]);
    expect(
      Object.keys(sceneControls({ ink: false, background: false })),
    ).toEqual(["scale", "delay"]);
  });
});
