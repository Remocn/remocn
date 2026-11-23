// `bun scripts/jitter-lab.mts --lab cures|layers|angle|subtle [--scale 2] [--concurrency 4] [--still 24] [--only zoom,ty]`
//
// What `scripts/audit-jitter.mts` counts is a model; this is where the model
// comes from. A lab (`src/remotion/jitter-lab/`) is a page of text rows, each
// moved the same slow way and treated differently. The script renders the
// frames and reads every glyph's centre of mass from the pixels, then
// reports per row how far the ink strays from a perfectly even move (the
// residual of a straight-line fit against the motion), how sharp it stays
// against the plain row, and where its biggest one-frame jumps are.
//
// - `cures`: plain, a tilt, a tilt only while moving, `will-change:
//   transform`. `--concurrency 4` shows what a layer does to a render split
//   over several tabs; `--still 24` renders that frame alone and compares.
// - `layers`: everything else that is said to make a layer.
// - `angle`: which tilt takes text off the pixel grid at which scale of the
//   picture (run it at `--scale 1` and `--scale 2`).
// - `subtle`: cures that would not lean anything: a perspective too faint to
//   move a pixel frees the text, but it is a compositor layer and blurs it.
//
// Run it again on a new Chrome or on another platform before trusting the
// numbers in CLAUDE.md there: they were measured on macOS.
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import {
  getCompositions,
  openBrowser,
  renderFrames,
  renderStill,
} from "@remotion/renderer";
import sharp from "sharp";

const flag = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};
const lab = flag("lab") ?? "cures";
const rootFile = path.join(
  process.cwd(),
  "src/remotion/jitter-lab",
  `${lab}.tsx`,
);
const { TREATS, ROW, TOP, LEFT, LAST, paramAt, SHOWN } = (await import(
  rootFile
)) as {
  TREATS: { id: string }[];
  ROW: number;
  TOP: number;
  LEFT: number;
  LAST: number;
  END?: number;
  SHOWN?: Record<string, number>;
  paramAt?: (motion: string, frame: number) => number;
};
const still = flag("still") ? Number(flag("still")) : undefined;
const concurrency = Number(flag("concurrency") ?? 1);
const scale = Number(flag("scale") ?? 1);
const only = flag("only")?.split(",");
const outRoot = path.join(
  process.cwd(),
  "out/jitter/lab",
  `${lab}-${scale}x-c${concurrency}`,
);

const serveUrl = await bundle({ entryPoint: rootFile, enableCaching: false });
const chromiumOptions = { gl: "angle" as const };
const browser = await openBrowser("chrome", { chromiumOptions });
type Track = { x: number[]; y: number[] };
const report: string[] = [];
try {
  const compositions = await getCompositions(serveUrl, {
    puppeteerInstance: browser,
  });
  for (const composition of compositions) {
    if (only && !only.includes(composition.id)) continue;
    const dir = path.join(outRoot, composition.id);
    // Geometry of the rows in device pixels: the render scale times the
    // share the composition is shown at inside the frame.
    const k = scale * (SHOWN?.[composition.id] ?? 1);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    await renderFrames({
      serveUrl,
      composition,
      inputProps: {},
      imageFormat: "png",
      outputDir: dir,
      concurrency,
      scale,
      puppeteerInstance: browser,
      chromiumOptions,
      muted: true,
      logLevel: "error",
      onStart: () => undefined,
      onFrameUpdate: () => undefined,
    });
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".png"))
      .sort();
    // rows[treat] = per-frame list of glyph centres
    const rows: [number, number][][][] = TREATS.map(() => []);
    const crisp: number[][] = TREATS.map(() => []);
    const bands: Buffer[][] = TREATS.map(() => []);
    for (const file of files) {
      const { data: px, info } = await sharp(path.join(dir, file))
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const { width } = info;
      TREATS.forEach((_, i) => {
        const y0 = Math.round((TOP + i * ROW) * k);
        const y1 = Math.round((TOP + (i + 1) * ROW) * k);
        const x0 = Math.round((LEFT - 20) * k);
        const ink = (xx: number, yy: number) => {
          const o = (yy * width + xx) * 3;
          return 255 - Math.min(px[o], px[o + 1], px[o + 2]);
        };
        let [grad, mass] = [0, 0];
        for (let yy = y0; yy < y1 - 1; yy += 1) {
          for (let xx = x0; xx < width - 1; xx += 1) {
            const v = ink(xx, yy);
            grad += (ink(xx + 1, yy) - v) ** 2 + (ink(xx, yy + 1) - v) ** 2;
            mass += v;
          }
        }
        crisp[i].push(grad / Math.max(1, mass));
        bands[i].push(px.subarray(y0 * width * 3, y1 * width * 3));
        const columns: number[] = [];
        for (let xx = x0; xx < width; xx += 1) {
          let sum = 0;
          for (let yy = y0; yy < y1; yy += 1) sum += ink(xx, yy);
          columns.push(sum);
        }
        const blobs: [number, number][] = [];
        let start = -1;
        for (let c = 0; c <= columns.length; c += 1) {
          const on = c < columns.length && columns[c] > 40;
          if (on && start === -1) start = c;
          if (!on && start !== -1) {
            let [m, sx, sy] = [0, 0, 0];
            for (let xx = x0 + start; xx < x0 + c; xx += 1) {
              for (let yy = y0; yy < y1; yy += 1) {
                const w = ink(xx, yy);
                m += w;
                sx += w * (xx + 0.5);
                sy += w * (yy + 0.5);
              }
            }
            blobs.push([sx / m, sy / m]);
            start = -1;
          }
        }
        rows[i].push(blobs);
      });
    }
    const param = files.map((_, f) =>
      paramAt ? paramAt(composition.id, f) : f / LAST,
    );
    // The same frame rendered on its own, in a fresh tab state: a row whose
    // pixels differ from the in-sequence frame depends on what came before.
    const alone: string[] = [];
    if (still !== undefined) {
      const file = path.join(outRoot, `${composition.id}-still-${still}.png`);
      await renderStill({
        serveUrl,
        composition,
        frame: still,
        output: file,
        inputProps: {},
        scale,
        puppeteerInstance: browser,
        chromiumOptions,
        logLevel: "error",
      });
      const { data: px2, info: info2 } = await sharp(file)
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      TREATS.forEach((_, i) => {
        const y0 = Math.round((TOP + i * ROW) * k);
        const y1 = Math.round((TOP + (i + 1) * ROW) * k);
        const a = bands[i][still];
        const b = px2.subarray(y0 * info2.width * 3, y1 * info2.width * 3);
        let [max, off] = [0, 0];
        for (let o = 0; o < a.length; o += 1) {
          const d = Math.abs(a[o] - b[o]);
          if (d > max) max = d;
          if (d > 8) off += 1;
        }
        alone.push(max === 0 ? "same" : `max ${max}, ${off} off`);
      });
    }
    report.push(`\n== ${composition.id} @${scale}x, shown at ${k} (device px)`);
    report.push(
      `${"treatment".padEnd(24)} glyphs   x rms   x max   x step |  y rms   y max   y step | kern wobble | sharp mean  min  last | last vs plain | biggest steps (frame:px)${still !== undefined ? ` | frame ${still} alone` : ""}`,
    );
    TREATS.forEach((treat, i) => {
      const counts = rows[i].map((b) => b.length);
      const n = Math.min(...counts);
      const steady = counts.every((c) => c === counts[0]);
      if (!steady || n === 0) {
        report.push(
          `${treat.id.padEnd(24)} glyph count changes (${Math.min(...counts)}-${Math.max(...counts)}), skipped`,
        );
        return;
      }
      const tracks: Track[] = Array.from({ length: n }, (_, g) => ({
        x: rows[i].map((b) => b[g][0]),
        y: rows[i].map((b) => b[g][1]),
      }));
      const residual = (v: number[]) => {
        const k = v.length;
        const mp = param.reduce((a, b) => a + b, 0) / k;
        const mv = v.reduce((a, b) => a + b, 0) / k;
        let [num, den] = [0, 0];
        for (let j = 0; j < k; j += 1) {
          num += (param[j] - mp) * (v[j] - mv);
          den += (param[j] - mp) ** 2;
        }
        const slope = den === 0 ? 0 : num / den;
        return v.map((value, j) => value - mv - slope * (param[j] - mp));
      };
      const stats = (res: number[][]) => {
        const flat = res.flat();
        const rms = Math.sqrt(
          flat.reduce((a, b) => a + b * b, 0) / flat.length,
        );
        const max = Math.max(...flat.map(Math.abs));
        let step = 0;
        for (const r of res)
          for (let j = 1; j < r.length; j += 1)
            step = Math.max(step, Math.abs(r[j] - r[j - 1]));
        return [rms, max, step];
      };
      const rx = tracks.map((t) => residual(t.x));
      const ry = tracks.map((t) => residual(t.y));
      // How much the gap between neighbouring glyphs flutters frame to frame.
      let wobble = 0;
      for (let g = 1; g < n; g += 1)
        for (let j = 1; j < rx[g].length; j += 1)
          wobble = Math.max(
            wobble,
            Math.abs(
              rx[g][j] - rx[g - 1][j] - (rx[g][j - 1] - rx[g - 1][j - 1]),
            ),
          );
      const f = (v: number) => v.toFixed(3).padStart(7);
      const [a, b] = [stats(rx), stats(ry)];
      // Sharpness against the plain row at the same frame (same scale).
      const rel = crisp[i].map((v, j) => v / crisp[0][j]);
      const pc = (v: number) => `${Math.round(v * 100)}%`.padStart(5);
      // The frames where the whole line (mean over glyphs) or its two ends
      // moved off the even path the most.
      const stepAt: [number, number][] = [];
      for (let j = 1; j < param.length; j += 1) {
        const ends = [0, n - 1].map((g) =>
          Math.hypot(rx[g][j] - rx[g][j - 1], ry[g][j] - ry[g][j - 1]),
        );
        stepAt.push([j, Math.max(...ends)]);
      }
      const top = stepAt
        .sort((p, q) => q[1] - p[1])
        .slice(0, 3)
        .map(([j, v]) => `${j}:${v.toFixed(2)}`)
        .join(" ");
      const lastA = bands[0][bands[0].length - 1];
      const lastB = bands[i][bands[i].length - 1];
      let [dmax, doff] = [0, 0];
      for (let k = 0; k < lastA.length; k += 1) {
        const d = Math.abs(lastA[k] - lastB[k]);
        if (d > dmax) dmax = d;
        if (d > 8) doff += 1;
      }
      const lastDiff = (
        dmax === 0 ? "same" : `max ${dmax}, ${doff} off`
      ).padEnd(18);
      report.push(
        `${treat.id.padEnd(24)} ${String(n).padStart(5)} ${f(a[0])} ${f(a[1])} ${f(a[2])}  | ${f(b[0])} ${f(b[1])} ${f(b[2])}  | ${f(wobble)}     | ${pc(rel.reduce((p, q) => p + q, 0) / rel.length)} ${pc(Math.min(...rel))} ${pc(rel[rel.length - 1])} | ${lastDiff} | ${top}${still !== undefined ? ` | ${alone[i]}` : ""}`,
      );
    });
  }
} finally {
  await browser.close({ silent: true });
  rmSync(serveUrl, { recursive: true, force: true });
}
console.log(report.join("\n"));
