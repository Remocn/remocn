// `bun scripts/audit-jitter.mts --names a,b|--file names.txt|--all --out dir [--stills] [--base dir]`
//
// Counts the pixel clicks in registry components. Chrome rounds to whole
// pixels in two places (see `src/remotion/jitter-audit-root.tsx`), so a thing
// that moves slowly through either one holds still for a few frames, then
// jumps a full pixel; lines of one block jump on different frames and the
// block trembles. A click here is a frame where the rounded position moved a
// pixel while the true position moved less than half of one.
//
// Nothing is screenshotted for the count: the root logs where each text node
// and painted box sits after every frame, and this script reads the logs. One
// tab, frames in order, so it stays light on the machine.
//
// `--stills` also renders full-size PNGs at frames where no text moves, plus
// the two frames with the most clicks. `--base dir` (an earlier run on the
// untouched code) reuses that run's frames and prints a verdict per
// component: clicks before and after, and whether the resting frames still
// match pixel for pixel.
//
// `--png 60-110` saves every frame of that range with the text positions.
//
// `--tabs 4` renders every frame twice, in one tab and split over four, and
// counts the frames whose pixels differ. A component must draw a frame the
// same way whatever the tab drew before it: `npx remotion render` splits the
// frames over several tabs, and a frame that depends on the ones before it
// (text on a `will-change: transform` layer does) jumps between neighbours.
//
// `--fps-scale 2` runs every preview at twice its frame rate and twice its
// length in frames: the same seconds, at 60 fps. `--at 0.25,0.5,0.75` also
// photographs those shares of the length, at the same moments whatever the
// rate, and `scripts/compare-frame-rates.mts` compares two such runs.
// `--stills-only` takes the photographs and skips the count; `--window 150`
// counts only the first 150 frames of the 30 fps timeline.
//
// Only the named components are bundled: the preview index is sliced down to
// their entries, otherwise webpack compiles all ~900 lazy imports.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import {
  getCompositions,
  openBrowser,
  renderFrames,
  renderStill,
} from "@remotion/renderer";
import sharp from "sharp";
import { tsconfigWebpackAlias } from "./tsconfig-webpack-alias.mts";

const flag = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};
const root = process.cwd();
// `--index file` reads another preview index of the same shape, for an item
// the site has no preview of (`a1-product-demo`).
const indexSource = readFileSync(
  path.resolve(flag("index") ?? path.join(root, "registry/__index__.tsx")),
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
      : "usage: bun scripts/audit-jitter.mts --names a,b|--file names.txt|--all --out dir [--stills] [--base dir]",
  );
  process.exit(1);
}
const out = path.resolve(flag("out") ?? "out/jitter");
const base = flag("base") ? path.resolve(flag("base") as string) : undefined;
const stills = process.argv.includes("--stills");
const png = flag("png");
const tabs = flag("tabs") ? Number(flag("tabs")) : undefined;
// `--strict` also gates the uneven steps and text on a `will-change:
// transform` layer, and prints a verdict without `--base` too.
const strict = process.argv.includes("--strict");
mkdirSync(path.join(out, "details"), { recursive: true });
if (stills) mkdirSync(path.join(out, "stills"), { recursive: true });

const PREFIX = "__JITTER__";
const SLOW = 0.5;
const VISIBLE = 0.15;

// A row of `src/remotion/jitter-audit-root.tsx`; the fields are named there.
type Row = [
  string,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  [string, number][],
  [string, number, number] | null,
  string,
  number,
  string,
  number,
  number,
  number,
  number,
];
type Described = { tag: string; style: string; text: string; size: number };
// What moved the thing that clicked, which is also what fixes it:
// - layout: `top`, `left`, a margin or reflow. Move it with a transform.
// - scale, translate: a transform over text. Tilt it while it moves.
// - attribute: SVG text placed by `x`/`y`. Tilt the group while it moves.
// - box: a painted box moved by layout. Move it with a transform.
// - resize: a box edge moved by `width`/`height`; counted, not gated.
type Cause = "layout" | "scale" | "translate" | "attribute" | "box" | "resize";
const CAUSES: Cause[] = [
  "layout",
  "scale",
  "translate",
  "attribute",
  "box",
  "resize",
];
type Detail = ReturnType<typeof analyse> & { name: string; frames: number };

const crossed = (a: number, b: number) =>
  Math.abs(a - b) >= 1e-3 &&
  Math.abs(a - b) < SLOW &&
  Math.round(a) !== Math.round(b);
// The same rounding at half a pixel to two pixels a frame: the thing moves
// every frame, but by a step that is off by 0.4px or more (1, 1, 0, 1 for a
// true 0.75), which reads as a stutter. It is also where a click turns up as
// soon as the scene runs at half speed or plays in a smaller player.
const UNEVEN = 2;
const uneven = (a: number, b: number) =>
  Math.abs(a - b) >= SLOW &&
  Math.abs(a - b) < UNEVEN &&
  Math.abs(Math.round(a) - Math.round(b) - (a - b)) >= 0.4;
// One such step on its own, with the text at rest in the frame before and the
// frame after, is a jump the scene makes once (a line that reflows when its
// text changes), not a move whose steps come out uneven. Counted apart.
// The baseline is taken as 0.8 of the text box. A box that changes height by
// this much in one frame moves that guess by itself (a glyph squashed about
// its real baseline seems to step), and a shape changing that fast hides a
// pixel anyway, so such a frame is not read for uneven steps.
const RESHAPED = 5;
const MOVED = 0.02;
const atRest = (a: Row | undefined, b: Row | undefined) =>
  a === undefined ||
  b === undefined ||
  a[14] !== b[14] ||
  a[15] !== b[15] ||
  [3, 4, 5, 6, 7, 8, 9, 10].every(
    (i) => Math.abs((a[i] as number) - (b[i] as number)) < MOVED,
  );
// A tilt that switches on or off turns the line by 0.05deg in one frame: its
// ends jump by half the line's rise, and its middle by the distance from the
// pivot. Counted from this size up.
const POP = 0.25;

// The coordinate the rasterizer snaps: the baseline in the pixel grid of
// whatever texture the glyphs are drawn into. A `will-change: transform`
// layer keeps its texture when it or anything above it moves, so only motion
// inside the layer counts. Any other compositor layer keeps its texture
// through translation but is re-rastered when the scale changes.
function rasterCoordinate(now: Row, before: Row): [number, number] | null {
  const baseline = (r: Row) => r[4] + r[6] * 0.8;
  const [a, b] = [before[12], now[12]];
  const sameLayer = a && b && a[0] === b[0] && a[2] > 0 && b[2] > 0;
  if (now[1] & 2) {
    if (!sameLayer) return null;
    return [(baseline(before) - a[1]) / a[2], (baseline(now) - b[1]) / b[2]];
  }
  if (now[1] & 4 && sameLayer && Math.abs(a[2] - b[2]) < 1e-6) {
    return [baseline(before) - a[1], baseline(now) - b[1]];
  }
  return [baseline(before), baseline(now)];
}

// Every click a row made against the frame before, as [cause, mover path].
function clicksOf(
  now: Row,
  before: Row,
  crossed: (a: number, b: number) => boolean,
): [Cause, string][] {
  const parent = now[0].split("#")[0];
  const [lx, ly, lw, lh] = [7, 8, 9, 10].map((i) => [before[i], now[i]]) as [
    number,
    number,
  ][];
  if (now[1] & 16) {
    // A box: layout rounds each edge, a transform rounds none of them.
    const moved =
      Math.abs(lw[0] - lw[1]) < 1e-3 && Math.abs(lh[0] - lh[1]) < 1e-3;
    if (moved) {
      return crossed(lx[0], lx[1]) || crossed(ly[0], ly[1])
        ? [["box", now[13] || parent]]
        : [];
    }
    return crossed(lx[0], lx[1]) ||
      crossed(ly[0], ly[1]) ||
      crossed(lx[0] + lw[0], lx[1] + lw[1]) ||
      crossed(ly[0] + lh[0], ly[1] + lh[1])
      ? [["resize", parent]]
      : [];
  }
  const svg = (now[1] & 8) !== 0;
  if (!svg) {
    // Layout rounds the baseline in the element's own pixels, under any
    // transform. Once layout moved the text, that is the click to report.
    const [a, b] = [ly[0] + lh[0] * 0.8, ly[1] + lh[1] * 0.8];
    if (Math.abs(a - b) >= 1e-3) {
      return crossed(a, b) ? [["layout", now[13] || parent]] : [];
    }
  }
  if ((now[1] | before[1]) & 1) return [];
  const pair = rasterCoordinate(now, before);
  if (!pair || !crossed(pair[0], pair[1])) return [];
  // Movers inside a `will-change: transform` layer are the only ones that
  // reach its text; the layer path is a prefix of theirs.
  const movers = now[11].filter(
    ([p]) =>
      !(now[1] & 2) || (now[12] !== null && p.startsWith(`${now[12][0]}.`)),
  );
  const scaler = [...movers].reverse().find(([, kind]) => kind & 1);
  const slider = [...movers].reverse().find(([, kind]) => kind & 2);
  if (scaler) return [["scale", scaler[0]]];
  if (slider) return [["translate", slider[0]]];
  return [["attribute", parent.split(".").slice(0, -1).join(".") || parent]];
}

const same = (a: Row[] | undefined, b: Row[] | undefined) =>
  a !== undefined &&
  b !== undefined &&
  a.length === b.length &&
  a.every((r, i) => {
    const o = b[i];
    return (
      r[0] === o[0] &&
      Math.abs(r[2] - o[2]) < 1e-3 &&
      Math.abs(r[3] - o[3]) < 2e-3 &&
      Math.abs(r[4] - o[4]) < 2e-3 &&
      Math.abs(r[5] - o[5]) < 2e-3 &&
      Math.abs(r[6] - o[6]) < 2e-3
    );
  });

// A path is described again each time a different node takes it (a sequence
// swapping scenes), so a lookup needs the frame as well.
type Descriptions = Map<string, { from: number; node: Described }[]>;
const describedAt = (all: Descriptions, path: string, frame: number) =>
  all.get(path)?.findLast((entry) => entry.from <= frame)?.node;

function analyse(frames: Map<number, Row[]>, described: Descriptions) {
  const order = [...frames.keys()].sort((x, y) => x - y);
  const tracks = new Map<string, Map<number, Row>>();
  for (const frame of order) {
    for (const row of frames.get(frame) ?? []) {
      let track = tracks.get(row[0]);
      if (!track) {
        track = new Map();
        tracks.set(row[0], track);
      }
      track.set(frame, row);
    }
  }
  type Group = {
    cause: Cause;
    mover: string;
    nodes: Set<string>;
    clicks: number;
    weight: number;
    from: number;
    to: number;
    perNode: Map<string, number>;
  };
  const groups = new Map<string, Group>();
  const clicksAt = new Map<number, number>();
  // Beyond the clicks: uneven steps, tilt switches and text riding a
  // `will-change: transform` layer. Reported, not gated.
  const stutter = new Map<
    string,
    {
      cause: Cause;
      mover: string;
      nodes: Set<string>;
      steps: number;
      from: number;
      to: number;
    }
  >();
  const jumps: { key: string; frame: number }[] = [];
  // A lean that comes or goes on text that is off the pixel grid, or as the
  // text passes from a transform to layout, snaps it by up to half a pixel in
  // that frame. Text that ever moves keeps one way of being drawn.
  const snaps: { key: string; frame: number; why: string }[] = [];
  // Frames where some text keeps a lean: a still of such a frame is drawn
  // off the grid on purpose and will not match the untouched code.
  const leantFrames = new Set<number>();
  // Frames where some text rests where a transform carried it: laid out at
  // its last resting place, it stands here at its exact place, which layout
  // rounding used to put up to a pixel away.
  const carriedFrames = new Set<number>();
  // The lean the cure puts on text: the steepest one seen (as an angle on the
  // screen) and the weakest one that still frees the text (1 is the limit).
  // An angle past LEANT is a turn the scene makes on purpose.
  const LEANT = 2;
  let steepest = { angle: 0, frame: 0, key: "" };
  let weakest = { lean: Number.POSITIVE_INFINITY, frame: 0, key: "" };
  let leantRows = 0;
  // The same for painted boxes: a card or a hairline that leans shows it.
  let boxTilt = { angle: 0, frame: 0, key: "" };
  // ... and how far its edge climbs across its width, in pixels: what shows.
  let boxRise = { rise: 0, frame: 0, key: "" };
  const pops: { key: string; frame: number; size: number }[] = [];
  const layered = new Set<string>();
  const centre = (r: Row) => [r[3] + r[5] / 2, r[4] + r[6] / 2];
  const travel = (a: Row, b: Row) => {
    const [p, q] = [centre(a), centre(b)];
    return [q[0] - p[0], q[1] - p[1]];
  };
  for (const [key, track] of tracks) {
    for (const [frame, now] of track) {
      const before = track.get(frame - 1);
      if (!before) continue;
      const opacity = Math.min(now[2], before[2]);
      if (opacity < VISIBLE) continue;
      // Another node took this path (a sibling mounted or left), or the same
      // text changed its typeface: a swap, not a move.
      if (!(now[1] & 16) && now[1] & 1 && Math.abs(now[17] ?? 0) <= LEANT)
        leantFrames.add(frame);
      if (!(now[1] & 16) && now[19] === 1) carriedFrames.add(frame);
      if (
        !(now[1] & 16) &&
        (now[1] ^ before[1]) & 1 &&
        before[14] === now[14] &&
        now[18] !== undefined
      ) {
        const still = now[1] & 1 ? before : now;
        const [dx, dy] = travel(before, now);
        // Only the height of the baseline matters: sideways, glyphs are
        // placed between pixels anyway, and a line that changes its text
        // changes its width without going anywhere.
        const handed =
          Math.abs(now[8] + now[10] * 0.8 - (before[8] + before[10] * 0.8)) >
          1e-3;
        if (Math.hypot(dx, dy) < UNEVEN && (still[18] === 1 || handed))
          snaps.push({
            key,
            frame,
            why: still[18] === 1 ? "off the grid" : "handed to layout",
          });
      }
      if (now[1] & 16 && now[17] !== undefined) {
        const angle = Math.abs(now[17]);
        if (angle > 1e-4 && angle <= LEANT) {
          if (angle > boxTilt.angle) boxTilt = { angle, frame, key };
          const rise = now[5] * Math.tan((angle * Math.PI) / 180);
          if (rise > boxRise.rise) boxRise = { rise, frame, key };
        }
      }
      if (!(now[1] & 16) && now[16] !== undefined) {
        const angle = Math.abs(now[17]);
        if (angle > 1e-4 && angle <= LEANT) {
          leantRows += 1;
          if (angle > steepest.angle) steepest = { angle, frame, key };
          if (now[16] >= 1 && now[16] < weakest.lean)
            weakest = { lean: now[16], frame, key };
        }
      }
      if (before[14] !== now[14] || before[15] !== now[15]) continue;
      const reshaped = Math.abs(now[6] - before[6]) >= RESHAPED;
      for (const [cause, mover] of reshaped
        ? []
        : clicksOf(now, before, uneven)) {
        if (cause === "resize") continue;
        if (
          atRest(track.get(frame - 2), before) &&
          atRest(now, track.get(frame + 1))
        ) {
          jumps.push({ key, frame });
          continue;
        }
        const id = `${cause}:${mover}`;
        let group = stutter.get(id);
        if (!group) {
          group = {
            cause,
            mover,
            nodes: new Set(),
            steps: 0,
            from: frame,
            to: frame,
          };
          stutter.set(id, group);
        }
        group.nodes.add(key);
        group.steps += 1;
        group.to = Math.max(group.to, frame);
      }
      if (!(now[1] & 16)) {
        const [dx, dy] = travel(before, now);
        if ((now[1] ^ before[1]) & 1) {
          const around = [
            [track.get(frame - 2), before],
            [now, track.get(frame + 1)],
          ]
            .filter((pair): pair is [Row, Row] => Boolean(pair[0] && pair[1]))
            .map(([a, b]) => travel(a, b));
          const expected = around.length
            ? around
                .reduce((sum, v) => [sum[0] + v[0], sum[1] + v[1]], [0, 0])
                .map((v) => v / around.length)
            : [0, 0];
          const size =
            Math.hypot(dx - expected[0], dy - expected[1]) +
            Math.max(
              Math.abs(now[6] - before[6]),
              Math.abs(now[5] - before[5]),
            ) /
              2;
          // Only where the thing is nearly still: at speed the eye cannot tell
          // a turn of 0.05deg from the move itself.
          if (
            size >= POP &&
            size < 3 &&
            Math.abs(now[5] - before[5]) < 2 &&
            Math.abs(now[6] - before[6]) < 2 &&
            Math.hypot(expected[0], expected[1]) < 1 &&
            Math.hypot(dx, dy) < 3
          )
            pops.push({ key, frame, size });
        }
        if (
          now[1] & 2 &&
          Math.hypot(dx, dy) >= 1e-3 &&
          Math.hypot(dx, dy) < UNEVEN
        )
          layered.add(key);
      }
      for (const [cause, mover] of clicksOf(now, before, crossed)) {
        const id = `${cause}:${mover}`;
        let group = groups.get(id);
        if (!group) {
          group = {
            cause,
            mover,
            nodes: new Set(),
            clicks: 0,
            weight: 0,
            from: frame,
            to: frame,
            perNode: new Map(),
          };
          groups.set(id, group);
        }
        group.nodes.add(key);
        group.clicks += 1;
        group.weight += opacity;
        group.from = Math.min(group.from, frame);
        group.to = Math.max(group.to, frame);
        group.perNode.set(key, (group.perNode.get(key) ?? 0) + 1);
        if (cause !== "resize")
          clicksAt.set(frame, (clicksAt.get(frame) ?? 0) + 1);
      }
    }
  }
  const byCause = Object.fromEntries(CAUSES.map((c) => [c, 0])) as Record<
    Cause,
    number
  >;
  const list = [...groups.values()]
    .sort((x, y) => y.weight - x.weight)
    .map((group) => {
      byCause[group.cause] += group.clicks;
      const worst = [...group.perNode.entries()]
        .sort((x, y) => y[1] - x[1])
        .slice(0, 4)
        .map(([key, clicks]) => {
          const d = describedAt(described, key.split("#")[0], group.from);
          return { text: d?.text ?? "", size: d?.size ?? 0, clicks };
        });
      return {
        cause: group.cause,
        mover: {
          path: group.mover,
          ...(describedAt(described, group.mover, group.from) ?? {}),
        },
        nodes: group.nodes.size,
        clicks: group.clicks,
        weight: Math.round(group.weight * 10) / 10,
        frames: [group.from, group.to],
        worst,
      };
    });

  // Frames where nothing moved against either neighbour: a fix must leave
  // them pixel-identical. The middle of each of the three longest runs.
  const runs: [number, number][] = [];
  for (const frame of order) {
    const still =
      (frames.get(frame)?.length ?? 0) > 0 &&
      same(frames.get(frame), frames.get(frame - 1)) &&
      same(frames.get(frame), frames.get(frame + 1));
    const last = runs[runs.length - 1];
    if (!still) continue;
    if (last && last[1] === frame - 1) last[1] = frame;
    else runs.push([frame, frame]);
  }
  const rest = runs
    .sort((x, y) => y[1] - y[0] - (x[1] - x[0]))
    .slice(0, 3)
    .map(([from, to]) => Math.floor((from + to) / 2))
    .sort((x, y) => x - y);
  const clickAt = [...clicksAt.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, 2)
    .map(([frame]) => frame)
    .sort((x, y) => x - y);

  // `resize` is a growing bar or panel: its edge steps by a pixel like any
  // DOM box, which reads as growth rather than shake, and the cure (a scale
  // or a clip) changes how corners look. It is reported, not gated.
  const gated = list.filter((g) => g.cause !== "resize");
  const stutters = [...stutter.values()].sort((x, y) => y.steps - x.steps);
  const describedText = (key: string, frame: number) =>
    describedAt(described, key.split("#")[0], frame)?.text ?? "";
  return {
    uneven: stutters.reduce((sum, g) => sum + g.steps, 0),
    unevenGroups: stutters.slice(0, 6).map((g) => ({
      cause: g.cause,
      mover: {
        path: g.mover,
        ...(describedAt(described, g.mover, g.from) ?? {}),
      },
      nodes: g.nodes.size,
      steps: g.steps,
      frames: [g.from, g.to],
    })),
    // every uneven group in short, to look one up in another run
    unevenAll: stutters.map(
      (g) => `${g.cause}:${g.mover}@${g.from}-${g.to}x${g.steps}`,
    ),
    leantRows,
    steepest:
      leantRows > 0
        ? {
            angle: steepest.angle,
            frame: steepest.frame,
            text: describedText(steepest.key, steepest.frame).slice(0, 40),
          }
        : null,
    boxTilt:
      boxTilt.angle > 0
        ? {
            angle: boxTilt.angle,
            frame: boxTilt.frame,
            text: describedText(boxTilt.key, boxTilt.frame).slice(0, 40),
          }
        : null,
    boxRise:
      boxRise.rise > 0
        ? {
            rise: Math.round(boxRise.rise * 100) / 100,
            frame: boxRise.frame,
            text: describedText(boxRise.key, boxRise.frame).slice(0, 40),
          }
        : null,
    weakest: Number.isFinite(weakest.lean)
      ? {
          lean: weakest.lean,
          frame: weakest.frame,
          text: describedText(weakest.key, weakest.frame).slice(0, 40),
        }
      : null,
    snaps: snaps.length,
    snapAt: snaps.slice(0, 8).map((x) => ({
      frame: x.frame,
      why: x.why,
      text: describedText(x.key, x.frame).slice(0, 40),
    })),
    leantFrames: [...leantFrames].sort((x, y) => x - y),
    carriedFrames: [...carriedFrames].sort((x, y) => x - y),
    jumps: jumps.length,
    jumpAt: jumps.slice(0, 6).map((j) => ({
      frame: j.frame,
      text: describedText(j.key, j.frame).slice(0, 40),
    })),
    pops: pops.length,
    popMax:
      Math.round(pops.reduce((max, p) => Math.max(max, p.size), 0) * 100) / 100,
    popWorst: [...pops]
      .sort((x, y) => y.size - x.size)
      .slice(0, 4)
      .map((p) => ({
        frame: p.frame,
        size: Math.round(p.size * 100) / 100,
        text: describedText(p.key, p.frame),
      })),
    layered: layered.size,
    items: tracks.size,
    clicks: gated.reduce((sum, g) => sum + g.clicks, 0),
    score: Math.round(gated.reduce((sum, g) => sum + g.weight, 0) * 10) / 10,
    clickFrames: clicksAt.size,
    byCause,
    rest,
    clickAt,
    groups: list,
  };
}

const causes = (detail: Detail) =>
  CAUSES.filter((c) => detail.byCause[c] > 0)
    .map((c) => `${c} ${detail.byCause[c]}`)
    .join(", ");

const readDetail = (dir: string, name: string): Detail | undefined => {
  const file = path.join(dir, "details", `${name}.json`);
  return existsSync(file)
    ? (JSON.parse(readFileSync(file, "utf8")) as Detail)
    : undefined;
};

// Same thresholds as `scripts/diff-stills.mts`: "tiny" is render noise.
async function compare(a: string, b: string) {
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
  return `${share > 0.001 ? "DIFF" : "tiny"} ${(share * 100).toFixed(2)}% max ${max}`;
}

const sliced = path.join(root, "node_modules/.cache/jitter-audit");
mkdirSync(sliced, { recursive: true });
const slicedIndex = path.join(sliced, `index-${process.pid}.tsx`);
writeFileSync(
  slicedIndex,
  `const registry = {\n${names.map((name) => entries.get(name)).join("\n")}\n};\nexport default registry;\n`,
);

const serveUrl =
  flag("serve") ??
  (await bundle({
    entryPoint: path.join(root, "src/remotion/jitter-audit-root.tsx"),
    // The sliced index differs per run, so webpack would file each run under
    // a cache of its own (250MB apiece) and never read one back.
    enableCaching: false,
    webpackOverride: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: [
          {
            name: "@/registry/__index__",
            alias: slicedIndex,
            onlyModule: true,
          },
          ...Object.entries(config.resolve?.alias ?? {}).map(
            ([name, alias]) => ({
              name: name.replace(/\$$/, ""),
              alias: alias as string,
              onlyModule: name.endsWith("$"),
            }),
          ),
          ...tsconfigWebpackAlias(root),
        ],
      },
    }),
  }));

// `--props '{"delay":20}'` renders every named component with these on top
// of its defaults, to check a path the defaults skip.
// `--shown 0.5` shows every component at half its size, the way a player
// that fits it into a smaller box does. A cure has to hold there too.
const inputProps = {
  names,
  props: flag("props") ? JSON.parse(flag("props") as string) : undefined,
  shown: flag("shown") ? Number(flag("shown")) : undefined,
  fpsScale: flag("fps-scale") ? Number(flag("fps-scale")) : 1,
};
const K = inputProps.fpsScale;
// Fractions of the length to photograph, at the same moment whatever the rate.
const at = (flag("at") ?? "").split(",").filter(Boolean).map(Number);
mkdirSync(path.join(out, "tracks"), { recursive: true });
if (at.length > 0) mkdirSync(path.join(out, "at"), { recursive: true });
const chromiumOptions = { gl: "angle" as const };
const browser = await openBrowser("chrome", { chromiumOptions });
const failed: string[] = [];
const verdicts: string[] = [];
try {
  const compositions = await getCompositions(serveUrl, {
    inputProps,
    puppeteerInstance: browser,
  });
  let i = 0;
  for (const composition of compositions) {
    i += 1;
    const frames = new Map<number, Row[]>();
    const described: Descriptions = new Map();
    try {
      if (process.argv.includes("--stills-only")) {
        for (const share of at) {
          const designFrames = Math.round(composition.durationInFrames / K);
          const frame =
            Math.min(designFrames - 1, Math.floor(share * designFrames)) * K;
          await renderStill({
            serveUrl,
            composition,
            frame,
            output: path.join(out, "at", `${composition.id}@${share}.png`),
            inputProps: { ...inputProps, quiet: true },
            puppeteerInstance: browser,
            chromiumOptions,
            logLevel: "error",
          });
        }
        process.stdout.write(`\r${i}/${compositions.length}   `);
        continue;
      }
      await renderFrames({
        serveUrl,
        composition,
        inputProps,
        imageFormat: "none",
        outputDir: null,
        // `--window 90`: only the first 90 frames of the design, at any rate.
        frameRange: flag("window")
          ? [
              0,
              Math.min(
                composition.durationInFrames,
                Number(flag("window")) * K,
              ) - 1,
            ]
          : null,
        concurrency: 1,
        puppeteerInstance: browser,
        chromiumOptions,
        muted: true,
        logLevel: "error",
        onStart: () => undefined,
        onFrameUpdate: () => undefined,
        onBrowserLog: (log) => {
          if (!log.text.startsWith(PREFIX)) return;
          const body = log.text.slice(PREFIX.length);
          if (body.startsWith("D")) {
            const data = JSON.parse(body.slice(1)) as {
              frame: number;
              nodes: Record<string, Described>;
            };
            for (const [nodePath, node] of Object.entries(data.nodes)) {
              const list = described.get(nodePath) ?? [];
              described.set(nodePath, list);
              list.push({ from: data.frame, node });
            }
          } else {
            const data = JSON.parse(body) as { frame: number; rows: Row[] };
            frames.set(data.frame, data.rows);
          }
        },
      });
      writeFileSync(
        path.join(out, "tracks", `${composition.id}.json`),
        JSON.stringify({
          fps: composition.fps,
          frames: Object.fromEntries(
            [...frames].map(([f, rows]) => [
              f,
              rows.map((r) => [r[0], r[1], r[2], r[3], r[4], r[5], r[6]]),
            ]),
          ),
        }),
      );
      for (const share of at) {
        const designFrames = Math.round(composition.durationInFrames / K);
        const frame =
          Math.min(designFrames - 1, Math.floor(share * designFrames)) * K;
        await renderStill({
          serveUrl,
          composition,
          frame,
          output: path.join(out, "at", `${composition.id}@${share}.png`),
          inputProps: { ...inputProps, quiet: true },
          puppeteerInstance: browser,
          chromiumOptions,
          logLevel: "error",
        });
      }
      const detail: Detail = {
        name: composition.id,
        frames: frames.size,
        ...analyse(frames, described),
      };
      const before = base ? readDetail(base, composition.id) : undefined;
      // The base run's frames, so both runs photograph the same moments.
      const rest = before?.rest ?? detail.rest;
      const clickAt = before?.clickAt ?? detail.clickAt;
      writeFileSync(
        path.join(out, "details", `${composition.id}.json`),
        `${JSON.stringify(detail, null, 1)}\n`,
      );
      const restVerdicts: string[] = [];
      if (stills && (base || detail.clicks > 0)) {
        for (const [kind, list] of [
          ["rest", rest],
          ["move", clickAt],
        ] as const) {
          for (const frame of list) {
            const file = `${composition.id}@${kind}-${frame}.png`;
            await renderStill({
              serveUrl,
              composition,
              frame: Math.min(frame, composition.durationInFrames - 1),
              output: path.join(out, "stills", file),
              inputProps,
              puppeteerInstance: browser,
              chromiumOptions,
              logLevel: "error",
            });
            const earlier = base && path.join(base, "stills", file);
            if (kind === "rest" && earlier && existsSync(earlier)) {
              const verdict = await compare(
                earlier,
                path.join(out, "stills", file),
              );
              // Text that rests off the grid keeps its lean, so that frame
              // is not the untouched one pixel for pixel, and is not meant
              // to be.
              restVerdicts.push(
                `${frame}: ${!verdict.startsWith("DIFF") ? verdict : detail.leantFrames.includes(frame) ? `lean kept, ${verdict.slice(5)}` : detail.carriedFrames.includes(frame) ? `carried, ${verdict.slice(5)}` : verdict}`,
              );
            }
          }
        }
      }
      if (png) {
        // Every frame of the range and where the text really sits in it, to
        // check a fix against pixels rather than against this script's model.
        const dir = path.join(out, "png", composition.id);
        mkdirSync(dir, { recursive: true });
        const [from, to] = png.split("-").map(Number);
        for (let frame = from; frame <= to; frame += 1) {
          await renderStill({
            serveUrl,
            composition,
            frame,
            output: path.join(dir, `${frame}.png`),
            inputProps,
            puppeteerInstance: browser,
            chromiumOptions,
            logLevel: "error",
          });
        }
        writeFileSync(
          path.join(dir, "text.json"),
          JSON.stringify({
            described: Object.fromEntries(
              [...described].map(([nodePath, list]) => [
                nodePath,
                list[0].node,
              ]),
            ),
            frames: Object.fromEntries(frames),
          }),
        );
      }
      if (tabs) {
        const dirs = [1, tabs].map((n) =>
          path.join(out, "tabs", `${composition.id}-${n}`),
        );
        for (const [k, n] of [1, tabs].entries()) {
          rmSync(dirs[k], { recursive: true, force: true });
          mkdirSync(dirs[k], { recursive: true });
          await renderFrames({
            serveUrl,
            composition,
            inputProps: { ...inputProps, quiet: true },
            imageFormat: "png",
            outputDir: dirs[k],
            concurrency: n,
            puppeteerInstance: browser,
            chromiumOptions,
            muted: true,
            logLevel: "error",
            onStart: () => undefined,
            onFrameUpdate: () => undefined,
          });
        }
        const files = readdirSync(dirs[0]).filter((f) => f.endsWith(".png"));
        const differing: string[] = [];
        let worst = 0;
        for (const file of files) {
          const verdict = await compare(
            path.join(dirs[0], file),
            path.join(dirs[1], file),
          );
          if (verdict === "same") continue;
          differing.push(file.replace(/\D/g, "").replace(/^0+(?=\d)/, ""));
          differing.sort((x, y) => Number(x) - Number(y));
          worst = Math.max(worst, Number(verdict.match(/([\d.]+)%/)?.[1] ?? 0));
        }
        verdicts.push(
          `${differing.length === 0 ? "ok  " : "TABS"} ${composition.id}: ${differing.length} of ${files.length} frames differ between 1 tab and ${tabs}` +
            (differing.length > 0
              ? `, worst ${worst}% of pixels; frames ${differing.slice(0, 12).join(",")}`
              : ""),
        );
        if (!process.argv.includes("--keep")) {
          for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
        }
      }
      const extra = strict
        ? ` | uneven ${detail.uneven}${detail.jumps > 0 ? `, one-off ${detail.jumps}` : ""} | snaps ${detail.snaps} | on a layer ${detail.layered}`
        : "";
      const clean =
        detail.clicks === 0 &&
        (!strict ||
          (detail.uneven === 0 && detail.layered === 0 && detail.snaps === 0));
      if (before) {
        const ok =
          clean &&
          restVerdicts.every((v) => !v.includes("DIFF") && !v.includes("SIZE"));
        verdicts.push(
          `${ok ? "ok  " : "TODO"} ${composition.id}: clicks ${before.clicks} -> ${detail.clicks}` +
            (detail.clicks > 0 ? ` (${causes(detail)})` : "") +
            extra +
            (stills
              ? ` | rest stills ${restVerdicts.length > 0 ? restVerdicts.join("; ") : "none to compare"}`
              : ""),
        );
      } else if (strict) {
        verdicts.push(
          `${clean ? "ok  " : "TODO"} ${composition.id}${inputProps.shown ? ` shown at ${inputProps.shown}` : ""}: clicks ${detail.clicks}` +
            (detail.clicks > 0 ? ` (${causes(detail)})` : "") +
            extra,
        );
      }
    } catch (error) {
      if (process.env.DEBUG) console.error(error);
      failed.push(`${composition.id}: ${String(error).split("\n")[0]}`);
    }
    process.stdout.write(`\r${i}/${compositions.length}   `);
  }
} finally {
  await browser.close({ silent: true });
  // The bundle is a 190MB folder in the temp dir that nothing removes.
  if (!flag("serve")) rmSync(serveUrl, { recursive: true, force: true });
  rmSync(slicedIndex, { force: true });
}

// The summary covers everything in the folder, so runs in chunks add up.
const all = readdirSync(path.join(out, "details"))
  .filter((file) => file.endsWith(".json"))
  .map((file) => readDetail(out, file.slice(0, -5)) as Detail)
  .sort((a, b) => b.score - a.score);
writeFileSync(
  path.join(out, "summary.tsv"),
  `${[
    [
      "name",
      "score",
      "clicks",
      ...CAUSES,
      "clickFrames",
      "frames",
      "items",
      "uneven",
      "jumps",
      "snaps",
      "pops",
      "popMax",
      "layered",
    ].join("\t"),
    ...all.map((r) =>
      [
        r.name,
        r.score,
        r.clicks,
        ...CAUSES.map((c) => r.byCause[c]),
        r.clickFrames,
        r.frames,
        r.items,
        r.uneven ?? "",
        r.jumps ?? "",
        r.snaps ?? "",
        r.pops ?? "",
        r.popMax ?? "",
        r.layered ?? "",
      ].join("\t"),
    ),
  ].join("\n")}\n`,
);
console.log(
  `\n${all.filter((r) => r.clicks > 0).length}/${all.length} with clicks in ${out}, ${failed.length} failed this run`,
);
if (verdicts.length > 0) {
  for (const line of verdicts) console.log(line);
} else {
  const mine = new Set(names);
  for (const r of all
    .filter((r) => mine.has(r.name) && r.clicks > 0)
    .slice(0, Number(flag("top") ?? 15))) {
    console.log(`${String(r.score).padStart(7)}  ${r.name}  ${causes(r)}`);
  }
}
for (const line of failed) console.log(`FAILED ${line}`);
if (failed.length > 0) {
  writeFileSync(
    path.join(out, `failed-${process.pid}.txt`),
    `${failed.join("\n")}\n`,
  );
}
