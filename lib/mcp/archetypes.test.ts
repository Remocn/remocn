import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  ARCHETYPES,
  extractQualityBar,
  parseRecipe,
  pickArchetype,
  splitRow,
} from "./archetypes";

describe("pickArchetype", () => {
  const cases: [string, string][] = [
    ["Release notes video for v2.3", "changelog"],
    ["Show off our open source repo and its GitHub stars", "oss-showcase"],
    ["A demo of our CLI running in the terminal", "cli-tool-demo"],
    ["Reveal our new pricing plans", "pricing-reveal"],
    ["A reel of customer testimonials", "testimonial-reel"],
    ["Our 2025 year in review", "year-in-review"],
    ["5 second logo sting for the channel intro", "logo-bumper"],
    ["Introducing Smart Replies, a new feature", "feature-announcement"],
    ["Product demo for our SaaS dashboard", "product-demo"],
  ];
  for (const [brief, expected] of cases) {
    it(`${brief} → ${expected}`, () => {
      expect(pickArchetype(brief).archetype).toBe(expected as never);
    });
  }

  it("falls back to product-demo when nothing matches", () => {
    const pick = pickArchetype("something cool");
    expect(pick.archetype).toBe("product-demo");
    expect(pick.fallback).toBe(true);
  });

  it("is deterministic", () => {
    const brief = "launch video for our cli with github stars";
    expect(pickArchetype(brief)).toEqual(pickArchetype(brief));
  });
});

describe("splitRow", () => {
  it("honors escaped pipes and pipes inside code spans", () => {
    expect(splitRow("| a | `x | y` | b \\| c |")).toEqual([
      "a",
      "`x | y`",
      "b | c",
    ]);
  });
});

const FIXTURE = `# changelog

**Family:** B. Release & Updates · **Default duration:** ~9s (270f @30fps) · **Format:** 16:9 · **Vibe:** clean

## Beats

| Frames (N=4) | Beat | What happens |
|---|---|---|
| 0–60 | **Version badge** | chip slides in; title builds via \`tracking-in\` |
| 60–160 | **Change list** | rows staggered in |
| 160–270 | **Footer / CTA** | link fades in |

## Beat → slots

| Beat | Catalog components | New component needed |
|---|---|---|
| Version badge | \`tracking-in\` (title), \`shader-dot-orbit\` (bg) | **\`version-badge\`** — chip |
| Change list | \`staggered-fade-up\` (rows), \`not-a-component\` | **\`change-list\`** — rows |
| Footer / CTA | \`soft-blur-in\` (link) | — |
| Accent pop | \`confetti\` | — |
`;

const KNOWN = [
  "tracking-in",
  "shader-dot-orbit",
  "staggered-fade-up",
  "soft-blur-in",
  "confetti",
];

describe("parseRecipe", () => {
  it("joins beats with their slot rows", () => {
    const plan = parseRecipe(FIXTURE, KNOWN);
    expect(plan.meta.defaultduration).toContain("270f");
    expect(plan.totalFrames).toBe(270);
    expect(plan.beats.map((b) => b.name)).toEqual([
      "Version badge",
      "Change list",
      "Footer / CTA",
    ]);
    expect(plan.beats[0]).toMatchObject({
      startFrame: 0,
      endFrame: 60,
      components: ["tracking-in", "shader-dot-orbit"],
      buildNew: ["version-badge"],
    });
    // Unknown names never leak into components.
    expect(plan.beats[1].components).toEqual(["staggered-fade-up"]);
    expect(plan.beats[1].buildNew).toEqual(["change-list"]);
  });

  it("surfaces unmatched slot rows as extras", () => {
    const plan = parseRecipe(FIXTURE, KNOWN);
    expect(plan.extras).toEqual([
      { label: "Accent pop", components: ["confetti"], buildNew: [] },
    ]);
  });

  it("notes when the requested duration differs from the recipe", () => {
    const plan = parseRecipe(FIXTURE, KNOWN, 60);
    expect(plan.notes.length).toBe(1);
  });
});

// Real recipes: skip when the skill files are not in this checkout.
const DIRS = ["plugins/remocn/skills/remocn/references"].map((d) =>
  path.join(process.cwd(), d),
);
const refs = DIRS.find((d) => existsSync(path.join(d, "archetypes")));

function knownNames(): string[] {
  const names: string[] = [];
  for (const ns of [
    "remocn",
    "remocn-ui",
    "remocn-icons",
    "remocn-templates",
  ]) {
    const json = JSON.parse(
      readFileSync(
        path.join(process.cwd(), "registry", ns, "registry.json"),
        "utf8",
      ),
    ) as { items: { name: string }[] };
    names.push(...json.items.map((i) => i.name));
  }
  return names;
}

describe.skipIf(!refs)("real archetype recipes", () => {
  const known = knownNames();
  const read = (a: string) =>
    readFileSync(path.join(refs as string, "archetypes", `${a}.md`), "utf8");

  for (const archetype of ARCHETYPES) {
    it(`${archetype} parses into beats with catalog components`, () => {
      const plan = parseRecipe(read(archetype), known);
      expect(plan.beats.length).toBeGreaterThanOrEqual(3);
      expect(plan.beats.some((b) => b.components.length > 0)).toBe(true);
      for (const beat of plan.beats) {
        for (const c of beat.components) expect(known).toContain(c);
      }
    });
  }

  it("product-demo uses the prose split for frames and lists transitions", () => {
    const plan = parseRecipe(read("product-demo"), known);
    expect(plan.beats[0].name).toBe("Hook");
    expect(plan.beats[0]).toMatchObject({ startFrame: 0, endFrame: 165 });
    expect(plan.totalFrames).toBe(1356);
    expect(plan.transitions).toContain("whip-pan");
  });

  it("product-demo short variant keeps the recipe's beat order", () => {
    const plan = parseRecipe(read("product-demo"), known, 18);
    expect(plan.variant).toBe("Short");
    expect(plan.beats.map((b) => b.name)).toEqual([
      "Hook",
      "Product reveal",
      "Positioning",
      "CTA",
    ]);
    expect(plan.beats.at(-1)?.endFrame).toBe(540);
  });

  it("cli-tool-demo picks the variant closest to the duration", () => {
    expect(parseRecipe(read("cli-tool-demo"), known, 18).totalFrames).toBe(540);
    expect(parseRecipe(read("cli-tool-demo"), known, 45).totalFrames).toBe(
      1350,
    );
  });

  it("anatomy exposes the quality bar section", () => {
    const anatomy = readFileSync(
      path.join(refs as string, "anatomy.md"),
      "utf8",
    );
    const bar = extractQualityBar(anatomy);
    expect(bar?.startsWith("## 3.")).toBe(true);
    expect(bar).not.toContain("## 2.");
  });
});
