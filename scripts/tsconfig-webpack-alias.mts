import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Translate the project's `tsconfig.json` `compilerOptions.paths` into a webpack
 * `resolve.alias` ARRAY that the Remotion bundler (plain webpack — it doesn't
 * read tsconfig) can honour.
 *
 * Why this is needed: a flat `{ "@": root }` alias only covers the catch-all
 * `@/* → ./*`. The registry uses far more specific mappings — e.g.
 *   "@/lib/remocn-ui"            -> registry/remocn-ui/core/index.ts
 *   "@/components/remocn/<name>" -> registry/remocn-ui/<name>/index.tsx
 *   "@/components/remocn/use-button-transition" -> button/use-button-transition.ts
 * which a bare `@`-alias resolves to non-existent paths under `lib/`/`components/`.
 *
 * Webpack alias semantics we lean on:
 *  - ARRAY form preserves order → first match wins, so we emit most-specific
 *    first (exact mappings, then prefixes, longest name first, catch-all last).
 *  - `onlyModule: true` ⇒ the request must equal `name` exactly (tsconfig's
 *    no-wildcard keys); prefix entries rewrite `name/<rest>` → `target/<rest>`.
 *  - A prefix that points at a directory (e.g. `@/components/remocn`) relies on
 *    webpack's directory-index resolution to find `<dir>/<name>/index.tsx`.
 */

interface AliasItem {
  name: string;
  alias: string;
  onlyModule: boolean;
}

export function tsconfigWebpackAlias(root: string): AliasItem[] {
  const tsconfig = JSON.parse(
    readFileSync(path.join(root, "tsconfig.json"), "utf8"),
  );
  const paths: Record<string, string[]> = tsconfig.compilerOptions?.paths ?? {};
  const baseUrl: string = tsconfig.compilerOptions?.baseUrl ?? ".";
  const base = path.resolve(root, baseUrl);

  const exact: AliasItem[] = [];
  const prefix: AliasItem[] = [];

  for (const [key, targets] of Object.entries(paths)) {
    const target = targets[0];
    if (!target) continue;

    if (key.includes("*")) {
      // Wildcard key: map the literal segment before the `*` to the literal
      // segment of the target before ITS `*` (a directory we prefix-rewrite into).
      const name = key.slice(0, key.indexOf("*")).replace(/\/$/, "");
      const targetDir = target.slice(0, target.indexOf("*")).replace(/\/$/, "");
      prefix.push({
        name,
        alias: path.resolve(base, targetDir),
        onlyModule: false,
      });
    } else {
      // Exact key: resolve straight to the file.
      exact.push({
        name: key,
        alias: path.resolve(base, target),
        onlyModule: true,
      });
    }
  }

  const byNameLenDesc = (a: AliasItem, b: AliasItem) =>
    b.name.length - a.name.length;
  exact.sort(byNameLenDesc);
  prefix.sort(byNameLenDesc);

  // Exact before prefix; within each, longest name first. Catch-all `@` (from
  // `@/*`) is the shortest prefix, so it naturally lands last.
  return [...exact, ...prefix];
}
