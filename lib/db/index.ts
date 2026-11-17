import "server-only";

import { join } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";
import type { Db } from "./types";

export type { Db };

let ready: Promise<Db | null> | undefined;
/** After a failed connect, requests skip the database until this time. */
let retryAt = 0;
const RETRY_MS = 60_000;

/**
 * The site's Postgres, or `null` when `DATABASE_URL` is unset or the database
 * can't be reached. Pending migrations from drizzle/ run once per process,
 * before the first query, so a deploy needs no separate migration step.
 *
 * Callers treat `null` as "the feature that needs a database is off": the
 * describe field then answers from presets only and never calls the model.
 */
export function getDb(): Promise<Db | null> {
  if (!ready && Date.now() < retryAt) return Promise.resolve(null);
  ready ??= connect();
  return ready;
}

async function connect(): Promise<Db | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const client = postgres(url, {
    max: 5,
    idle_timeout: 30,
    connect_timeout: 5,
  });
  try {
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: join(process.cwd(), "drizzle") });
    return db as unknown as Db;
  } catch (error) {
    console.error("[db] could not connect or migrate:", error);
    void client.end({ timeout: 1 }).catch(() => {});
    // Try again after a pause, instead of on every request or never.
    ready = undefined;
    retryAt = Date.now() + RETRY_MS;
    return null;
  }
}
