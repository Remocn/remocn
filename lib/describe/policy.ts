/**
 * The rules of the describe field's paid tier in one place. A request reaches
 * the model only after every free tier failed to explain it, and only for a
 * visitor who is not banned, is under the daily limit, while the day's budget
 * lasts.
 */

/** Longest request the field accepts. */
export const MAX_TEXT = 200;

/** Off-topic requests that ban a visitor, counted over `STRIKE_WINDOW_DAYS`. */
export const STRIKES_TO_BAN = 3;
export const STRIKE_WINDOW_DAYS = 30;
export const BAN_DAYS = 30;

/** Model calls one visitor gets per UTC day. Cached answers don't count. */
export const DAILY_REQUESTS_PER_CLIENT = 30;

/** Requests per minute one visitor may send to the endpoint at all. */
export const REQUESTS_PER_MINUTE = 12;

/** What the model may cost per UTC day, in dollars. */
export function dailyBudgetUsd(): number {
  const env = process.env.DESCRIBE_DAILY_BUDGET_USD?.trim();
  const raw = env ? Number(env) : Number.NaN;
  return Number.isFinite(raw) && raw >= 0 ? raw : 2;
}

export const MODEL = "claude-haiku-5-5";

/**
 * Claude Haiku 5.5 list prices, in millionths of a dollar per token: $0.10
 * per million input tokens and $0.50 per million output tokens (prompts under
 * 100K tokens, which ours always are).
 */
export const PRICE_MICROS = { input: 0.1, output: 0.5 } as const;

export function costMicros(usage: {
  input_tokens: number;
  output_tokens: number;
}): number {
  return Math.ceil(
    usage.input_tokens * PRICE_MICROS.input +
      usage.output_tokens * PRICE_MICROS.output,
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

export function daysLater(now: Date, days: number): Date {
  return new Date(now.getTime() + days * DAY_MS);
}

/** The UTC day of `now`, as Postgres `date` text. */
export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * How close in meaning (cosine, multilingual-e5-small) a request must be to a
 * preset or mood for that preset to answer it alone; below it the request goes
 * on to a model. On the moods, mood-like requests ("like a film trailer",
 * "в стиле журнала") scored 0.874–0.951 and requests no mood covers ("more
 * bars", "rotate the logo") at most 0.832.
 */
export const MATCH_THRESHOLD = 0.86;
