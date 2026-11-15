// The site's handle on the preview registry.
//
// registry/__index__.tsx lists ~900 previews, each a lazy import of a
// component and of its config. Turbopack compiles lazy imports up front, so
// with that index in the site's module graph the first request to any page
// with a preview compiled every preview. The index is built on its own
// instead (scripts/previews/build.mts, into public/_previews) and this module
// loads the result by URL at runtime: the browser from /_previews/, the
// server from the same files on disk.
//
// Site code imports this module and never registry/__index__ itself;
// lib/docs-meta.test.ts enforces it. It has the same exports.

import { preloadModule } from "react-dom";
import type { ResolvedComponentConfig } from "@/lib/customizer-config";
import type { RegistryEntry } from "@/registry/__index__";
import { previewNames } from "@/registry/__names__";
import { registerShared } from "./shared";

export type { RegistryEntry };

/** What registry/__index__.tsx exports, as built into public/_previews. */
export type PreviewBundle = typeof import("@/registry/__index__");

const SERVER = typeof window === "undefined";

// Development and production bundles are separate folders, so `bun dev` and
// `bun run build` don't overwrite each other's files.
const MODE = process.env.NODE_ENV === "development" ? "dev" : "prod";
const BASE = `/_previews/${MODE}`;

/** The bundle `next build` ran against (next.config.ts). Unused in dev. */
const BUILD_VERSION = process.env.REMOCN_PREVIEWS_VERSION ?? "";

const MISSING =
  "The preview bundle is missing or stale. `bun dev` and `bun run build` build it into public/_previews; `bun run previews:build` does only that.";

/** The bundle's entry file. Its name carries the hash of its content. */
const entryFile = (version: string) => `entries-${version}.js`;

let active: { version: string; bundle: Promise<PreviewBundle> } | undefined;
let verified = false;

if (process.env.NODE_ENV === "development" && !SERVER) {
  // Fast Refresh ran this module again: the list of previews changed, or this
  // file did. The previews on the page hang off the state of the first run,
  // which a second run can't take over, so start the page afresh.
  const page = globalThis as { __remocnPreviewsLoaded?: boolean };
  if (page.__remocnPreviewsLoaded) location.reload();
  page.__remocnPreviewsLoaded = true;
}

/** Server: where the bundle is on disk. */
function bundlePath(file: string): string {
  const { join } = process.getBuiltinModule("node:path");
  return join(process.cwd(), "public", "_previews", MODE, file);
}

/** Server: the version of the bundle on disk. */
function serverVersion(): string {
  if (verified) return BUILD_VERSION;
  const { readFileSync } = process.getBuiltinModule("node:fs");
  let manifest: { version: string };
  try {
    manifest = JSON.parse(readFileSync(bundlePath("manifest.json"), "utf8"));
  } catch (cause) {
    throw new Error(MISSING, { cause });
  }
  // The dev launcher rebuilds the bundle while the server runs.
  if (process.env.NODE_ENV === "development") return manifest.version;
  if (manifest.version !== BUILD_VERSION) {
    throw new Error(
      "public/_previews/prod is not the bundle this build of the site was made with: it was rebuilt after `next build`. Run `bun run build`.",
    );
  }
  verified = true;
  return BUILD_VERSION;
}

function importBundle(version: string): Promise<PreviewBundle> {
  registerShared();
  const url = SERVER
    ? process
        .getBuiltinModule("node:url")
        .pathToFileURL(bundlePath(entryFile(version))).href
    : `${BASE}/${entryFile(version)}`;
  return import(/* turbopackIgnore: true */ url).catch((cause) => {
    throw new Error(MISSING, { cause });
  });
}

function activate(version: string): Promise<PreviewBundle> {
  if (active?.version !== version) {
    const bundle = importBundle(version);
    active = { version, bundle };
    // In dev the server outlives a rebuild: its cached configs are old now.
    if (SERVER) configs.clear();
    // A bundle that failed to load is asked for again, not remembered.
    bundle.catch(() => {
      if (active?.bundle === bundle) active = undefined;
    });
  }
  return active.bundle;
}

let hot: typeof import("./hot") | undefined;
let starting: Promise<void> | undefined;
let swapping: Promise<void> = Promise.resolve();

function loadBundle(): Promise<PreviewBundle> {
  if (SERVER) return activate(serverVersion());
  if (process.env.NODE_ENV === "development") {
    // The dev launcher (scripts/dev.mts) rebuilds the bundle on every save,
    // so the page asks which one is current and listens for the next.
    starting ??= import("./hot")
      .then(async (module) => {
        hot = module;
        activate(await module.connect(swap));
      })
      .catch((error) => {
        // Not for good: the next preview to load asks again.
        starting = undefined;
        throw error;
      });
    return (
      starting
        // A rebuild being applied right now: hand out the bundle it brings.
        .then(() => swapping)
        .then(() => (active as NonNullable<typeof active>).bundle)
    );
  }
  return activate(BUILD_VERSION);
}

function entryOf(bundle: PreviewBundle, name: string): RegistryEntry {
  const entry = bundle.default[name];
  if (!entry) {
    throw new Error(`Preview "${name}" is not in the built bundle. ${MISSING}`);
  }
  return entry;
}

function serverLoad(): Promise<never> {
  return Promise.reject(
    new Error(
      "previews: load() is browser-only. A Remotion <Player lazyComponent={load}> rendered on the server calls it there: mount such a Player after hydration, as the docs stage and the component cards do.",
    ),
  );
}

async function browserLoad(name: string) {
  for (;;) {
    const bundle = await loadBundle();
    const version = active?.version;
    const module = await entryOf(bundle, name).load();
    if (!hot) return module;
    // Dev: a rebuild landed while the component was loading. This one is
    // already old, and the swap has passed over a preview it didn't know yet.
    if (active?.version !== version) continue;
    // A stand-in that renders whatever the latest rebuild holds.
    return { default: hot.hotComponent(name, module.default) };
  }
}

const registry: Record<string, RegistryEntry> = Object.fromEntries(
  previewNames.map((name): [string, RegistryEntry] => [
    name,
    {
      // Previews only mount in the browser. Rejecting on the server keeps a
      // misplaced Player loud (the prerender fails) instead of an empty frame.
      load: SERVER ? serverLoad : () => browserLoad(name),
      loadConfig: async () => entryOf(await loadBundle(), name).loadConfig(),
    },
  ]),
);

const configs = new Map<string, Promise<ResolvedComponentConfig>>();
/** Dev: each loaded config as its module exports it, to tell which ones a rebuild changed. */
const rawConfigs = new Map<string, unknown>();

export function loadComponentConfig(
  slug: string,
): Promise<ResolvedComponentConfig> {
  if (!registry[slug]) throw new Error(`Unknown registry entry: ${slug}`);
  // Before the cache: on the server this is what notices a rebuilt bundle.
  const bundle = loadBundle();
  if (SERVER && active) hintPreview(slug, active.version);
  let promise = configs.get(slug);
  if (!promise) {
    promise = bundle.then((loaded) => {
      if (hot) {
        entryOf(loaded, slug)
          .loadConfig()
          .then((raw) => rawConfigs.set(slug, raw));
      }
      return loaded.loadComponentConfig(slug);
    });
    configs.set(slug, promise);
    // The same for a config: a later render gets a fresh attempt.
    const attempt = promise;
    attempt.catch(() => {
      if (configs.get(slug) === attempt) configs.delete(slug);
    });
  }
  return promise;
}

let preloads:
  | { version: string; files: string[]; previews: Record<string, number[]> }
  | undefined;

/**
 * Server: names the files of a preview in the page's HTML as
 * `<link rel="modulepreload">`. The browser then fetches them together while
 * it parses the page. Without the hints it would start after hydration and
 * find the chunks one import level at a time.
 */
function hintPreview(slug: string, version: string) {
  if (preloads?.version !== version) {
    const { readFileSync } = process.getBuiltinModule("node:fs");
    try {
      preloads = JSON.parse(readFileSync(bundlePath("preload.json"), "utf8"));
    } catch {
      // Hints only: the preview loads without them.
    }
    if (preloads?.version !== version) {
      preloads = { version, files: [], previews: {} };
    }
  }
  preloadModule(`${BASE}/${entryFile(version)}`, { as: "script" });
  for (const index of preloads.previews[slug] ?? []) {
    preloadModule(`${BASE}/${preloads.files[index]}`, { as: "script" });
  }
}

const listeners = new Set<() => void>();
let revision = 0;

/**
 * Calls `listener` after a rebuilt bundle replaced what the page had loaded.
 * Only ever fires in dev.
 */
export function onPreviewsUpdate(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** How many rebuilt bundles the page has taken in. Stays 0 outside dev. */
export function previewsRevision(): number {
  return revision;
}

/** Dev: a rebuilt bundle is out. Replace what the page loaded from the old one. */
function swap(version: string) {
  swapping = swapping
    .then(async () => {
      if (!hot || !active || active.version === version) return;
      const bundle = await importBundle(version);
      // From here on a preview that loads gets the new bundle; one that is
      // loading from the old bundle sees the version move and loads again.
      active = { version, bundle: Promise.resolve(bundle) };
      await hot.reload(bundle);
      for (const slug of [...configs.keys()]) {
        try {
          const fresh = await bundle.default[slug]?.loadConfig();
          // Unchanged chunks keep their URL, so an unchanged config is the
          // same object and its consumers are left alone.
          if (fresh === undefined || fresh === rawConfigs.get(slug)) continue;
          rawConfigs.set(slug, fresh);
          configs.set(slug, bundle.loadComponentConfig(slug));
        } catch (error) {
          console.error(`[previews] config of "${slug}" failed to load`, error);
        }
      }
      revision++;
      for (const listener of listeners) listener();
    })
    .catch((error) => {
      console.error("[previews] could not apply the rebuilt bundle", error);
    });
}

export default registry;
