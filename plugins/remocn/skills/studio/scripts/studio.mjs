#!/usr/bin/env node
// Hands a Remotion project over to Remocn Studio (https://remocn.studio).
//
//   node studio.mjs init [dir] [--name "Launch video"]
//   node studio.mjs detect
//   node studio.mjs open [dir]
//
// Every command prints one JSON object on stdout, so the agent reads the outcome
// instead of parsing prose. Nothing here needs a dependency beyond Node itself.

import { execFileSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir, platform } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const BUNDLE_ID = "com.remocn.remocn-studio";
const SCHEME = "remocn-studio";
const DOWNLOAD_URL = "https://remocn.studio";
const RELEASES_URL = "https://github.com/Remocn/remocn-studio/releases/latest";

// First Studio release that understands `remocn-studio://open-project`. Until it
// ships this stays null and `open` launches Studio and explains Open Folder (⌘O)
// instead — an older Studio answers an unknown route with an error dialog.
const OPEN_PROJECT_SINCE = null;

// `.remocn/project.json` belongs to Studio (shared/project-config.ts there).
// Write only what schemaVersion 1 accepts, and never touch an existing file:
// its projectId is the project's identity in Studio's history.
const MANIFEST = join(".remocn", "project.json");
const SCHEMA_VERSION = 1;

// The scan Studio itself places in src/videos/. A byte-identical copy is one
// Studio recognises as its own and leaves alone.
const REGISTRY_FILE = "registry.tsx";
const REGISTRY_EXPORT = "withVideos";
const REGISTRY_TEMPLATE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "assets",
  REGISTRY_FILE,
);

// The precedence Remotion's own CLI uses; the first one that exists is the entry.
const ENTRY_CANDIDATES = [
  "src/index.ts",
  "src/index.tsx",
  "src/index.js",
  "src/index.mjs",
  "remotion/index.tsx",
  "remotion/index.ts",
  "remotion/index.js",
  "remotion/index.mjs",
  "src/remotion/index.tsx",
  "src/remotion/index.ts",
  "src/remotion/index.js",
  "src/remotion/index.mjs",
];

const REGISTER = /registerRoot\(\s*([A-Za-z_$][\w$]*)\s*\)/g;
// A whole import statement, including one that spans lines: everything up to
// its module specifier, plus an optional semicolon.
const IMPORT = /^import\b[\s\S]*?["'][^"'\n]+["'][ \t]*;?/gm;

// The source with every comment blanked to spaces, newlines kept, so offsets
// found in it are offsets in the original. A `registerRoot(Old)` in a comment
// must not be mistaken for the real call.
function withoutComments(source) {
  let out = "";
  let quote = null;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    const next = source[i + 1];
    if (quote !== null) {
      out += char;
      if (char === "\\" && i + 1 < source.length) {
        out += next;
        i++;
      } else if (char === quote) {
        quote = null;
      }
    } else if (char === '"' || char === "'" || char === "`") {
      quote = char;
      out += char;
    } else if (char === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") {
        out += " ";
        i++;
      }
      if (i < source.length) out += "\n";
    } else if (char === "/" && next === "*") {
      out += "  ";
      i += 2;
      while (
        i < source.length &&
        !(source[i] === "*" && source[i + 1] === "/")
      ) {
        out += source[i] === "\n" ? "\n" : " ";
        i++;
      }
      if (i < source.length) {
        out += "  ";
        i++;
      }
    } else {
      out += char;
    }
  }
  return out;
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = {};
  const positional = [];
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg.startsWith("--")) {
      flags[arg.slice(2)] = rest[i + 1];
      i++;
    } else {
      positional.push(arg);
    }
  }
  return { command, flags, dir: resolve(positional[0] ?? ".") };
}

function print(result) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

// ---------------------------------------------------------------------------
// init — make the folder one Studio can open as-is
// ---------------------------------------------------------------------------

async function init(dir, name) {
  if (!existsSync(join(dir, "package.json"))) {
    return {
      ok: false,
      reason: `${dir} has no package.json — run this from the Remotion project root`,
    };
  }

  const manifest = await ensureManifest(dir, name);
  const registry = await ensureRegistry(dir);

  return { ok: registry.ok, dir, manifest, registry };
}

async function ensureManifest(dir, name) {
  const path = join(dir, MANIFEST);

  if (existsSync(path)) {
    try {
      const existing = JSON.parse(await readFile(path, "utf8"));
      return { path, written: false, projectId: existing.projectId };
    } catch {
      return {
        path,
        written: false,
        warning: "the existing manifest is not valid JSON — left untouched",
      };
    }
  }

  const config = {
    schemaVersion: SCHEMA_VERSION,
    projectId: randomUUID(),
    name: (name ?? (await defaultName(dir))).trim() || basename(dir),
    revision: 0,
    brand: null,
  };

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return { path, written: true, projectId: config.projectId };
}

async function defaultName(dir) {
  try {
    const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
    if (typeof pkg.name === "string" && pkg.name.trim().length > 0) {
      return pkg.name;
    }
  } catch {}
  return basename(dir);
}

async function ensureRegistry(dir) {
  const registry = join(dir, "src", "videos", REGISTRY_FILE);
  let placed = false;

  if (!existsSync(registry)) {
    await mkdir(dirname(registry), { recursive: true });
    await writeFile(
      registry,
      await readFile(REGISTRY_TEMPLATE, "utf8"),
      "utf8",
    );
    placed = true;
  }

  const entry = ENTRY_CANDIDATES.map((candidate) => join(dir, candidate)).find(
    (file) => existsSync(file),
  );

  if (entry === undefined) {
    return {
      ok: false,
      placed,
      reason: `no Remotion entry point — expected one of ${ENTRY_CANDIDATES.join(", ")}`,
    };
  }

  const before = await readFile(entry, "utf8");
  const code = withoutComments(before);
  const specifier = importOf(entry, registry);

  if (code.includes(`"${specifier}"`) || code.includes(`'${specifier}'`)) {
    return { ok: true, placed, entry, wrapped: false };
  }

  const calls = [...code.matchAll(REGISTER)];
  const last = [...code.matchAll(IMPORT)].at(-1);
  const call = calls.length === 1 ? calls[0] : undefined;

  // The entry point is the person's file. Anything that isn't exactly one
  // plain `registerRoot(Root)` after the imports is reported, not rewritten
  // on a guess.
  if (
    call?.index === undefined ||
    last?.index === undefined ||
    call.index < last.index + last[0].length
  ) {
    return {
      ok: false,
      placed,
      entry,
      specifier,
      reason: `${relative(dir, entry)} does not call registerRoot(Root) once, after its imports — add \`import { ${REGISTRY_EXPORT} } from "${specifier}";\` and wrap the root as registerRoot(${REGISTRY_EXPORT}(Root)) by hand`,
    };
  }

  const at = last.index + last[0].length;
  const end = call.index + call[0].length;
  const after =
    before.slice(0, at) +
    `\nimport { ${REGISTRY_EXPORT} } from "${specifier}";` +
    before.slice(at, call.index) +
    `registerRoot(${REGISTRY_EXPORT}(${call[1]}))` +
    before.slice(end);

  await writeFile(entry, after, "utf8");
  return { ok: true, placed, entry, wrapped: true };
}

function importOf(entry, registry) {
  const path = relative(dirname(entry), registry)
    .split(sep)
    .join("/")
    .replace(/\.tsx$/, "");
  return path.startsWith(".") ? path : `./${path}`;
}

// ---------------------------------------------------------------------------
// detect — is Studio on this machine, and which version
// ---------------------------------------------------------------------------

function run(file, args) {
  try {
    return execFileSync(file, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function detect() {
  const os = platform();

  if (os === "darwin") {
    const candidates = [
      ...run("mdfind", [`kMDItemCFBundleIdentifier == '${BUNDLE_ID}'`])
        .split("\n")
        .filter(Boolean),
      "/Applications/Remocn Studio.app",
      join(homedir(), "Applications", "Remocn Studio.app"),
    ];
    const app = candidates.find((path) => existsSync(path));
    if (app === undefined) {
      return { platform: os, supported: true, installed: false };
    }
    const version =
      run("plutil", [
        "-extract",
        "CFBundleShortVersionString",
        "raw",
        join(app, "Contents", "Info.plist"),
      ]) || null;
    return { platform: os, supported: true, installed: true, app, version };
  }

  if (os === "linux") {
    const handler = run("xdg-mime", [
      "query",
      "default",
      `x-scheme-handler/${SCHEME}`,
    ]);
    return {
      platform: os,
      supported: true,
      installed: handler.length > 0,
      handler: handler || null,
      version: null,
    };
  }

  return { platform: os, supported: false, installed: false };
}

// ---------------------------------------------------------------------------
// open — hand the project to Studio, or say how to
// ---------------------------------------------------------------------------

function newerOrEqual(version, since) {
  const a = version.split(".").map(Number);
  const b = since.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) {
      return diff > 0;
    }
  }
  return true;
}

function supportsOpenProject(studio) {
  if (OPEN_PROJECT_SINCE === null) {
    return false;
  }
  // Linux exposes no version for the scheme handler; assume a current install.
  return (
    studio.version === null || newerOrEqual(studio.version, OPEN_PROJECT_SINCE)
  );
}

function launch(file, args) {
  const child = spawn(file, args, { detached: true, stdio: "ignore" });
  child.on("error", () => {});
  child.unref();
}

function open(dir) {
  const studio = detect();
  const fallback = [
    "In Remocn Studio choose Open Folder (⌘O on macOS, Ctrl+O on Linux)",
    `and pick ${dir}`,
  ].join(" ");

  if (!existsSync(join(dir, MANIFEST))) {
    return {
      ok: false,
      studio,
      reason: `${dir} has no ${MANIFEST} — run \`init\` first; Studio refuses folders without it`,
    };
  }

  if (!studio.supported) {
    return {
      ok: false,
      studio,
      action: "unsupported-platform",
      message:
        "Remocn Studio is available for macOS and Linux only. The project still opens in Remotion Studio with `npx remotion studio`.",
    };
  }

  if (!studio.installed) {
    return {
      ok: true,
      studio,
      action: "not-installed",
      message: `Remocn Studio is not installed. Download it from ${DOWNLOAD_URL} (or ${RELEASES_URL}), then: ${fallback}.`,
      download: DOWNLOAD_URL,
    };
  }

  if (supportsOpenProject(studio)) {
    const link = `${SCHEME}://open-project?path=${encodeURIComponent(dir)}`;
    launch(studio.platform === "darwin" ? "open" : "xdg-open", [link]);
    return {
      ok: true,
      studio,
      action: "deep-link",
      link,
      message:
        "Remocn Studio is opening the project — confirm the dialog it shows.",
    };
  }

  // Launch the app itself, never a bare `remocn-studio://` — Studio answers a
  // link with no route by showing an error.
  if (studio.platform === "darwin") {
    launch("open", ["-b", BUNDLE_ID]);
  } else {
    launch("gtk-launch", [studio.handler]);
  }
  return {
    ok: true,
    studio,
    action: "launched",
    message: `Remocn Studio is starting. ${fallback}.`,
  };
}

// ---------------------------------------------------------------------------

const { command, flags, dir } = parseArgs(process.argv.slice(2));

switch (command) {
  case "init":
    print(await init(dir, flags.name));
    break;
  case "detect":
    print(detect());
    break;
  case "open":
    print(open(dir));
    break;
  default:
    print({
      ok: false,
      reason: "usage: studio.mjs <init|detect|open> [dir] [--name <name>]",
    });
    process.exitCode = 1;
}
