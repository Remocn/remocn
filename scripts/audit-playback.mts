// `bun scripts/audit-playback.mts --names a,b|--file names.txt|--all --out dir [--fps 60] [--props '{"grain":false}']`
//
// Can the browser draw a preview in real time? Each named preview is played
// in Chrome (the one installed on this machine, headless, with its GPU) in the
// same `@remotion/player` the site uses, one frame per screen refresh, and the
// refreshes that showed nothing new are counted. A render never loses frames,
// so this is about the site and Remotion Studio only.
//
// A preview that misses more than one refresh in fifty is played twice more:
//
// - again at full size. A clean second pass means the first one stalled once
//   on something that is cached afterwards (a shader compiled, a font or an
//   image decoded): `ok` with the stall noted.
// - at a quarter of the pixels, to say where the time goes. `script`: the main
//   thread alone is over budget. `pixels`: the smaller picture holds the rate,
//   so the cost is in filling pixels (blur, filters, shadows, a big canvas).
//   `paint`: neither, so it is in how much there is to draw (layers, an SVG
//   filter chain, hundreds of nodes).
//
// One preview at a time, in order: two at once would take each other's
// frames. Keep the machine otherwise idle while it runs, and do not read
// anything into one slow result on a busy machine: run that name again.
//
// Only the named previews are bundled, as in `audit-jitter.mts`.
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import type { BunPlugin } from "bun";
import { chromium } from "playwright-core";

const flag = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};
const root = process.cwd();
const indexSource = readFileSync(
  path.join(root, "registry/__index__.tsx"),
  "utf8",
);
const entries = new Map<string, string>();
for (const match of indexSource.matchAll(
  /^ {2}(?:"([^"]+)"|([A-Za-z0-9_]+)): \{\n[\s\S]*?\n {2}\},$/gm,
)) {
  entries.set(match[1] ?? match[2], match[0]);
}
const names = process.argv.includes("--all")
  ? [...entries.keys()]
  : (flag("file")
      ? readFileSync(flag("file") as string, "utf8")
      : (flag("names") ?? "")
    )
      .split(/[\s,]+/)
      .filter(Boolean);
const unknown = names.filter((name) => !entries.has(name));
if (names.length === 0 || unknown.length > 0) {
  console.error(
    unknown.length > 0
      ? `not in registry/__index__.tsx: ${unknown.join(", ")}`
      : "usage: bun scripts/audit-playback.mts --names a,b|--file names.txt|--all --out dir [--fps 60] [--props '{}']",
  );
  process.exit(1);
}
const out = path.resolve(flag("out") ?? "out/playback");
const fps = flag("fps") ?? "60";
const props = flag("props") ?? "{}";
mkdirSync(out, { recursive: true });

// One refresh in fifty: under it a scene reads as holding the rate.
const MISSED = 0.02;
// Over this on the main thread alone, a 60 fps frame cannot be made in time.
const SCRIPT_MS = 12;

const work = path.join(root, "node_modules/.cache/playback-audit");
mkdirSync(work, { recursive: true });
const sliced = path.join(work, `index-${process.pid}.tsx`);
const dist = path.join(work, `dist-${process.pid}`);
writeFileSync(
  sliced,
  `const registry = {\n${names.map((name) => entries.get(name)).join("\n")}\n};\nexport default registry;\n`,
);
const plugin: BunPlugin = {
  name: "playback-audit",
  setup(build) {
    build.onResolve({ filter: /^@\/registry\/__index__$/ }, () => ({
      path: sliced,
    }));
    build.onLoad({ filter: /\.css$/ }, async (args) => ({
      contents: `const s = document.createElement("style"); s.textContent = ${JSON.stringify(await Bun.file(args.path).text())}; document.head.appendChild(s);`,
      loader: "js",
    }));
  },
};
const built = await Bun.build({
  entrypoints: [path.join(root, "src/remotion/playback-audit-entry.tsx")],
  outdir: dist,
  target: "browser",
  format: "esm",
  splitting: true,
  minify: true,
  jsx: { runtime: "automatic", development: false },
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [plugin],
  throw: false,
});
if (!built.success) {
  for (const log of built.logs.slice(0, 10)) console.error(String(log));
  process.exit(1);
}
// Bun names the entry chunk after the source file.
const entryFile = built.outputs.find((o) => o.kind === "entry-point");
writeFileSync(
  path.join(dist, "index.html"),
  `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#111}</style><div id="root"></div><script type="module" src="./${path.basename(entryFile?.path ?? "entry.js")}"></script>`,
);

const server = Bun.serve({
  port: 0,
  fetch(req) {
    const url = new URL(req.url);
    const file = path.join(
      dist,
      url.pathname === "/" ? "index.html" : url.pathname,
    );
    return existsSync(file)
      ? new Response(Bun.file(file))
      : new Response("no", { status: 404 });
  },
});
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: [
    "--enable-gpu",
    "--use-angle=metal",
    // A page nobody looks at is throttled; this one must run flat out.
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
  ],
});
// A retina laptop showing the docs player: 960 CSS px wide, two device
// pixels each.
const context = await browser.newContext({
  viewport: { width: 1100, height: 700 },
  deviceScaleFactor: 2,
});

type Pass = {
  fps: number;
  seconds: number;
  refreshes: number;
  missed: number;
  share: number;
  stalls: number;
  maxGap: number;
  mainMs: number;
  scriptMs: number;
  layoutMs: number;
  styleMs: number;
};

async function play(name: string, width: number): Promise<Pass> {
  const page = await context.newPage();
  try {
    await page.goto(
      `http://localhost:${server.port}/?name=${encodeURIComponent(name)}&fps=${fps}&width=${width}&drive=raf&props=${encodeURIComponent(props)}`,
    );
    await page.waitForFunction(
      "window.__ready === true || window.__error",
      undefined,
      { timeout: 30000 },
    );
    const error = await page.evaluate("window.__error");
    if (error) throw new Error(String(error));
    // Lazy chunks, fonts and a component's own measuring pass.
    await page.waitForTimeout(1500);
    const length = (await page.evaluate("window.__length")) as number;
    const seconds = Math.min(Math.max(length, 2), 4);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Performance.enable");
    const read = async () =>
      Object.fromEntries(
        (await cdp.send("Performance.getMetrics")).metrics.map((m) => [
          m.name,
          m.value,
        ]),
      );
    const before = await read();
    const r = (await page.evaluate(`window.__measure(${seconds})`)) as Record<
      string,
      number
    >;
    const after = await read();
    const per = (key: string) =>
      ((after[key] - before[key]) * 1000) / Math.max(1, r.raf);
    return {
      fps: r.fps,
      seconds: r.seconds,
      refreshes: r.raf,
      missed: r.missed,
      share: r.missed / Math.max(1, r.raf + r.missed),
      stalls: r.stalls,
      maxGap: r.max,
      mainMs: per("TaskDuration"),
      scriptMs: per("ScriptDuration"),
      layoutMs: per("LayoutDuration"),
      styleMs: per("RecalcStyleDuration"),
    };
  } finally {
    await page.close();
  }
}

const shown = (p: Pass) => (p.refreshes / p.seconds).toFixed(1);
const summary = path.join(out, "summary.tsv");
if (!existsSync(summary))
  writeFileSync(
    summary,
    "name\tverdict\tfps\tshown\tmissedShare\tstalls\tmaxGap\tmainMs\tscriptMs\tlayoutMs\tstyleMs\tsecondShown\tquarterShown\n",
  );
const done = new Set(
  readFileSync(summary, "utf8")
    .split("\n")
    .map((line) => line.split("\t")[0]),
);
let slow = 0;
try {
  for (const name of names) {
    if (done.has(name)) continue;
    try {
      const first = await play(name, 960);
      let verdict = "ok";
      let second: Pass | undefined;
      let quarter: Pass | undefined;
      if (first.share > MISSED) {
        second = await play(name, 960);
        if (second.share > MISSED) {
          quarter = await play(name, 480);
          verdict =
            second.mainMs > SCRIPT_MS
              ? "script"
              : quarter.share < second.share / 2
                ? "pixels"
                : "paint";
          slow += 1;
        } else verdict = "ok, first play stalled";
      }
      // The warm pass is the one a reader sees on every play after the first.
      const told = second ?? first;
      appendFileSync(
        summary,
        `${[
          name,
          verdict,
          told.fps,
          shown(told),
          told.share.toFixed(3),
          first.stalls,
          first.maxGap.toFixed(0),
          told.mainMs.toFixed(2),
          told.scriptMs.toFixed(2),
          told.layoutMs.toFixed(2),
          told.styleMs.toFixed(2),
          second ? shown(second) : "",
          quarter ? shown(quarter) : "",
        ].join("\t")}\n`,
      );
      console.log(
        verdict.startsWith("ok")
          ? `ok   ${name}: ${shown(told)} of ${told.fps} fps | main thread ${told.mainMs.toFixed(1)} ms a frame${verdict === "ok" ? "" : ` | first play stalled ${first.maxGap.toFixed(0)} ms once`}`
          : `SLOW ${name}: ${shown(told)} of ${told.fps} fps (${verdict}) | main thread ${told.mainMs.toFixed(1)} ms a frame | at a quarter of the pixels ${quarter ? shown(quarter) : "?"} fps`,
      );
    } catch (error) {
      // A browser that is gone would fail every name after this one too.
      if (!browser.isConnected()) {
        console.log(`browser closed at ${name}`);
        break;
      }
      appendFileSync(
        summary,
        `${name}\tFAILED ${String(error).split("\n")[0].slice(0, 120)}\n`,
      );
      console.log(`FAILED ${name}: ${String(error).split("\n")[0]}`);
    }
  }
} finally {
  await browser.close();
  server.stop(true);
  rmSync(dist, { recursive: true, force: true });
  rmSync(sliced, { force: true });
}
console.log(`\n${slow} slow of ${names.length} in ${summary}`);
