// `bun dev`: the Next.js dev server plus the preview bundle it loads.
//
// The previews are built outside Turbopack (scripts/previews/build.mts). This
// launcher builds them once, starts `next dev`, and from then on rebuilds
// them when one of their source files is saved. Open pages hear about a new
// build over a WebSocket and swap the changed previews in place
// (lib/previews/hot.ts), so an edit shows up without a page reload.
//
// Each rebuild is a separate short process: the bundler takes ~0.3 s and
// ~2.4 GB while it runs, and kept in this process it never gave that back.
//
//   bun scripts/dev.mts [...next dev args]
import { spawn } from "node:child_process";
import {
  existsSync,
  type FSWatcher,
  readFileSync,
  watch,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const MANIFEST = join(ROOT, "public/_previews/dev/manifest.json");
const NICE = process.platform === "win32" ? [] : ["nice", "-n", "10"];
const CHANNEL = "previews";
/** Where the previews' sources live. A build adds any folder it finds more in. */
const FOLDERS = ["registry", "components", "lib", "hooks", "config", "app"];
const SOURCE = /\.(tsx?|jsx?|mjs|css|json)$/;

type BuildResult = { version: string; elapsed: number; inputs: string[] };

let version = "";

const server = Bun.serve({
  port: 0,
  fetch(request, server) {
    if (server.upgrade(request)) return;
    return new Response("remocn previews live channel", { status: 426 });
  },
  websocket: {
    open(socket) {
      socket.subscribe(CHANNEL);
      socket.send(JSON.stringify({ type: "hello", version }));
    },
    message() {},
  },
});

function build(prune: boolean): Promise<BuildResult | null> {
  return new Promise((done) => {
    const [bin, ...args] = [
      ...NICE,
      "bun",
      "scripts/previews/build.mts",
      "--json",
      "--port",
      String(server.port),
      ...(prune ? ["--prune"] : []),
    ];
    const child = spawn(bin, args, {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "inherit"],
    });
    let stdout = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.on("error", (error) => {
      console.error("previews: could not start the build:", error.message);
      done(null);
    });
    child.on("close", (code) => {
      if (code !== 0) return done(null);
      try {
        done(JSON.parse(stdout.trim().split("\n").at(-1) ?? ""));
      } catch {
        done(null);
      }
    });
  });
}

// The describe endpoint reads every component's controls from a file
// (scripts/describe/build-controls.mts). Written after each build, in the
// background: the site doesn't wait for it.
let controlsRunning = false;
let controlsAgain = false;
function writeControls() {
  if (controlsRunning) {
    controlsAgain = true;
    return;
  }
  controlsRunning = true;
  const [bin, ...args] = [
    ...NICE,
    "bun",
    "scripts/describe/build-controls.mts",
  ];
  const child = spawn(bin, args, {
    cwd: ROOT,
    stdio: ["ignore", "ignore", "inherit"],
  });
  const finish = () => {
    controlsRunning = false;
    if (controlsAgain) {
      controlsAgain = false;
      writeControls();
    }
  };
  child.on("error", finish);
  child.on("close", finish);
}

// Rebuild when a source of the bundle is saved. A save of another file in
// the same folders is the site's business, not the previews'.
let inputs = new Set<string>();
// After a failed build the list of sources is out of date: the file that
// fixes it may be one the bundle has never seen. Then any source counts.
let failed = false;
const watchers = new Map<string, FSWatcher>();

function watchFolder(folder: string) {
  if (watchers.has(folder) || !existsSync(join(ROOT, folder))) return;
  const watcher = watch(
    join(ROOT, folder),
    { recursive: true },
    (_event, file) => {
      if (!file) return;
      const path = `${folder}/${file.toString().replaceAll("\\", "/")}`;
      if (inputs.has(path) || (failed && SOURCE.test(path))) schedule();
    },
  );
  watcher.on("error", (error) => {
    console.error(`previews: stopped watching ${folder}/:`, error.message);
    watchers.delete(folder);
  });
  watchers.set(folder, watcher);
}

function took(result: BuildResult) {
  failed = false;
  inputs = new Set(result.inputs);
  for (const file of result.inputs) watchFolder(file.split("/")[0]);
}

let timer: ReturnType<typeof setTimeout> | undefined;
let building = false;
let again = false;

function schedule() {
  clearTimeout(timer);
  // An editor's save is often several events in a row.
  timer = setTimeout(rebuild, 25);
}

async function rebuild() {
  if (building) {
    again = true;
    return;
  }
  building = true;
  const result = await build(false);
  building = false;
  if (result) {
    took(result);
    writeControls();
    if (result.version !== version) {
      version = result.version;
      server.publish(CHANNEL, JSON.stringify({ type: "built", version }));
      console.log(` ✓ Previews rebuilt in ${result.elapsed}ms`);
    }
  } else {
    // The build printed what is wrong; pages keep the last good bundle.
    failed = true;
    server.publish(CHANNEL, JSON.stringify({ type: "failed" }));
  }
  if (again) {
    again = false;
    schedule();
  }
}

for (const folder of FOLDERS) watchFolder(folder);
const first = await build(true);
if (first) {
  took(first);
  writeControls();
  version = first.version;
  console.log(` ✓ Previews built in ${first.elapsed}ms`);
} else {
  // Start the site anyway: the build runs again on the save that fixes it.
  failed = true;
  // No build, no new manifest. Put the port into the one left from the last
  // run, so the pages that open now hear about the build that works.
  try {
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
    writeFileSync(
      MANIFEST,
      `${JSON.stringify({ ...manifest, port: server.port })}\n`,
    );
  } catch {}
  console.error(
    " ⨯ Previews did not build. The site runs with the previews it had; fix the error above and save.",
  );
}

const next = spawn(
  "bun",
  ["scripts/low-priority.mts", "next", "dev", ...process.argv.slice(2)],
  { cwd: ROOT, stdio: "inherit" },
);

// Ctrl+C already reaches `next dev` through the terminal's process group;
// forward the rest so `kill` on this launcher stops the server too.
for (const signal of ["SIGTERM", "SIGHUP"] as const) {
  process.on(signal, () => next.kill(signal));
}
process.on("SIGINT", () => {});

// The manifest names this launcher's port. Once it is gone, a page loaded by
// a bare `next dev` should not keep dialling it.
process.on("exit", () => {
  try {
    const { port, ...rest } = JSON.parse(readFileSync(MANIFEST, "utf8"));
    if (port === server.port) {
      writeFileSync(MANIFEST, `${JSON.stringify(rest)}\n`);
    }
  } catch {}
});

next.on("error", (error) => {
  console.error("could not start next dev:", error.message);
  process.exit(1);
});
next.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
