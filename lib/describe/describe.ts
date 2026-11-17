import { createHash } from "node:crypto";
import { type ControlConfig, getDefaults } from "@/lib/customizer-config";
import type { Db } from "@/lib/db/types";
import type { AskModel } from "./claude";
import { parseLiterals } from "./literals";
import type { PresetMatch } from "./match";
import {
  answerSchema,
  readAnswer,
  systemPrompt,
  userTurn,
} from "./model-schema";
import { moodsFor } from "./moods";
import { offTopicReason } from "./off-topic";
import { changedOnly, sanitizePatch, sanitizeValues } from "./patch";
import {
  DAILY_REQUESTS_PER_CLIENT,
  dailyBudgetUsd,
  MATCH_THRESHOLD,
} from "./policy";
import {
  addStrike,
  bannedUntil,
  findAnswer,
  recordSpend,
  type StrikeReason,
  saveAnswer,
  spentToday,
  takeQuota,
} from "./store";
import type { DescribeRequest, DescribeResponse, Patch, Preset } from "./types";

export interface DescribedComponent {
  name: string;
  title: string;
  description: string;
  controls: ControlConfig;
  presets: Preset[];
}

export interface DescribeDeps {
  now: Date;
  /** The visitor's hashed address, or null when it is unknown. */
  client: string | null;
  /**
   * The database, asked for only once a request needs it: the free tiers
   * answer even while it is slow or down.
   */
  db: () => Promise<Db | null>;
  match: (text: string, presets: Preset[]) => Promise<PresetMatch | null>;
  /** Null when the server has no model configured. */
  ask: AskModel | null;
}

/** Components that show code, terminals or messages, where "write the code…" is a look. */
const WRITES_TEXT = new Set(
  "code codex opencode terminal typewriter editor ide cli shell prompt chat chatgpt claude gpt copilot cursor message messages mail email inbox".split(
    " ",
  ),
);

function writesText(component: DescribedComponent): boolean {
  return `${component.name} ${component.title}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .some((word) => WRITES_TEXT.has(word));
}

/** The same request in other spacing or case is the same request. */
export function normalizeQuery(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ")
    .replace(/[\s.!?…]+$/u, "")
    .trim();
}

/** Which values the request started from, for the answer cache. */
function startOf(controls: ControlConfig, values: Record<string, unknown>) {
  const defaults = getDefaults(controls);
  const changed = Object.keys(values)
    .filter((key) => !Object.is(values[key], defaults[key]))
    .sort()
    .map((key) => [key, values[key]]);
  if (changed.length === 0) return "";
  return createHash("sha1")
    .update(JSON.stringify(changed))
    .digest("hex")
    .slice(0, 16);
}

/**
 * Answers one describe request, cheapest tier first. Only a request that the
 * parser and the presets both fail to explain reaches the model, and only
 * through the guard: off-topic patterns strike before any call, a banned or
 * over-quota visitor and a spent day get the free answer, and the model's own
 * off-topic verdict strikes too.
 */
export async function describe(
  request: Pick<DescribeRequest, "text" | "values" | "mode">,
  component: DescribedComponent,
  deps: DescribeDeps,
): Promise<DescribeResponse> {
  const { controls } = component;
  const text = request.text.trim();
  const values = sanitizeValues(controls, request.values);

  const strike = async (reason: StrikeReason) => {
    const db = deps.client ? await deps.db() : null;
    if (!db || !deps.client) return;
    await addStrike(
      db,
      { client: deps.client, reason, component: component.name, text },
      deps.now,
    );
  };
  const rejected = (): DescribeResponse => ({
    patch: {},
    tier: null,
    understood: false,
    ai: "rejected",
  });

  const suspect = offTopicReason(text);
  if (suspect === "injection") {
    await strike("pattern").catch(() => {});
    return rejected();
  }

  // 1. Words and values the parser can read.
  const literal = parseLiterals(text, controls, values);
  const read = Object.keys(literal.patch).length > 0;
  if (read && literal.leftover.length === 0) {
    return {
      patch: changedOnly(literal.patch, values),
      tier: "literal",
      understood: true,
      ai: "skipped",
    };
  }

  // 2. The component's presets and the shared moods, by meaning.
  const candidates = [
    ...component.presets,
    ...moodsFor(controls, getDefaults(controls)),
  ];
  const match = await deps.match(text, candidates).catch(() => null);
  const matched = !!match && match.score >= MATCH_THRESHOLD;

  // An ask for code or prose, with nothing in it that reads as a look, on a
  // component that isn't about code or messages itself.
  if (suspect && !read && !matched && !writesText(component)) {
    await strike("pattern").catch(() => {});
    return rejected();
  }

  if (match && matched) {
    const { preset } = match;
    return {
      patch: changedOnly({ ...preset.props, ...literal.patch }, values),
      tier: "preset",
      match: {
        kind: preset.id.startsWith("mood:") ? "mood" : "preset",
        id: preset.id,
        label: preset.label,
      },
      understood: true,
      ai: "skipped",
    };
  }

  const partial = (ai: DescribeResponse["ai"]): DescribeResponse => ({
    patch: changedOnly(literal.patch, values),
    tier: read ? "literal" : null,
    understood: false,
    ai,
  });
  const schema = answerSchema(controls);
  const system = systemPrompt(component);

  // 3. The browser's model, if it has one: the client asks in `free` mode.
  if (request.mode === "free") {
    return {
      ...partial("skipped"),
      ...(schema ? { device: { system, schema } } : {}),
    };
  }

  // 4. Claude, behind the guard.
  const { client, ask } = deps;
  if (!schema) return partial("skipped");
  if (!ask || !client) return partial("off");
  const db = await deps.db();
  if (!db) return partial("off");

  try {
    if (await bannedUntil(db, client, deps.now)) return partial("banned");

    const key = {
      component: component.name,
      query: normalizeQuery(text),
      start: startOf(controls, values),
    };
    const cached = await findAnswer(db, key, deps.now);
    if (cached) {
      if (!cached.onTopic) {
        await strike("model");
        return rejected();
      }
      // The component's props may have changed since the answer was cached.
      return answered(sanitizePatch(controls, cached.patch), "cached");
    }

    if ((await spentToday(db, deps.now)) >= dailyBudgetUsd() * 1_000_000) {
      return partial("budget");
    }
    if (!(await takeQuota(db, client, deps.now, DAILY_REQUESTS_PER_CLIENT))) {
      return partial("limited");
    }

    const reply = await ask({
      system,
      user: userTurn(text, values, controls),
      schema,
    });
    await recordSpend(db, reply.usage, deps.now);
    if (reply.refused) {
      await strike("refusal");
      return rejected();
    }
    const answer = readAnswer(controls, reply.answer);
    if (!answer) return partial("error");
    await saveAnswer(db, key, answer, deps.now);
    if (!answer.onTopic) {
      await strike("model");
      return rejected();
    }
    return answered(answer.patch, "used");
  } catch (error) {
    console.error("[describe] model tier failed:", error);
    return partial("error");
  }

  function answered(patch: Patch, ai: "used" | "cached"): DescribeResponse {
    // The model read the whole request, so its reading replaces the parser's
    // ("numbers lighter" is a weight, not a light theme), except where the
    // request gave an exact value ("2x faster" is 2, "#ff0066" that colour).
    const exact = Object.fromEntries(
      literal.exact.map((key) => [key, literal.patch[key]]),
    );
    const combined = { ...patch, ...exact };
    const merged = changedOnly(combined, values);
    const any = Object.keys(combined).length > 0;
    return {
      patch: merged,
      tier: any ? "ai" : null,
      understood: any,
      ai,
    };
  }
}
