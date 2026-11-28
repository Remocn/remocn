import { describe, expect, it } from "bun:test";
import type { ComponentRecord } from "@/lib/mcp/search";
import { hybridSearch, type SemanticHit } from "./hybrid";
import {
  contentWeight,
  MAX_RANKED_PARTS,
  MAX_SEGMENTS,
  mergeSameIntent,
  searchQuery,
  splitQuery,
} from "./segments";

describe("splitQuery", () => {
  it("cuts a storyboard at commas", () => {
    expect(
      splitQuery(
        "end card with logo website url call to action, lower third name plate, screen recording inside window frame mockup",
      ),
    ).toEqual([
      "end card with logo website url call to action",
      "lower third name plate",
      "screen recording inside window frame mockup",
    ]);
  });

  it("cuts at semicolons, slashes between words and sentence ends", () => {
    expect(splitQuery("typing terminal command; github stars counter")).toEqual(
      ["typing terminal command", "github stars counter"],
    );
    expect(splitQuery("whip pan / light leak")).toEqual([
      "whip pan",
      "light leak",
    ]);
    expect(splitQuery("logo reveal. Then a pricing table.")).toEqual([
      "logo reveal",
      "a pricing table",
    ]);
  });

  it("keeps one effect described with 'and' whole", () => {
    expect(splitQuery("fade and slide in title")).toEqual([
      "fade and slide in title",
    ]);
    expect(splitQuery("before after comparison")).toEqual([
      "before after comparison",
    ]);
    expect(splitQuery("before and after comparison")).toEqual([
      "before and after comparison",
    ]);
    expect(
      splitQuery(
        "phone getting flooded with alerts and then everything is quiet",
      ),
    ).toEqual([
      "phone getting flooded with alerts and then everything is quiet",
    ]);
  });

  it("never cuts at an alternative", () => {
    expect(splitQuery("crossfade or soft dissolve between scenes")).toEqual([
      "crossfade or soft dissolve between scenes",
    ]);
  });

  it("cuts a long run of scenes joined by 'and'", () => {
    expect(
      splitQuery(
        "animated connectors glowing data flow path between nodes and two column comparison board",
      ),
    ).toEqual([
      "animated connectors glowing data flow path between nodes",
      "two column comparison board",
    ]);
  });

  it("joins a clause too short to search alone to the part before it", () => {
    expect(splitQuery("confetti burst, gold")).toEqual([
      "confetti burst, gold",
    ]);
    expect(splitQuery("logo, then pricing table")).toEqual([
      "logo, then pricing table",
    ]);
    expect(splitQuery("pricing table, then gold, testimonial wall")).toEqual([
      "pricing table, gold",
      "testimonial wall",
    ]);
  });

  it("drops constraints instead of searching for them", () => {
    expect(
      splitQuery(
        "subtle keyword emphasis, fine underline drawing; no large zoom, preserve readability",
      ),
    ).toEqual(["subtle keyword emphasis", "fine underline drawing"]);
    expect(splitQuery("заставка с логотипом, без текста")).toEqual([
      "заставка с логотипом, без текста",
    ]);
  });

  it("splits Russian and Chinese briefs", () => {
    expect(
      splitQuery("заставка с логотипом, затем график роста выручки"),
    ).toEqual(["заставка с логотипом", "график роста выручки"]);
    expect(splitQuery("打字机标题，然后数字计数器，最后是标志动画")).toEqual([
      "打字机标题",
      "数字计数器",
      "标志动画",
    ]);
    expect(splitQuery("打字机标题，不使用箭头")).toEqual([
      "打字机标题，不使用箭头",
    ]);
  });

  it("returns an unsplittable query as typed", () => {
    expect(splitQuery("  typewriter headline ")).toEqual([
      "typewriter headline",
    ]);
    expect(splitQuery("")).toEqual([]);
  });
});

describe("contentWeight", () => {
  it("counts named words, not filler, and two Chinese characters as one", () => {
    expect(contentWeight("a fade for the title")).toBe(2);
    expect(contentWeight("数字计数器")).toBe(2);
    expect(contentWeight("3 秒")).toBe(0);
  });
});

describe("mergeSameIntent", () => {
  it("joins neighbours that share a top component and keeps the order", () => {
    expect(
      mergeSameIntent([
        ["perlin-dissolve", "grain-dissolve"],
        ["warp-dissolve", "perlin-dissolve"],
        ["confetti"],
        ["pricing-reveal"],
      ]),
    ).toEqual([[0, 1], [2], [3]]);
  });

  it("does not join parts that only share a component past the top five", () => {
    expect(
      mergeSameIntent([
        ["a", "b", "c", "d", "e", "shared"],
        ["f", "g", "h", "i", "j", "shared"],
      ]),
    ).toEqual([[0], [1]]);
  });
});

function record(name: string, description = ""): ComponentRecord {
  return {
    name,
    title: name,
    description,
    section: "typography",
    docs: "",
    useWhen: [],
    avoidWhen: [],
    askedAs: [],
    install: "",
  };
}

const catalog = [
  record("ink-bloom"),
  record("price-page"),
  record("quote-hero"),
  record("confetti-burst"),
  ...Array.from({ length: 400 }, (_, i) => record(`filler-${i}`)),
];

/**
 * A stand-in for the model: a query is close to the components whose topic
 * it mentions, and a query that mentions several topics is only a little
 * closer to each of them than to everything else, as e5 is with a brief.
 */
const TOPICS: Record<string, string> = {
  logo: "ink-bloom",
  pricing: "price-page",
  testimonial: "quote-hero",
  celebration: "confetti-burst",
};

/** Unrelated components come in an order of their own for every query. */
function noise(text: string): number {
  let hash = 2166136261;
  for (const c of text) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  return ((hash >>> 0) % 1000) / 100_000;
}

async function fakeRankAll(queries: string[]): Promise<SemanticHit[][]> {
  return queries.map((query) => {
    const named = Object.entries(TOPICS)
      .filter(([topic]) => query.includes(topic))
      .map(([, name]) => name);
    const close = named.length > 1 ? 0.6 : 0.9;
    return catalog
      .map((r) => ({
        name: r.name,
        score: named.includes(r.name) ? close : 0.5 - noise(query + r.name),
      }))
      .sort((a, b) => b.score - a.score);
  });
}

describe("searchQuery", () => {
  it("answers a query that fits one component as before", async () => {
    const answer = await searchQuery(
      catalog,
      "logo reveal, gold",
      fakeRankAll,
      { limit: 5 },
    );
    const [semantic] = await fakeRankAll(["logo reveal, gold"]);
    expect(answer.segments).toBeUndefined();
    expect(answer.results).toEqual(
      hybridSearch(catalog, "logo reveal, gold", semantic, 5),
    );
    expect(answer.top?.weak).toBe(false);
  });

  it("answers a weak brief in groups, one per scene, in order", async () => {
    const answer = await searchQuery(
      catalog,
      "logo reveal, pricing table, testimonial wall",
      fakeRankAll,
      { limit: 6, segmentLimit: 2 },
    );
    expect(answer.top?.weak).toBe(true);
    expect(answer.segments?.map((s) => s.query)).toEqual([
      "logo reveal",
      "pricing table",
      "testimonial wall",
    ]);
    expect(answer.segments?.map((s) => s.results[0].name)).toEqual([
      "ink-bloom",
      "price-page",
      "quote-hero",
    ]);
    expect(answer.segments?.every((s) => s.results.length === 2)).toBe(true);
    expect(answer.segments?.every((s) => s.top?.weak === false)).toBe(true);
    expect(answer.results.slice(0, 3).map((r) => r.name)).toEqual([
      "ink-bloom",
      "price-page",
      "quote-hero",
    ]);
  });

  it("searches at most MAX_SEGMENTS parts and names the rest", async () => {
    const topics = ["logo", "pricing", "testimonial", "celebration"];
    const parts = Array.from(
      { length: MAX_SEGMENTS + 2 },
      (_, i) => `${topics[i % topics.length]} scene number${i}`,
    );
    const answer = await searchQuery(catalog, parts.join(", "), fakeRankAll);
    expect(answer.segments).toHaveLength(MAX_SEGMENTS);
    expect(answer.omitted).toEqual(parts.slice(MAX_SEGMENTS));
  });

  it("keeps the whole answer when the model gives out after the whole query", async () => {
    let calls = 0;
    const answer = await searchQuery(
      catalog,
      "logo reveal, pricing table, testimonial wall",
      async (queries) => (calls++ === 0 ? fakeRankAll(queries) : null),
    );
    expect(answer.mode).toBe("hybrid");
    expect(answer.segments).toBeUndefined();
  });

  it("embeds at most MAX_RANKED_PARTS parts and names the rest", async () => {
    const embedded: number[] = [];
    const parts = Array.from({ length: 30 }, (_, i) => `pricing card${i}`);
    const answer = await searchQuery(
      catalog,
      ["logo reveal", ...parts].join(", "),
      async (queries) => {
        embedded.push(queries.length);
        return fakeRankAll(queries);
      },
    );
    expect(Math.max(...embedded)).toBeLessThanOrEqual(MAX_RANKED_PARTS);
    expect(answer.omitted).toContain("pricing card29");
  });

  it("keeps a brief whole when its parts fit no better than the whole", async () => {
    const answer = await searchQuery(
      catalog,
      "something vague, another vague thing",
      fakeRankAll,
    );
    expect(answer.segments).toBeUndefined();
  });

  it("splits by words when the model is not available", async () => {
    const answer = await searchQuery(
      catalog,
      "ink bloom logo, price page table, quote hero wall",
      async () => null,
    );
    expect(answer.mode).toBe("keyword");
    expect(answer.segments?.map((s) => s.results[0].name)).toEqual([
      "ink-bloom",
      "price-page",
      "quote-hero",
    ]);
  });
});
