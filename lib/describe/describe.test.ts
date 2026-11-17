import { beforeEach, expect, describe as group, test } from "bun:test";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { resolveControls, sceneControls } from "@/lib/customizer-config";
import * as schema from "@/lib/db/schema";
import type { Db } from "@/lib/db/types";
import type { AskModel, ModelReply } from "./claude";
import {
  type DescribeDeps,
  type DescribedComponent,
  describe,
} from "./describe";
import { BAN_DAYS, daysLater } from "./policy";
import { bannedUntil, spentToday } from "./store";
import type { Preset } from "./types";

const controls = resolveControls("test-scene", {
  bars: {
    type: "number",
    default: 12,
    min: 4,
    max: 40,
    step: 1,
    description: "Bars",
    hiddenFromList: false,
  },
  title: { type: "text-content", default: "Revenue", description: "Title" },
  ...sceneControls({ font: "Geist", grain: true }),
});

const neon: Preset = {
  id: "neon",
  label: "Neon night",
  description: "Glowing colours on black, fast.",
  askedAs: ["neon"],
  props: { speed: 1.5, background: "#000000" },
};

const component: DescribedComponent = {
  name: "test-scene",
  title: "Test scene",
  description: "Bars that grow.",
  controls,
  presets: [neon],
};

let db: Db;
let calls: number;
let reply: ModelReply;
const now = new Date("2026-11-17T12:00:00Z");

const ask: AskModel = async () => {
  calls++;
  return reply;
};

function deps(overrides: Partial<DescribeDeps> = {}): DescribeDeps {
  return {
    now,
    client: "visitor",
    db: async () => db,
    ask,
    // Matching by meaning needs the embedding model; here it matches by id.
    match: async (text, presets) => {
      const preset = presets.find((p) => text.includes(p.id));
      return preset
        ? { preset, score: 0.95 }
        : { preset: presets[0], score: 0.5 };
    },
    ...overrides,
  };
}

const run = (
  text: string,
  more: Partial<DescribeDeps> = {},
  mode: "free" | "auto" = "auto",
) => describe({ text, values: {}, mode }, component, deps(more));

const onTopic = (changes: { prop: string; value: unknown }[]): ModelReply => ({
  answer: { on_topic: true, changes },
  refused: false,
  usage: { input_tokens: 1500, output_tokens: 100 },
});
const offTopic: ModelReply = {
  answer: { on_topic: false, changes: [] },
  refused: false,
  usage: { input_tokens: 1500, output_tokens: 20 },
};

beforeEach(async () => {
  const client = new PGlite();
  const pg = drizzle(client, { schema });
  await migrate(pg, { migrationsFolder: join(process.cwd(), "drizzle") });
  db = pg as unknown as Db;
  calls = 0;
  reply = onTopic([{ prop: "bars", value: 30 }]);
});

group("free tiers", () => {
  test("the parser answers what it can read in full, without the model", async () => {
    const result = await run("slower, no grain");
    expect(result).toMatchObject({
      tier: "literal",
      understood: true,
      ai: "skipped",
    });
    expect(result.patch).toEqual({ speed: 0.75, grain: false });
    expect(calls).toBe(0);
  });

  test("a preset answers a request close to it in meaning", async () => {
    const result = await run("make it neon");
    expect(result).toMatchObject({ tier: "preset", match: { id: "neon" } });
    expect(result.patch).toEqual({ speed: 1.5, background: "#000000" });
    expect(calls).toBe(0);
  });

  test("free mode stops before the model and hands over its schema", async () => {
    const result = await run("more bars", {}, "free");
    expect(result.ai).toBe("skipped");
    expect(result.device?.schema).toBeDefined();
    expect(calls).toBe(0);
  });
});

group("model tier", () => {
  test("answers, records the spend and caches the answer", async () => {
    const first = await run("many more bars");
    expect(first).toMatchObject({
      tier: "ai",
      ai: "used",
      patch: { bars: 30 },
    });
    const again = await run("Many more bars!");
    expect(again).toMatchObject({ ai: "cached", patch: { bars: 30 } });
    expect(calls).toBe(1);
    // 1500 × $0.10/M + 100 × $0.50/M = 200 micro-dollars.
    expect(await spentToday(db, now)).toBe(200);
  });

  test("a value its control wouldn't take is dropped, prose included", async () => {
    reply = onTopic([
      { prop: "background", value: "Here is your Python program: print(1)" },
      { prop: "bars", value: "lots" },
      { prop: "nope", value: 3 },
      { prop: "bars", value: 30 },
    ]);
    const result = await run("many more bars please");
    expect(result.patch).toEqual({ bars: 30 });
  });

  test("the model's shade beats a colour word, an exact value beats the model", async () => {
    reply = onTopic([
      { prop: "background", value: "#1b4d2e" },
      { prop: "speed", value: 1.75 },
    ]);
    const result = await run("forest green background, 2x faster, wobbly bars");
    expect(result.patch).toEqual({ background: "#1b4d2e", speed: 2 });
  });

  test("the parser's guesses don't leak into the model's answer", async () => {
    reply = onTopic([{ prop: "bars", value: 8 }]);
    const result = await run("bars lighter and fewer");
    expect(result.patch).toEqual({ bars: 8 });
  });

  test("the model can't write copy", async () => {
    reply = onTopic([{ prop: "title", value: "def hack(): pass" }]);
    const result = await run("rename the chart please");
    expect(result.patch).toEqual({});
  });

  test("is off without a key, a database or a known visitor", async () => {
    expect((await run("more bars", { ask: null })).ai).toBe("off");
    expect((await run("more bars", { db: async () => null })).ai).toBe("off");
    expect((await run("more bars", { client: null })).ai).toBe("off");
  });

  test("stops at the daily budget", async () => {
    process.env.DESCRIBE_DAILY_BUDGET_USD = "0";
    try {
      expect((await run("more bars")).ai).toBe("budget");
      expect(calls).toBe(0);
    } finally {
      delete process.env.DESCRIBE_DAILY_BUDGET_USD;
    }
  });
});

group("guard", () => {
  test("three off-topic requests ban the visitor for 30 days", async () => {
    expect((await run("write me a python program")).ai).toBe("rejected");
    expect(calls).toBe(0);
    reply = offTopic;
    expect((await run("what is the capital of france")).ai).toBe("rejected");
    expect(calls).toBe(1);
    expect(await bannedUntil(db, "visitor", now)).toBeNull();

    expect((await run("напиши сочинение про лето")).ai).toBe("rejected");
    expect(await bannedUntil(db, "visitor", now)).toEqual(
      daysLater(now, BAN_DAYS),
    );

    // Banned: no more model calls, the free tiers still work.
    reply = onTopic([{ prop: "bars", value: 30 }]);
    expect((await run("many more bars")).ai).toBe("banned");
    expect((await run("slower")).patch).toEqual({ speed: 0.75 });
    expect(calls).toBe(1);

    // Another visitor is unaffected.
    expect((await run("many more bars", { client: "other" })).ai).toBe("used");
  });

  test("asking the same off-topic thing again is another strike, from the cache", async () => {
    reply = offTopic;
    for (let i = 0; i < 3; i++) await run("tell me a joke about cats");
    expect(calls).toBe(1);
    expect(await bannedUntil(db, "visitor", now)).not.toBeNull();
  });

  test("a code-ish request that also asks for a look goes to the model, unstruck", async () => {
    const result = await run("write the code slower and with wobble");
    expect(result.ai).toBe("used");
    expect(calls).toBe(1);
  });

  test("on a component about code, code words are not a strike by themselves", async () => {
    const terminal = {
      ...component,
      name: "terminal-simulator",
      title: "Terminal",
    };
    const result = await describe(
      { text: "show python code", values: {}, mode: "auto" },
      terminal,
      deps(),
    );
    expect(result.ai).toBe("used");
  });

  test("the model sees the props it may change, never the copy", async () => {
    let user = "";
    await run("many more bars", {
      ask: async (input) => {
        user = input.user;
        return reply;
      },
    });
    expect(user).toContain('"bars":12');
    expect(user).not.toContain("Revenue");
  });

  test("a refusal is a strike", async () => {
    reply = {
      answer: null,
      refused: true,
      usage: { input_tokens: 10, output_tokens: 0 },
    };
    expect((await run("something nasty")).ai).toBe("rejected");
  });
});
