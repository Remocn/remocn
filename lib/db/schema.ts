import {
  bigint,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Tables behind the customizer's describe field (lib/describe). Only the
 * paid tier, the Haiku call, needs them: a request that never reaches the
 * model never writes here.
 *
 * Visitors are known by `client`, a salted hash of their IP address (an IPv6
 * address by its /64 network), never by the address itself.
 */

/** A visitor the guard has banned from the model, until `bannedUntil`. */
export const describeBans = pgTable("describe_bans", {
  client: text("client").primaryKey(),
  bannedUntil: timestamp("banned_until", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * One request that asked for something other than an animation's look. Three
 * inside the strike window ban the visitor. `text` is what they typed (at most
 * 200 characters), kept as long as the strike counts so a false ban can be
 * checked by hand.
 */
export const describeStrikes = pgTable(
  "describe_strikes",
  {
    id: serial("id").primaryKey(),
    client: text("client").notNull(),
    reason: text("reason").notNull(),
    component: text("component").notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("describe_strikes_client").on(table.client, table.createdAt),
  ],
);

/** Model calls per visitor per UTC day, for the per-visitor daily limit. */
export const describeQuotas = pgTable(
  "describe_quotas",
  {
    client: text("client").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    requests: integer("requests").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.client, table.day] })],
);

/** What the model cost per UTC day, for the daily budget. */
export const describeSpend = pgTable("describe_spend", {
  day: date("day", { mode: "string" }).primaryKey(),
  requests: integer("requests").notNull().default(0),
  inputTokens: bigint("input_tokens", { mode: "number" }).notNull().default(0),
  outputTokens: bigint("output_tokens", { mode: "number" })
    .notNull()
    .default(0),
  /** Millionths of a dollar. */
  costMicros: bigint("cost_micros", { mode: "number" }).notNull().default(0),
});

/**
 * The model's answers, by component, normalized request and starting values.
 * A repeated request is answered from here for free. The rows people asked
 * for most are also the candidates for new presets.
 */
export const describeAnswers = pgTable(
  "describe_answers",
  {
    component: text("component").notNull(),
    query: text("query").notNull(),
    /** Hash of the non-default values the request started from; "" for none. */
    start: text("start").notNull().default(""),
    onTopic: integer("on_topic").notNull(),
    patch: jsonb("patch").$type<Record<string, unknown>>().notNull(),
    hits: integer("hits").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.component, table.query, table.start] }),
  ],
);
