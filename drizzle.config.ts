import { defineConfig } from "drizzle-kit";

/**
 * `bunx drizzle-kit generate` writes a migration into drizzle/ after a change
 * to lib/db/schema.ts. The server applies pending migrations itself on its
 * first query (lib/db/index.ts), so a deploy needs no separate step.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
