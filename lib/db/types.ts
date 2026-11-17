import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

/**
 * A drizzle database over lib/db/schema.ts, whatever the driver: postgres.js
 * on the server, PGlite in tests.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
