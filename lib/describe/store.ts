import { and, count, eq, gt, lt, sql } from "drizzle-orm";
import {
  describeAnswers,
  describeBans,
  describeQuotas,
  describeSpend,
  describeStrikes,
} from "@/lib/db/schema";
import type { Db } from "@/lib/db/types";
import {
  BAN_DAYS,
  costMicros,
  daysAgo,
  daysLater,
  MAX_TEXT,
  STRIKE_WINDOW_DAYS,
  STRIKES_TO_BAN,
  utcDay,
} from "./policy";
import type { Patch } from "./types";

/**
 * The paid tier's bookkeeping: bans, strikes, per-visitor quotas, the daily
 * spend and the cache of model answers. Every function takes the database, so
 * tests run them against PGlite.
 */

/** The end of the visitor's ban, or null when they are not banned. */
export async function bannedUntil(
  db: Db,
  client: string,
  now: Date,
): Promise<Date | null> {
  const [row] = await db
    .select({ until: describeBans.bannedUntil })
    .from(describeBans)
    .where(
      and(eq(describeBans.client, client), gt(describeBans.bannedUntil, now)),
    );
  return row?.until ?? null;
}

export type StrikeReason = "pattern" | "model" | "refusal";

/**
 * Records an off-topic request. The visitor's `STRIKES_TO_BAN`th strike inside
 * the window bans them for `BAN_DAYS`.
 */
export async function addStrike(
  db: Db,
  strike: {
    client: string;
    reason: StrikeReason;
    component: string;
    text: string;
  },
  now: Date,
): Promise<{ strikes: number; bannedUntil: Date | null }> {
  await db.insert(describeStrikes).values({
    ...strike,
    text: strike.text.slice(0, MAX_TEXT),
    createdAt: now,
  });
  const [{ strikes }] = await db
    .select({ strikes: count() })
    .from(describeStrikes)
    .where(
      and(
        eq(describeStrikes.client, strike.client),
        gt(describeStrikes.createdAt, daysAgo(now, STRIKE_WINDOW_DAYS)),
      ),
    );
  if (strikes < STRIKES_TO_BAN) return { strikes, bannedUntil: null };

  const until = daysLater(now, BAN_DAYS);
  await db
    .insert(describeBans)
    .values({ client: strike.client, bannedUntil: until, createdAt: now })
    .onConflictDoUpdate({
      target: describeBans.client,
      set: { bannedUntil: until, createdAt: now },
    });
  return { strikes, bannedUntil: until };
}

/**
 * Counts one model call against the visitor's day. False when that call would
 * go over `limit`; the attempt is counted either way.
 */
export async function takeQuota(
  db: Db,
  client: string,
  now: Date,
  limit: number,
): Promise<boolean> {
  const [row] = await db
    .insert(describeQuotas)
    .values({ client, day: utcDay(now), requests: 1 })
    .onConflictDoUpdate({
      target: [describeQuotas.client, describeQuotas.day],
      set: { requests: sql`${describeQuotas.requests} + 1` },
    })
    .returning({ requests: describeQuotas.requests });
  return row.requests <= limit;
}

/** What the model has cost today, in millionths of a dollar. */
export async function spentToday(db: Db, now: Date): Promise<number> {
  const [row] = await db
    .select({ cost: describeSpend.costMicros })
    .from(describeSpend)
    .where(eq(describeSpend.day, utcDay(now)));
  return row?.cost ?? 0;
}

export async function recordSpend(
  db: Db,
  usage: { input_tokens: number; output_tokens: number },
  now: Date,
): Promise<void> {
  const cost = costMicros(usage);
  await db
    .insert(describeSpend)
    .values({
      day: utcDay(now),
      requests: 1,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      costMicros: cost,
    })
    .onConflictDoUpdate({
      target: describeSpend.day,
      set: {
        requests: sql`${describeSpend.requests} + 1`,
        inputTokens: sql`${describeSpend.inputTokens} + ${usage.input_tokens}`,
        outputTokens: sql`${describeSpend.outputTokens} + ${usage.output_tokens}`,
        costMicros: sql`${describeSpend.costMicros} + ${cost}`,
      },
    });
}

export type Answer = { onTopic: boolean; patch: Patch };

type AnswerKey = { component: string; query: string; start: string };

/** Older answers are asked again: prompts and controls move on. */
const ANSWER_DAYS = 30;

const answerWhere = (key: AnswerKey, now: Date) =>
  and(
    eq(describeAnswers.component, key.component),
    eq(describeAnswers.query, key.query),
    eq(describeAnswers.start, key.start),
    gt(describeAnswers.createdAt, daysAgo(now, ANSWER_DAYS)),
  );

/** A cached model answer, counting the hit. */
export async function findAnswer(
  db: Db,
  key: AnswerKey,
  now: Date,
): Promise<Answer | null> {
  const [row] = await db
    .update(describeAnswers)
    .set({ hits: sql`${describeAnswers.hits} + 1`, updatedAt: now })
    .where(answerWhere(key, now))
    .returning({
      onTopic: describeAnswers.onTopic,
      patch: describeAnswers.patch,
    });
  return row ? { onTopic: row.onTopic === 1, patch: row.patch } : null;
}

export async function saveAnswer(
  db: Db,
  key: AnswerKey,
  answer: Answer,
  now: Date,
): Promise<void> {
  await db
    .insert(describeAnswers)
    .values({
      ...key,
      onTopic: answer.onTopic ? 1 : 0,
      patch: answer.patch,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        describeAnswers.component,
        describeAnswers.query,
        describeAnswers.start,
      ],
      set: {
        onTopic: answer.onTopic ? 1 : 0,
        patch: answer.patch,
        hits: 1,
        createdAt: now,
        updatedAt: now,
      },
    });
}

/** Drops strikes, quotas and bans that no longer count. */
export async function prune(db: Db, now: Date): Promise<void> {
  await db
    .delete(describeStrikes)
    .where(lt(describeStrikes.createdAt, daysAgo(now, STRIKE_WINDOW_DAYS)));
  await db
    .delete(describeQuotas)
    .where(lt(describeQuotas.day, utcDay(daysAgo(now, 2))));
  await db.delete(describeBans).where(lt(describeBans.bannedUntil, now));
  await db
    .delete(describeAnswers)
    .where(lt(describeAnswers.createdAt, daysAgo(now, ANSWER_DAYS)));
}
