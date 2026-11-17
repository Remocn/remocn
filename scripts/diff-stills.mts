// `bun scripts/diff-stills.mts <before-dir> <after-dir> [names-file]`
//
// Compares same-named PNGs pixel by pixel and prints the ones that differ:
// share of pixels off by more than 8/255 in any channel, and the largest
// channel difference. Exit code 1 when any still differs.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [before, after, namesFile] = process.argv.slice(2);
const names = namesFile
  ? new Set(readFileSync(namesFile, "utf8").split(/\s+/).filter(Boolean))
  : undefined;
let differ = 0;
for (const file of readdirSync(after)
  .filter((f) => f.endsWith(".png"))
  .sort()) {
  if (names && !names.has(file.split("@")[0])) continue;
  const a = path.join(before, file);
  if (!existsSync(a)) {
    console.log(`MISSING ${file}`);
    continue;
  }
  const [x, y] = await Promise.all(
    [a, path.join(after, file)].map((f) =>
      sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    ),
  );
  if (x.info.width !== y.info.width || x.info.height !== y.info.height) {
    console.log(`SIZE ${file}`);
    differ += 1;
    continue;
  }
  let off = 0;
  let max = 0;
  for (let i = 0; i < x.data.length; i += 4) {
    let px = 0;
    for (let c = 0; c < 4; c += 1)
      px = Math.max(px, Math.abs(x.data[i + c] - y.data[i + c]));
    max = Math.max(max, px);
    if (px > 8) off += 1;
  }
  if (max > 0) {
    differ += 1;
    const share = off / (x.data.length / 4);
    console.log(
      `${share > 0.001 ? "DIFF" : "tiny"} ${file} ${(share * 100).toFixed(2)}% max ${max}`,
    );
  }
}
console.log(`${differ} differ`);
process.exit(differ > 0 ? 1 : 0);
