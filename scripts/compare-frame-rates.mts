// `bun scripts/compare-frame-rates.mts <run A> <run B>`
//
// Two runs of `audit:jitter` with `--at 0.25,0.5,0.75`: does B show the same
// picture as A at the same moments? Run A is the 30 fps render, run B the same
// previews with `--fps-scale 2`. A scene whose timing is counted in the
// composition's own frames shows up here as `different`.
//
// When B kept its tracks (a run without `--stills-only`), the frames between
// two 30 fps frames are checked too: `held` is a moving node that sits still
// on the frame in between, so the extra frames show nothing new. That is right
// for motion stepped on purpose (a typewriter) and a miss anywhere else.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [baseDir, testDir] = process.argv.slice(2).map((d) => path.resolve(d));
if (!baseDir || !testDir) {
  console.error("usage: bun scripts/compare-frame-rates.mts <run A> <run B>");
  process.exit(1);
}
const shots = readdirSync(path.join(baseDir, "at")).filter((f) =>
  f.endsWith(".png"),
);
const names = [
  ...new Set(shots.map((f) => f.slice(0, f.lastIndexOf("@")))),
].sort();
// The moments run A photographed, whatever `--at` it was given.
const SHARES = [
  ...new Set(shots.map((f) => f.slice(f.lastIndexOf("@") + 1, -4))),
].sort((a, b) => Number(a) - Number(b));

type Row = [string, number, number, number, number, number, number];
type Tracks = { fps: number; frames: Record<string, Row[]> };

async function still(a: string, b: string): Promise<string> {
  if (!existsSync(a) || !existsSync(b)) return "missing";
  const [x, y] = await Promise.all(
    [a, b].map((f) =>
      sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    ),
  );
  if (x.info.width !== y.info.width || x.info.height !== y.info.height)
    return "SIZE";
  let off = 0;
  let max = 0;
  for (let i = 0; i < x.data.length; i += 4) {
    let px = 0;
    for (let c = 0; c < 4; c += 1)
      px = Math.max(px, Math.abs(x.data[i + c] - y.data[i + c]));
    max = Math.max(max, px);
    if (px > 8) off += 1;
  }
  if (max === 0) return "same";
  const share = off / (x.data.length / 4);
  return `${share > 0.001 ? "DIFF" : "tiny"} ${(share * 100).toFixed(2)}%`;
}

// Geometry and opacity of one node on one frame, as one distance.
const apart = (u: Row, v: Row) =>
  Math.abs(u[3] - v[3]) +
  Math.abs(u[4] - v[4]) +
  Math.abs(u[5] - v[5]) +
  Math.abs(u[6] - v[6]) +
  20 * Math.abs(u[2] - v[2]);

const lines = ["name\tstills\tmovingPairs\theld\tverdict"];
const tally: Record<string, number> = {};
for (const name of names) {
  const shots: string[] = [];
  for (const share of SHARES)
    shots.push(
      await still(
        path.join(baseDir, "at", `${name}@${share}.png`),
        path.join(testDir, "at", `${name}@${share}.png`),
      ),
    );
  let pairs = 0;
  let held = 0;
  const file = path.join(testDir, "tracks", `${name}.json`);
  if (existsSync(file)) {
    const tracks = JSON.parse(readFileSync(file, "utf8")) as Tracks;
    const count = Object.keys(tracks.frames).length;
    for (let k = 0; k + 2 < count; k += 2) {
      const at = (f: number) =>
        new Map((tracks.frames[f] ?? []).map((r) => [r[0], r]));
      const [p, q, s] = [at(k), at(k + 1), at(k + 2)];
      for (const [key, r0] of p) {
        const r1 = q.get(key);
        const r2 = s.get(key);
        if (!r1 || !r2) continue;
        const whole = apart(r0, r2);
        if (whole < 0.2) continue;
        pairs += 1;
        if (apart(r0, r1) < whole * 0.02 || apart(r1, r2) < whole * 0.02)
          held += 1;
      }
    }
  }
  const verdict = shots.includes("missing")
    ? "not measured"
    : !shots.every((s) => s === "same" || s.startsWith("tiny"))
      ? "different"
      : pairs > 0 && held > pairs * 0.5
        ? "same, held in between"
        : "same";
  tally[verdict] = (tally[verdict] ?? 0) + 1;
  lines.push(`${name}\t${shots.join(" | ")}\t${pairs}\t${held}\t${verdict}`);
}
const outFile = path.join(testDir, "compare.tsv");
writeFileSync(outFile, `${lines.join("\n")}\n`);
console.log(outFile);
console.log(tally);
