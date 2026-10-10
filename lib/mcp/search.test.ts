import { describe, expect, it } from "bun:test";
import {
  type ComponentRecord,
  closestNames,
  normalizeName,
  searchComponents,
} from "./search";

function record(
  name: string,
  overrides: Partial<ComponentRecord> = {},
): ComponentRecord {
  return {
    name,
    title: name
      .split("-")
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" "),
    description: "",
    section: "typography",
    docs: `https://remocn.dev/docs/typography/${name}.md`,
    vibe: "clean",
    length: 30,
    tier: "remocn",
    useWhen: [],
    avoidWhen: [],
    install: `npx shadcn@latest add @remocn/${name}`,
    ...overrides,
  };
}

const RECORDS: ComponentRecord[] = [
  record("typewriter", {
    description: "Types text character by character with a blinking caret",
    useWhen: ["A terminal-style line should appear as if typed"],
    length: 90,
    vibe: "tech",
  }),
  record("rolling-number", {
    section: "motion-graphics",
    description: "A number counter that rolls digits up to a target",
    useWhen: ["Land one metric with a satisfying count-up"],
    vibe: "data",
    length: 45,
  }),
  record("number-wheel", {
    section: "motion-graphics",
    description: "Slot-style digits spin into place",
    vibe: "data",
    length: 60,
  }),
  record("accordion", {
    section: "ui",
    description: "Expands and collapses a disclosure panel",
    length: "state-driven",
    tier: "remocn-ui",
  }),
  record("whip-pan", {
    section: "transitions",
    description: "Fast directional blur transition between scenes",
    vibe: "playful",
    length: 18,
  }),
];

describe("searchComponents", () => {
  it("ranks the exact name first", () => {
    const [first] = searchComponents(RECORDS, { query: "number wheel" });
    expect(first.name).toBe("number-wheel");
  });

  it("matches on description and useWhen", () => {
    const names = searchComponents(RECORDS, { query: "metric counter" }).map(
      (r) => r.name,
    );
    expect(names[0]).toBe("rolling-number");
  });

  it("prefix-matches longer words", () => {
    const names = searchComponents(RECORDS, { query: "type" }).map(
      (r) => r.name,
    );
    expect(names).toContain("typewriter");
  });

  it("filters by vibe", () => {
    const names = searchComponents(RECORDS, {
      query: "number",
      vibe: "data",
    }).map((r) => r.name);
    expect(names.sort()).toEqual(["number-wheel", "rolling-number"]);
  });

  it("filters by maxLength and drops non-numeric lengths", () => {
    const names = searchComponents(RECORDS, { query: "", maxLength: 50 }).map(
      (r) => r.name,
    );
    expect(names).toEqual(["rolling-number", "whip-pan"]);
    expect(names).not.toContain("accordion");
  });

  it("keeps state-driven components when maxLength is not set", () => {
    const names = searchComponents(RECORDS, { query: "disclosure" }).map(
      (r) => r.name,
    );
    expect(names).toEqual(["accordion"]);
  });

  it("returns nothing for unrelated queries", () => {
    expect(searchComponents(RECORDS, { query: "zebra quokka" })).toEqual([]);
  });

  it("respects the limit", () => {
    expect(searchComponents(RECORDS, { query: "", limit: 2 })).toHaveLength(2);
  });
});

describe("name lookup", () => {
  it("normalizes registry-style input", () => {
    expect(normalizeName("@remocn/Kinetic Center Build")).toBe(
      "kinetic-center-build",
    );
    expect(normalizeName("typography/typewriter.md")).toBe("typewriter");
  });

  it("suggests close matches for typos", () => {
    const names = RECORDS.map((r) => r.name);
    expect(closestNames(names, "typewritter")[0]).toBe("typewriter");
    expect(closestNames(names, "rolling")[0]).toBe("rolling-number");
    expect(closestNames(names, "wheel-number")).toContain("number-wheel");
  });

  it("returns no suggestions for nonsense", () => {
    expect(closestNames(["typewriter", "whip-pan"], "qqqqqqqqqq")).toEqual([]);
  });
});

describe("ranking regressions", () => {
  it("a full component name in a longer query beats partial-word matches", () => {
    const records = [
      record("typewriter", { description: "Character reveal with a cursor" }),
      record("rush-type", {
        description: "Cycles one forceful headline word at a time",
      }),
    ];
    const [first] = searchComponents(records, {
      query: "typewriter headline",
    });
    expect(first.name).toBe("typewriter");
  });
});
