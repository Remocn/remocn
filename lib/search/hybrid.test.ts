import { describe, expect, it } from "bun:test";
import type { ComponentRecord } from "@/lib/mcp/search";
import { fuseRankings, hybridSearch, rankByVectors } from "./hybrid";

function record(
  name: string,
  overrides: Partial<ComponentRecord> = {},
): ComponentRecord {
  return {
    name,
    title: name,
    description: "",
    section: "typography",
    docs: "",
    useWhen: [],
    avoidWhen: [],
    askedAs: [],
    install: "",
    ...overrides,
  };
}

describe("fuseRankings", () => {
  it("puts a name both lists agree on above each list's own top hit", () => {
    const fused = fuseRankings(["a", "shared", "b"], ["c", "shared", "d"]);

    expect(fused[0]).toBe("shared");
  });

  it("keeps the order of a single list", () => {
    expect(fuseRankings(["a", "b", "c"], [])).toEqual(["a", "b", "c"]);
  });
});

describe("rankByVectors", () => {
  it("scores a component by its closest row", () => {
    // Two rows for `clock` (description, phrasing), one for `chart`.
    const vectors = new Float32Array([0, 1, 1, 0, 0.6, 0.8]);
    const hits = rankByVectors(
      new Float32Array([1, 0]),
      vectors,
      ["clock", "clock", "chart"],
      2,
    );

    expect(hits.map((h) => h.name)).toEqual(["clock", "chart"]);
    expect(hits[0].score).toBe(1);
  });
});

describe("hybridSearch", () => {
  const records = [
    record("clock-sweep", { description: "A clock hand sweeps a wedge" }),
    record("typewriter", { description: "Types text one character at a time" }),
    record("bar-chart", { description: "Bars grow to their values" }),
  ];

  it("finds a need the catalog shares no words with", () => {
    const semantic = [
      { name: "clock-sweep", score: 0.9 },
      { name: "bar-chart", score: 0.8 },
      { name: "typewriter", score: 0.7 },
    ];

    const results = hybridSearch(
      records,
      "setup takes five minutes",
      semantic,
      2,
    );

    expect(results.map((r) => r.name)).toEqual(["clock-sweep", "bar-chart"]);
  });

  it("lets an exact name win over a semantic look-alike", () => {
    const semantic = [
      { name: "bar-chart", score: 0.9 },
      { name: "clock-sweep", score: 0.89 },
      { name: "typewriter", score: 0.88 },
    ];

    const results = hybridSearch(records, "typewriter", semantic, 3);

    expect(results[0].name).toBe("typewriter");
  });

  it("pins the named component above a sibling both rankings prefer", () => {
    const siblings = [
      record("typewriter", { title: "Typewriter" }),
      record("caption-typewriter", {
        title: "Typewriter",
        description: "typewriter typewriter captions",
        useWhen: ["typewriter subtitles"],
      }),
    ];
    const semantic = [
      { name: "caption-typewriter", score: 0.95 },
      { name: "typewriter", score: 0.7 },
    ];

    const results = hybridSearch(siblings, "Typewriter", semantic, 2);

    expect(results.map((r) => r.name)).toEqual([
      "typewriter",
      "caption-typewriter",
    ]);
  });

  it("pins a component named inside a short keyword query", () => {
    const semantic = [
      { name: "bar-chart", score: 0.9 },
      { name: "clock-sweep", score: 0.89 },
    ];

    const results = hybridSearch(records, "typewriter headline", semantic, 3);

    expect(results[0].name).toBe("typewriter");
  });

  it("does not pin a name that is one common word of a long description", () => {
    const withButton = [
      ...records,
      record("button", { description: "A button that presses" }),
      record("trim-burst", { description: "Strokes shoot out from a point" }),
    ];
    const semantic = [
      { name: "trim-burst", score: 0.9 },
      { name: "button", score: 0.8 },
    ];

    const results = hybridSearch(
      withButton,
      "tiny sparkle lines radiating out when a button gets pressed",
      semantic,
      2,
    );

    expect(results[0].name).toBe("trim-burst");
  });

  it("drops semantic hits the filters already excluded", () => {
    const semantic = [
      { name: "filtered-out", score: 0.95 },
      { name: "clock-sweep", score: 0.9 },
    ];

    const results = hybridSearch(records, "elapsed time", semantic, 5);

    expect(results.map((r) => r.name)).not.toContain("filtered-out");
  });

  it("falls back to the keyword ranking when the index is unavailable", () => {
    const results = hybridSearch(records, "clock", null, 5);

    expect(results.map((r) => r.name)).toEqual(["clock-sweep"]);
  });
});
