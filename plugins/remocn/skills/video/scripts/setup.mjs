#!/usr/bin/env node
// Makes a Remotion project ready for `npx shadcn add @remocn/<name>`.
//
//   node setup.mjs [dir]
//
// `shadcn init` refuses a Remotion project ("could not detect a supported
// framework"), and Remotion's bundler doesn't read tsconfig paths, so a fresh
// project needs three small edits before the first component lands. Each one is
// skipped when the project already has it. Prints one JSON report on stdout.

import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

const REGISTRY = "https://remocn.dev/r/{name}.json";
const ALIAS_MARKER = "withRemocnAlias";
const CONFIG_FILES = ["remotion.config.ts", "remotion.config.js"];

const COMPONENTS_JSON = {
  $schema: "https://ui.shadcn.com/schema.json",
  style: "new-york",
  rsc: false,
  tsx: true,
  tailwind: { config: "", css: "", baseColor: "neutral", cssVariables: false },
  aliases: {
    components: "@/components",
    utils: "@/lib/utils",
    ui: "@/components/ui",
    lib: "@/lib",
    hooks: "@/hooks",
  },
  registries: { "@remocn": REGISTRY },
};

const ALIAS_BLOCK = (target) => `
// remocn components import each other through the "@/" alias in components.json.
// Bundlers don't read tsconfig paths, so the alias is resolved here as well.
// Both overrides are deliberate: the Remotion CLI applies overrideBundlerConfig
// with webpack and rspack alike, while Remocn Studio's preview reads only
// overrideWebpackConfig. Both run from the project root, which process.cwd()
// points at.
const ${ALIAS_MARKER} = <C extends { resolve?: object }>(config: C): C => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...((config.resolve as { alias?: object } | undefined)?.alias ?? {}),
      "@": ${target},
    },
  },
});
// overrideBundlerConfig only exists in newer Remotion 4 releases.
if (typeof Config.overrideBundlerConfig === "function") {
  Config.overrideBundlerConfig(${ALIAS_MARKER});
}
Config.overrideWebpackConfig(${ALIAS_MARKER});
`;

// tsconfig.json is JSONC. Drop comments and trailing commas without touching
// anything inside a string ("https://..." must survive).
function parseJsonc(text) {
  let out = "";
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (inString) {
      out += char;
      if (char === "\\") {
        out += next;
        i++;
      } else if (char === '"') {
        inString = false;
      }
    } else if (char === '"') {
      inString = true;
      out += char;
    } else if (char === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
    } else if (char === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i++;
    } else {
      out += char;
    }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}

async function readJson(path, jsonc = false) {
  const text = await readFile(path, "utf8");
  return jsonc ? parseJsonc(text) : JSON.parse(text);
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function ensureComponentsJson(dir) {
  const path = join(dir, "components.json");
  if (!existsSync(path)) {
    await writeJson(path, COMPONENTS_JSON);
    return { path, action: "created" };
  }
  const config = await readJson(path);
  if (config.registries?.["@remocn"]) {
    return { path, action: "unchanged" };
  }
  config.registries = { ...config.registries, "@remocn": REGISTRY };
  await writeJson(path, config);
  return { path, action: "added @remocn registry" };
}

// The folder a tsconfig's "@/*" path points at, relative to the project root.
// Paths resolve against baseUrl when it is set, else against the config's own
// folder.
function aliasBase(dir, configDir, compilerOptions) {
  const target = compilerOptions?.paths?.["@/*"]?.[0];
  if (typeof target !== "string") {
    return null;
  }
  const absolute = resolve(
    configDir,
    compilerOptions.baseUrl ?? ".",
    target.replace(/\/?\*$/, ""),
  );
  return relative(dir, absolute).split(sep).join("/") || ".";
}

// Follows one level of a relative `extends`, which is how Remotion and most
// app templates use it.
async function inheritedOptions(dir, config) {
  const parent = config.extends;
  if (typeof parent !== "string" || !parent.startsWith(".")) {
    return null;
  }
  const file = resolve(
    dir,
    parent.endsWith(".json") ? parent : `${parent}.json`,
  );
  try {
    const base = await readJson(file, true);
    return { configDir: dirname(file), compilerOptions: base.compilerOptions };
  } catch {
    return null;
  }
}

async function ensureTsconfigPaths(dir) {
  const path = join(dir, "tsconfig.json");
  if (!existsSync(path)) {
    return { path, action: "missing", base: "src" };
  }
  let config;
  try {
    config = await readJson(path, true);
  } catch (error) {
    return {
      path,
      action: "unreadable",
      base: "src",
      warning: `could not parse tsconfig.json (${error.message}) — add "paths": { "@/*": ["./src/*"] } by hand`,
    };
  }

  const own = aliasBase(dir, dir, config.compilerOptions);
  if (own !== null) {
    return { path, action: "unchanged", base: own };
  }

  if (
    config.extends !== undefined &&
    config.compilerOptions?.paths === undefined
  ) {
    // A local `paths` would replace the inherited map, not merge with it.
    const parent = await inheritedOptions(dir, config);
    const inherited = parent
      ? aliasBase(dir, parent.configDir, parent.compilerOptions)
      : null;
    if (inherited !== null) {
      return { path, action: "unchanged (inherited)", base: inherited };
    }
    return {
      path,
      action: "skipped",
      base: "src",
      warning: `tsconfig.json extends ${JSON.stringify(config.extends)}, and a local "paths" would replace the inherited ones — add "@/*": ["./src/*"] where the paths are defined`,
    };
  }

  // With a baseUrl, paths resolve against it rather than the config's folder.
  const baseUrl = config.compilerOptions?.baseUrl;
  const src = baseUrl
    ? relative(resolve(dir, baseUrl), resolve(dir, "src")).split(sep).join("/")
    : "src";
  const target = src === "" ? "." : src.startsWith(".") ? src : `./${src}`;
  config.compilerOptions = {
    ...config.compilerOptions,
    paths: { ...config.compilerOptions?.paths, "@/*": [`${target}/*`] },
  };
  // Rewriting drops any comments the file had; say so rather than hide it.
  await writeJson(path, config);
  return {
    path,
    action: "added @/* path",
    base: "src",
    note: "tsconfig.json was rewritten as plain JSON",
  };
}

async function ensureBundlerAlias(dir, base) {
  const target =
    base === "."
      ? "process.cwd()"
      : `path.join(process.cwd(), ${JSON.stringify(base)})`;
  const existing = CONFIG_FILES.map((name) => join(dir, name)).find((file) =>
    existsSync(file),
  );

  if (existing === undefined) {
    const path = join(dir, "remotion.config.ts");
    await writeFile(
      path,
      `import path from "node:path";\nimport { Config } from "@remotion/cli/config";\n${ALIAS_BLOCK(target)}`,
      "utf8",
    );
    return { path, action: "created" };
  }

  const source = await readFile(existing, "utf8");
  if (source.includes(ALIAS_MARKER)) {
    return { path: existing, action: "unchanged" };
  }
  if (existing.endsWith(".js")) {
    return {
      path: existing,
      action: "skipped",
      warning: `remotion.config.js is JavaScript — add an "@" alias to ${target} through Config.overrideBundlerConfig and Config.overrideWebpackConfig by hand`,
    };
  }

  const hasPath =
    /import\s+(\*\s+as\s+)?path\s+from\s+["'](node:)?path["']/.test(source);
  const hasConfig =
    /import\s*\{[^}]*\bConfig\b[^}]*\}\s*from\s*["']@remotion\/cli\/config["']/.test(
      source,
    );
  const header = [
    hasPath ? null : 'import path from "node:path";',
    hasConfig ? null : 'import { Config } from "@remotion/cli/config";',
  ]
    .filter(Boolean)
    .join("\n");

  await writeFile(
    existing,
    `${header ? `${header}\n` : ""}${source.trimEnd()}\n${ALIAS_BLOCK(target)}`,
    "utf8",
  );
  return { path: existing, action: "added @ alias" };
}

const dir = resolve(process.argv[2] ?? ".");
const pkgPath = join(dir, "package.json");

if (!existsSync(pkgPath)) {
  process.stdout.write(
    `${JSON.stringify({ ok: false, reason: `${dir} has no package.json` }, null, 2)}\n`,
  );
  process.exit(1);
}

const pkg = await readJson(pkgPath);
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
if (!deps.remotion) {
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: false,
        reason: `${dir} is not a Remotion project — create one with \`npx create-video@latest --yes --blank <folder>\``,
      },
      null,
      2,
    )}\n`,
  );
  process.exit(1);
}

const components = await ensureComponentsJson(dir);
const tsconfig = await ensureTsconfigPaths(dir);
const bundler = await ensureBundlerAlias(dir, tsconfig.base);

process.stdout.write(
  `${JSON.stringify({ ok: true, dir, components, tsconfig, bundler }, null, 2)}\n`,
);
