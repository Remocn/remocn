---
name: setup
description: >
  Make a Remotion project ready for `npx shadcn add @remocn/<name>`: add the @remocn registry to
  components.json, the @/* path to tsconfig.json and the same alias to remotion.config.ts. Use
  before the first remocn component is installed into a project, or when shadcn add or the Remotion
  bundler can't resolve a remocn import.
---

# Prepare a Remotion project for remocn

Project root: $ARGUMENTS (the current folder when empty)

`shadcn init` refuses a Remotion project ("could not detect a supported framework"), and Remotion's
bundler doesn't read tsconfig paths. So a fresh project needs three small edits before the first
component lands. Make them yourself with your file tools, in this order. Skip each one the project
already has.

## 0. Check the project

Read `package.json` in the project root.

- No `package.json`: stop and say so.
- No `remotion` in `dependencies` or `devDependencies`: it isn't a Remotion project. Stop and say so.
  The `video` skill creates one with `npx create-video@latest --yes --blank <folder>`.

In a project the user already had, list the files from the steps below that you will touch and ask
before editing them.

## 1. `components.json`

- **Missing:** create it with exactly this content:

  ```json
  {
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "new-york",
    "rsc": false,
    "tsx": true,
    "tailwind": { "config": "", "css": "", "baseColor": "neutral", "cssVariables": false },
    "aliases": {
      "components": "@/components",
      "utils": "@/lib/utils",
      "ui": "@/components/ui",
      "lib": "@/lib",
      "hooks": "@/hooks"
    },
    "registries": { "@remocn": "https://remocn.dev/r/{name}.json" }
  }
  ```

- **Present, no `registries["@remocn"]`:** add `"@remocn": "https://remocn.dev/r/{name}.json"` to
  `registries`, creating the object if needed. Leave every other field as it is.
- **Already has `@remocn`:** leave it.

## 2. The `@/*` path in `tsconfig.json`

remocn components import each other through `@/`, so TypeScript has to resolve it. `tsconfig.json`
may hold comments and trailing commas: edit it in place and keep them.

Work out **the alias folder**, the folder `@/` points at, relative to the project root. You need it
in step 3.

- **`compilerOptions.paths["@/*"]` exists:** leave the file. The alias folder is its first entry
  without the trailing `/*` (`./src/*` → `src`), resolved against `compilerOptions.baseUrl` when one
  is set, else against the folder of `tsconfig.json`.
- **The file has `extends` and no `paths` of its own:** a local `paths` would replace the inherited
  map, not merge with it. Open the config it extends (one level, relative paths only). If that one
  has `@/*`, leave both files and take the alias folder from there, resolved against the parent's
  folder. If it doesn't, don't edit: tell the user to add `"@/*": ["./src/*"]` where their paths are
  defined, and use `src` as the alias folder.
- **Otherwise:** add `"@/*": ["./src/*"]` to `compilerOptions.paths`, creating `paths` if needed and
  keeping existing entries. With a `baseUrl` other than `.`, write the path to `src` relative to the
  `baseUrl` instead. The alias folder is `src`.
- **No `tsconfig.json`:** don't create one. The alias folder is `src`.

## 3. The `@` alias in `remotion.config.ts`

The bundler needs the same alias. Look for `remotion.config.ts`, then `remotion.config.js`, in the
project root. If the file already contains `withRemocnAlias`, leave it.

The alias target is `path.join(process.cwd(), "<alias folder>")`, or `process.cwd()` when the alias
folder is the project root itself.

- **No config file:** create `remotion.config.ts` with the imports and the block below.
- **`remotion.config.ts` exists:** add `import path from "node:path";` and
  `import { Config } from "@remotion/cli/config";` at the top unless they're already imported, then
  append the block at the end of the file.
- **`remotion.config.js` exists:** append the same block without the type annotations
  (`const withRemocnAlias = (config) => ({ ... })` and `config.resolve?.alias ?? {}`), and the same
  two imports if missing.

```ts
// remocn components import each other through the "@/" alias in components.json.
// Bundlers don't read tsconfig paths, so the alias is resolved here as well.
// Both overrides are deliberate: the Remotion CLI applies overrideBundlerConfig
// with webpack and rspack alike, while Remocn Studio's preview reads only
// overrideWebpackConfig. Both run from the project root, which process.cwd()
// points at.
const withRemocnAlias = <C extends { resolve?: object }>(config: C): C => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...((config.resolve as { alias?: object } | undefined)?.alias ?? {}),
      "@": path.join(process.cwd(), "src"),
    },
  },
});
// overrideBundlerConfig only exists in newer Remotion 4 releases.
if (typeof Config.overrideBundlerConfig === "function") {
  Config.overrideBundlerConfig(withRemocnAlias);
}
Config.overrideWebpackConfig(withRemocnAlias);
```

Replace `path.join(process.cwd(), "src")` with the alias target from above when they differ.

## 4. Report

Tell the user, in a few lines, what each step did: created, changed or left as it was, plus anything
they have to add by hand. Then `npx shadcn@latest add @remocn/<name>` works in the project.
