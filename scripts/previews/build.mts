// Builds the preview registry into public/_previews, outside Turbopack.
//
// registry/__index__.tsx lists ~900 previews, each a lazy import of a
// component and of its config. Turbopack compiles lazy imports up front, so
// with the index in the site's module graph the first request to any page
// with a preview compiled every preview. Bun bundles the same index in about
// 0.3 s, and the site loads the result by URL (lib/previews/index.ts): the
// browser from /_previews/, the server from the same files on disk.
//
// Development and production builds live in separate folders
// (public/_previews/dev and public/_previews/prod), so a running `bun dev`
// and a `bun run build` never overwrite each other's files.
//
//   bun scripts/previews/build.mts                development
//   bun scripts/previews/build.mts --production   minified
//   --prune      delete files left over from earlier builds
//   --port <n>   put the dev launcher's live channel port in the manifest
//   --json       print { version, elapsed, inputs } as one JSON line on stdout
//
// `bun dev` and `bun run build` run this for you.
import { createHash } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import type { BunPlugin } from "bun";
import {
  SHARED_GLOBAL,
  SHARED_MODULES,
} from "../../lib/previews/shared-modules";

const args = process.argv.slice(2);
const PRODUCTION = args.includes("--production");
const PRUNE = args.includes("--prune");
const JSON_OUTPUT = args.includes("--json");
const portArg = args.indexOf("--port");
const PORT = portArg === -1 ? undefined : Number(args[portArg + 1]);

const ROOT = resolve(import.meta.dir, "../..");
const MODE = PRODUCTION ? "prod" : "dev";
const OUT = join(ROOT, "public/_previews", MODE);
const PUBLIC_PATH = `/_previews/${MODE}/`;
const NAMES_FILE = join(ROOT, "registry/__names__.ts");

process.chdir(ROOT);

// A file appears under its name only once it is whole. The names are content
// hashes and "it exists" means "it is up to date", so a build cut short must
// not leave a half-written file behind under one.
const TMP = `.tmp-${process.pid}`;

const hash = (data: string | Uint8Array, length: number) =>
  createHash("sha256").update(data).digest("hex").slice(0, length);

const posix = (path: string) => path.replaceAll("\\", "/");

const sharedSeen = new Set<string>();

/** `react` and `remotion` come from the page, not from the bundle. */
const sharedPlugin: BunPlugin = {
  name: "remocn-shared",
  setup(build) {
    build.onResolve(
      { filter: /^(react|react-dom|remotion)(\/.*)?$/ },
      (args) => {
        sharedSeen.add(args.path);
        return { path: args.path, namespace: "remocn-shared" };
      },
    );
    build.onLoad({ filter: /.*/, namespace: "remocn-shared" }, (args) => ({
      contents: `module.exports = globalThis.${SHARED_GLOBAL}[${JSON.stringify(args.path)}];`,
      loader: "js",
    }));
  },
};

/** Files of this build, relative to OUT. Everything else there is left over. */
const current = new Set<string>();

/**
 * A CSS import (the templates' @fontsource files) becomes a module that adds
 * a <style> to the page. The files its `url()`s point at are copied next to
 * the bundle. On the server the module does nothing.
 */
const cssPlugin: BunPlugin = {
  name: "remocn-css",
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      let css = await readFile(args.path, "utf8");
      for (const [whole, , url] of css.matchAll(
        /url\((['"]?)(\.[^'")]+)\1\)/g,
      )) {
        const file = resolve(dirname(args.path), url);
        const ext = extname(file);
        const asset = `assets/${basename(file, ext)}-${hash(await readFile(file), 8)}${ext}`;
        const target = join(OUT, asset);
        current.add(asset);
        if (!existsSync(target)) {
          await mkdir(dirname(target), { recursive: true });
          await copyFile(file, `${target}${TMP}`);
          await rename(`${target}${TMP}`, target);
        }
        css = css.replace(whole, `url(${PUBLIC_PATH}${asset})`);
      }
      const id = hash(css, 10);
      return {
        contents: `if (typeof document !== "undefined" && !document.querySelector('style[data-remocn-preview="${id}"]')) {
  const style = document.createElement("style");
  style.dataset.remocnPreview = "${id}";
  style.textContent = ${JSON.stringify(css)};
  document.head.appendChild(style);
}`,
        loader: "js",
      };
    });
  },
};

const started = performance.now();

const result = await Bun.build({
  entrypoints: ["registry/__index__.tsx"],
  // One bundle for both sides. Node loads the browser build as it is: the
  // registry code has no server variant, and the shared modules come from
  // whichever side imports the bundle.
  target: "browser",
  format: "esm",
  splitting: true,
  minify: PRODUCTION,
  sourcemap: PRODUCTION ? "none" : "linked",
  metafile: true,
  naming: {
    entry: "entries.js",
    // Chunk names are content hashes: an unchanged chunk keeps its URL, so
    // the browser keeps the module, and a rebuild rewrites only what changed.
    chunk: PRODUCTION ? "chunks/[hash].js" : "chunks/[name]-[hash].js",
  },
  jsx: { runtime: "automatic", development: !PRODUCTION },
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      PRODUCTION ? "production" : "development",
    ),
  },
  plugins: [sharedPlugin, cssPlugin],
  throw: false,
});

// A failed build leaves the folder as it was: pages keep the last good bundle.
if (!result.success) {
  for (const log of result.logs) console.error(log);
  console.error("previews: build failed");
  process.exit(1);
}

const unknownShared = [...sharedSeen].filter(
  (id) => !(SHARED_MODULES as readonly string[]).includes(id),
);
if (unknownShared.length > 0) {
  console.error(
    `previews: the registry imports ${unknownShared.join(", ")}, which the page does not share with the preview bundle. Add it to lib/previews/shared-modules.ts and lib/previews/shared.ts.`,
  );
  process.exit(1);
}

// The entry is the one output Bun doesn't name by content. It gets its hash
// here, so that no file of the bundle ever changes under its URL.
const outputOf = (path: string) =>
  result.outputs.find((output) => posix(output.path) === `./${path}`);
const entrySource = (await outputOf("entries.js")?.text()) ?? "";
const version = hash(entrySource, 12);
const entry = `entries-${version}.js`;

// Renaming the entry is safe only while no chunk imports it back.
const importsEntry = Object.entries(result.metafile?.outputs ?? {}).find(
  ([, output]) =>
    output.imports.some((imported) => /(^|\/)entries\.js$/.test(imported.path)),
);
if (importsEntry) {
  console.error(
    `previews: ${importsEntry[0]} imports the entry file, which this script renames. Give shared code a module of its own, or stop renaming the entry.`,
  );
  process.exit(1);
}

let written = 0;
async function write(path: string, text: string) {
  const target = join(OUT, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(`${target}${TMP}`, text);
  await rename(`${target}${TMP}`, target);
  written++;
}

await Promise.all(
  result.outputs.map(async (output) => {
    const path = posix(output.path).replace(/^\.\//, "");
    if (path === "entries.js") {
      current.add(entry);
      if (existsSync(join(OUT, entry))) return;
      return write(
        entry,
        entrySource.replace(
          "sourceMappingURL=entries.js.map",
          `sourceMappingURL=${entry}.map`,
        ),
      );
    }
    if (path === "entries.js.map") {
      current.add(`${entry}.map`);
      if (existsSync(join(OUT, `${entry}.map`))) return;
      return write(`${entry}.map`, await output.text());
    }
    current.add(path);
    const target = join(OUT, path);
    if (existsSync(target)) {
      // A chunk's name is its content hash: a file that exists is up to date.
      if (!path.endsWith(".map")) return;
      // Its source map is not part of that hash: an edit to a comment moves
      // the mappings and keeps the chunk.
      if (statSync(target).size === output.size) return;
    }
    return write(path, await output.text());
  }),
);

const { default: registry } = await import("../../registry/__index__");

// The chunks behind each preview: its config, its component and everything
// those import. The server names them in the page's HTML, so the browser
// fetches them together and early instead of one import level at a time.
const outputs = result.metafile?.outputs ?? {};
const chunkOf = new Map(
  Object.entries(outputs).flatMap(([path, output]) =>
    output.entryPoint ? [[posix(output.entryPoint), path] as const] : [],
  ),
);
const files: string[] = [];
const fileIndex = new Map<string, number>();
const previews: Record<string, number[]> = {};
const unmapped = new Set<string>();
for (const [name, loaders] of Object.entries(registry)) {
  const needed = new Set<string>();
  for (const loader of [loaders.loadConfig, loaders.load]) {
    // Each loader is `() => import("<module>").then(…)`.
    const specifier = /import\(\s*["']([^"']+)["']\s*\)/.exec(`${loader}`)?.[1];
    const chunk =
      specifier &&
      chunkOf.get(
        posix(
          relative(ROOT, Bun.resolveSync(specifier, join(ROOT, "registry"))),
        ),
      );
    if (!chunk) {
      unmapped.add(name);
      continue;
    }
    const queue = [chunk];
    for (const path of queue) {
      if (needed.has(path)) continue;
      needed.add(path);
      for (const imported of outputs[path]?.imports ?? []) {
        if (imported.kind === "import-statement") queue.push(imported.path);
      }
    }
  }
  previews[name] = [...needed].map((path) => {
    const file = posix(path).replace(/^\.\//, "");
    let index = fileIndex.get(file);
    if (index === undefined) {
      index = files.push(file) - 1;
      fileIndex.set(file, index);
    }
    return index;
  });
}
if (unmapped.size > 0) {
  console.error(
    `previews: could not tell which module these entries of registry/__index__.tsx import, so their pages won't preload them: ${[...unmapped].join(", ")}`,
  );
}

// The site reads the manifest first and everything else by the names in it,
// so it goes last and in one step: a reader never sees a manifest whose
// files are still being written.
const previous = await readFile(join(OUT, "manifest.json"), "utf8")
  .then((text): { entry?: string } => JSON.parse(text))
  .catch(() => ({ entry: undefined }));
await Promise.all([
  // Node imports these files too, and the repo's package.json is not ESM.
  writeFile(join(OUT, "package.json"), '{ "type": "module" }\n'),
  writeFile(
    join(OUT, "preload.json"),
    `${JSON.stringify({ version, files, previews })}\n`,
  ),
]);
await writeFile(
  join(OUT, `manifest.json${TMP}`),
  `${JSON.stringify({ version, entry, ...(PORT ? { port: PORT } : {}) })}\n`,
);
await rename(join(OUT, `manifest.json${TMP}`), join(OUT, "manifest.json"));

// Left-overs. Always: entries older than the previous one, which a page that
// is loading right now may still ask for. With --prune: every file this
// build did not produce. The bundle is already published, so a failure here
// is not a failed build.
const keep = new Set([
  ...current,
  "manifest.json",
  "preload.json",
  "package.json",
]);
// Under --prune the previous entry's chunks go, so the entry goes with them.
if (previous.entry && !PRUNE) {
  keep.add(previous.entry).add(`${previous.entry}.map`);
}
let removed = 0;
try {
  const stale = (await readdir(OUT, { recursive: true }))
    .map(posix)
    .filter((path) => {
      if (extname(path) === "" || keep.has(path)) return false;
      // Another build's file in the making, unless it was abandoned.
      if (/\.tmp-\d+$/.test(path)) {
        return Date.now() - statSync(join(OUT, path)).mtimeMs > 60_000;
      }
      return PRUNE || path.startsWith("entries-");
    });
  await Promise.all(stale.map((path) => rm(join(OUT, path), { force: true })));
  removed = stale.length;
} catch (error) {
  console.error("previews: could not remove left-over files:", error);
}

// The site needs the names without loading the bundle: to tell an unknown
// preview from a known one while rendering on the server.
const names = `// GENERATED FILE — do not edit by hand.
// Written by scripts/previews/build.mts (\`bun dev\`, \`bun run build\`,
// \`bun run previews:build\`) from the keys of registry/__index__.tsx.

export const previewNames = [
${Object.keys(registry)
  .map((name) => `  ${JSON.stringify(name)},`)
  .join("\n")}
] as const;
`;
if (!existsSync(NAMES_FILE) || (await readFile(NAMES_FILE, "utf8")) !== names) {
  await writeFile(NAMES_FILE, names);
}

const inputs = Object.keys(result.metafile?.inputs ?? {})
  .map((path) => posix(relative(ROOT, resolve(ROOT, path))))
  .filter(
    (path) =>
      !path.startsWith("..") &&
      !path.includes("node_modules") &&
      !path.includes(":"),
  );

const elapsed = Math.round(performance.now() - started);
if (JSON_OUTPUT) {
  console.log(JSON.stringify({ version, written, elapsed, inputs }));
} else {
  console.log(
    `previews: ${Object.keys(registry).length} entries, ${written} files written, ${removed} removed, ${elapsed} ms (${PRODUCTION ? "production" : "development"}, version ${version})`,
  );
}
