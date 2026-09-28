import { describe, expect, it } from "bun:test";
import {
  getMondrianSplitClip,
  getMondrianSplitDuration,
  getMondrianSplitLayout,
  getMondrianSplitState,
  getMondrianSplitTimeline,
  mondrianSplitDefaults,
  mondrianSplitLength,
} from "..";
import { mondrianSplitConfig } from "../config";

type MondrianState = ReturnType<typeof getMondrianSplitState>;

const SIZES = [
  [1280, 720],
  [720, 720],
  [720, 1280],
];
const SEEDS = Array.from({ length: 24 }, (_, index) => index + 1);
const COVERED = "inset(0.0000% 0.0000% 0.0000% 0.0000%)";
const same = (a: number, b: number) => Math.abs(a - b) < 1e-6;
const boxArea = (box: { x0: number; y0: number; x1: number; y1: number }) =>
  (box.x1 - box.x0) * (box.y1 - box.y0);
const cellOf = (state: MondrianState, id: number) => {
  const cell = state.cells.find((item) => item.id === id);
  if (!cell) throw new Error(`cell ${id} is missing`);
  return cell;
};
const positionsOn = (state: MondrianState, axis: "x" | "y") =>
  state.lines.filter((line) => line.axis === axis).map((line) => line.position);
const neighbours = (state: MondrianState, id: number) => {
  const line = state.lines.find((item) => item.id === id);
  if (!line) throw new Error(`line ${id} is missing`);
  const { position } = line;
  const vertical = line.axis === "x";
  const from = vertical ? line.y : line.x;
  const to = from + (vertical ? line.height : line.width);
  const before: number[] = [];
  const after: number[] = [];
  for (const cell of state.cells) {
    const low = vertical ? cell.y0 : cell.x0;
    const high = vertical ? cell.y1 : cell.x1;
    if (Math.min(to, high) - Math.max(from, low) <= 1e-6) continue;
    if (same(vertical ? cell.x1 : cell.y1, position)) before.push(cell.id);
    if (same(vertical ? cell.x0 : cell.y0, position)) after.push(cell.id);
  }
  return { position, before, after };
};

describe("mondrian split timeline", () => {
  it("derives every phase from the split count alone", () => {
    const timeline = getMondrianSplitTimeline();
    expect(timeline).toEqual({
      lines: 3,
      fill: 40,
      field: 50,
      reflow: 76,
      expand: 102,
      end: 133,
    });
    expect(mondrianSplitLength).toBe(timeline.end);
    expect(getMondrianSplitTimeline({ splits: 3 }).end).toBeLessThan(133);
    expect(getMondrianSplitTimeline({ splits: 12 }).end).toBeGreaterThan(133);
    const capped = getMondrianSplitTimeline({ splits: 12 });
    expect(getMondrianSplitTimeline({ splits: 40 })).toEqual(capped);
    expect(getMondrianSplitTimeline({ splits: Number.NaN })).toEqual(timeline);
  });

  it("starts blank, cuts one line at a time and ends on a fully covered frame", () => {
    const layout = getMondrianSplitLayout();
    const { timeline } = layout;
    for (const frame of [0, 2.9]) {
      const state = getMondrianSplitState(frame, layout);
      expect(state.lines).toEqual([]);
      expect(state.fills).toEqual([]);
      expect(state.field).toBeNull();
    }
    const first = getMondrianSplitState(4, layout);
    expect(first.lines).toHaveLength(1);
    expect(first.lines[0].drawn).toBeGreaterThan(0);
    expect(first.lines[0].drawn).toBeLessThan(1);
    expect(getMondrianSplitState(timeline.fill, layout).fills).toEqual([]);
    const built = getMondrianSplitState(timeline.field, layout);
    expect(built.lines).toHaveLength(layout.lines.length);
    expect(built.lines.every((line) => line.drawn === 1)).toBe(true);
    expect(built.field).toBeNull();
    const held = getMondrianSplitState(timeline.reflow, layout);
    expect(held.fills).toHaveLength(layout.fills.length);
    const target = cellOf(held, layout.target);
    if (!held.field) throw new Error("field is missing");
    expect(held.field.x).toBeCloseTo(target.x0, 6);
    expect(held.field.y).toBeCloseTo(target.y0, 6);
    expect(held.field.x + held.field.width).toBeCloseTo(target.x1, 6);
    expect(held.field.y + held.field.height).toBeCloseTo(target.y1, 6);
    for (const frame of [timeline.end, timeline.end + 12, 1000]) {
      const state = getMondrianSplitState(frame, layout);
      expect(state.lines).toEqual([]);
      expect(state.fills).toEqual([]);
      if (!state.field) throw new Error("field is missing");
      expect(state.field.x).toBeLessThanOrEqual(0);
      expect(state.field.y).toBeLessThanOrEqual(0);
      expect(state.field.x + state.field.width).toBeGreaterThanOrEqual(1280);
      expect(state.field.y + state.field.height).toBeGreaterThanOrEqual(720);
    }
  });

  it("holds the finished composition perfectly still before the reflow", () => {
    const layout = getMondrianSplitLayout();
    const settled = getMondrianSplitState(layout.timeline.field + 13, layout);
    const waiting = getMondrianSplitState(layout.timeline.reflow, layout);
    expect(waiting.cells).toEqual(settled.cells);
    expect(waiting.lines).toEqual(settled.lines);
    expect(waiting.fills).toEqual(settled.fills);
    expect(waiting.field).toEqual(settled.field);
  });

  it("adds a short tail and scales the duration with speed", () => {
    expect(getMondrianSplitDuration()).toBe(mondrianSplitLength + 12);
    expect(getMondrianSplitDuration({ speed: 0.5 })).toBe(290);
    expect(getMondrianSplitDuration({ speed: 2 })).toBe(73);
    expect(getMondrianSplitDuration({ speed: 0 })).toBe(1);
    const long = getMondrianSplitTimeline({ splits: 12 }).end;
    expect(getMondrianSplitDuration({ splits: 12 })).toBe(long + 12);
  });
});

describe("mondrian split composition", () => {
  it("tiles 16:9, 1:1 and 9:16 frames with exactly the requested cells", () => {
    for (const [width, height] of SIZES) {
      for (const splits of [3, 7, 12]) {
        for (const seed of SEEDS) {
          const layout = getMondrianSplitLayout({
            seed,
            splits,
            width,
            height,
          });
          expect(layout.lines).toHaveLength(splits);
          expect(layout.leaves).toHaveLength(splits + 1);
          const boxes = layout.leaves.map((id) => layout.nodes[id].box);
          const areas = boxes.map(boxArea);
          const covered = areas.reduce((sum, value) => sum + value, 0);
          expect(covered).toBeCloseTo(width * height, 3);
          for (const box of boxes) {
            expect(box.x1 - box.x0).toBeGreaterThan(layout.minSide - 1e-6);
            expect(box.y1 - box.y0).toBeGreaterThan(layout.minSide - 1e-6);
          }
          const chosen = boxArea(layout.nodes[layout.target].box);
          expect(chosen).toBe(Math.max(...areas));
        }
      }
    }
  });

  it("ranks the expanding cell by size", () => {
    const pick = (expandCell: number) => {
      const layout = getMondrianSplitLayout({ seed: 3, expandCell });
      const areas = layout.leaves.map((id) => boxArea(layout.nodes[id].box));
      return {
        chosen: boxArea(layout.nodes[layout.target].box),
        ranked: areas.sort((a, b) => b - a),
      };
    };
    expect(pick(0).chosen).toBe(pick(0).ranked[0]);
    expect(pick(1).chosen).toBe(pick(1).ranked[1]);
    const last = pick(99);
    expect(last.chosen).toBe(last.ranked[last.ranked.length - 1]);
  });

  it("paints a few other cells in distinct slots and keeps the field for the expanding cell", () => {
    for (const seed of SEEDS) {
      const layout = getMondrianSplitLayout({ seed });
      const slots = layout.fills.map((fill) => fill.slot).sort();
      expect(slots).toEqual(["blue", "yellow"]);
      const painted = new Set(layout.fills.map((fill) => fill.node));
      expect(painted.size).toBe(layout.fills.length);
      expect(painted.has(layout.target)).toBe(false);
      expect(layout.field.node).toBe(layout.target);
    }
  });

  it("draws every line from its older boundary toward the newer one", () => {
    for (const seed of SEEDS) {
      const layout = getMondrianSplitLayout({ seed, splits: 12 });
      for (const line of layout.lines) {
        const { bounds } = layout.nodes[line.node];
        const near = line.axis === "x" ? bounds.top : bounds.left;
        const far = line.axis === "x" ? bounds.bottom : bounds.right;
        const origin = line.fromEnd ? far : near;
        const destination = line.fromEnd ? near : far;
        expect(origin).toBeLessThanOrEqual(destination);
        expect(destination).toBeLessThan(line.id);
      }
    }
  });
});

describe("mondrian split rubber grid", () => {
  it("derives every cell from the current line positions throughout the reflow", () => {
    for (const [width, height] of SIZES) {
      for (const seed of SEEDS.slice(0, 8)) {
        const layout = getMondrianSplitLayout({ seed, width, height });
        const { reflow, expand } = layout.timeline;
        for (let frame = reflow; frame < expand; frame += 1.5) {
          const state = getMondrianSplitState(frame, layout);
          const xs = [0, width, ...positionsOn(state, "x")];
          const ys = [0, height, ...positionsOn(state, "y")];
          let covered = 0;
          for (const cell of state.cells) {
            expect(cell.x1 - cell.x0).toBeGreaterThan(0);
            expect(cell.y1 - cell.y0).toBeGreaterThan(0);
            expect(xs.some((x) => same(x, cell.x0))).toBe(true);
            expect(xs.some((x) => same(x, cell.x1))).toBe(true);
            expect(ys.some((y) => same(y, cell.y0))).toBe(true);
            expect(ys.some((y) => same(y, cell.y1))).toBe(true);
            covered += boxArea(cell);
          }
          expect(covered).toBeCloseTo(width * height, 3);
        }
      }
    }
  });

  it("drags the same cells with a sliding line, in lockstep, for its whole slide", () => {
    for (const seed of SEEDS.slice(0, 12)) {
      const layout = getMondrianSplitLayout({ seed });
      expect(layout.moves.length).toBeGreaterThan(0);
      for (const move of layout.moves) {
        const distance = Math.abs(move.to - move.from);
        expect(distance).toBeGreaterThanOrEqual(layout.minMove - 1e-9);
        for (const line of layout.lines) {
          if (line.track !== move.track) continue;
          const at = (offset: number) => {
            const state = getMondrianSplitState(move.start + offset, layout);
            return neighbours(state, line.id);
          };
          const start = at(0);
          expect(start.before.length).toBeGreaterThan(0);
          expect(start.after.length).toBeGreaterThan(0);
          for (const offset of [4, 9, 14, 20]) {
            const current = at(offset);
            expect(current.before).toEqual(start.before);
            expect(current.after).toEqual(start.after);
          }
          if (move.start + 20 <= layout.timeline.expand) {
            expect(at(20).position).toBeCloseTo(move.to, 6);
          }
        }
      }
    }
  });

  it("lands every sliding line on another line or clearly away from all of them", () => {
    for (const [width, height] of SIZES) {
      for (const seed of SEEDS) {
        const layout = getMondrianSplitLayout({ seed, width, height });
        const settle = (track: number, position: number) =>
          layout.moves.find((move) => move.track === track)?.to ?? position;
        for (const move of layout.moves) {
          const moving = layout.lines.find((line) => line.track === move.track);
          if (!moving) throw new Error(`track ${move.track} has no line`);
          const rivals = layout.lines.filter(
            (line) => line.axis === moving.axis && line.track !== move.track,
          );
          for (const line of rivals) {
            const rest = settle(line.track, line.position);
            const offset = Math.abs(rest - move.to);
            if (offset < 1e-6) continue;
            expect(offset).toBeGreaterThanOrEqual(layout.align - 1e-6);
          }
        }
      }
    }
  });

  it("keeps every fill glued to its cell while the grid reflows", () => {
    for (const seed of SEEDS.slice(0, 12)) {
      const layout = getMondrianSplitLayout({ seed });
      const { reflow, expand } = layout.timeline;
      for (let frame = reflow; frame < expand; frame += 2) {
        const state = getMondrianSplitState(frame, layout);
        const painted = [
          ...state.fills,
          ...(state.field ? [{ ...state.field, id: layout.target }] : []),
        ];
        expect(painted).toHaveLength(layout.fills.length + 1);
        for (const fill of painted) {
          const cell = cellOf(state, fill.id);
          expect(fill.x).toBeCloseTo(cell.x0, 6);
          expect(fill.y).toBeCloseTo(cell.y0, 6);
          expect(fill.x + fill.width).toBeCloseTo(cell.x1, 6);
          expect(fill.y + fill.height).toBeCloseTo(cell.y1, 6);
        }
      }
    }
  });

  it("pushes the expanding cell's own lines out past every frame edge", () => {
    for (const [width, height] of [...SIZES, [2560, 720]]) {
      for (const seed of SEEDS.slice(0, 8)) {
        for (const expandCell of [0, 3]) {
          const layout = getMondrianSplitLayout({
            seed,
            width,
            height,
            expandCell,
          });
          const { bounds } = layout.nodes[layout.target];
          const { expand, end } = layout.timeline;
          for (let frame = expand; frame <= end; frame++) {
            const state = getMondrianSplitState(frame, layout);
            const cell = cellOf(state, layout.target);
            const edges = [
              { bound: bounds.left, edge: cell.x0 },
              { bound: bounds.top, edge: cell.y0 },
              { bound: bounds.right, edge: cell.x1 },
              { bound: bounds.bottom, edge: cell.y1 },
            ];
            for (const { bound, edge } of edges) {
              const line = state.lines.find((item) => item.id === bound);
              if (line) expect(line.position).toBeCloseTo(edge, 6);
            }
          }
          const last = getMondrianSplitState(end, layout);
          expect(last.lines).toEqual([]);
          expect(last.fills).toEqual([]);
          const clip = getMondrianSplitClip(last.field, width, height);
          expect(clip).toBe(COVERED);
        }
      }
    }
  });

  it("only ever squeezes the expanding cell while the grid reflows", () => {
    for (const [width, height] of SIZES) {
      for (const seed of SEEDS) {
        const layout = getMondrianSplitLayout({ seed, width, height });
        const { reflow, expand } = layout.timeline;
        const built = getMondrianSplitState(reflow, layout);
        const first = cellOf(built, layout.target);
        for (let frame = reflow; frame <= expand; frame++) {
          const state = getMondrianSplitState(frame, layout);
          const cell = cellOf(state, layout.target);
          expect(cell.x0).toBeGreaterThanOrEqual(first.x0 - 1e-6);
          expect(cell.y0).toBeGreaterThanOrEqual(first.y0 - 1e-6);
          expect(cell.x1).toBeLessThanOrEqual(first.x1 + 1e-6);
          expect(cell.y1).toBeLessThanOrEqual(first.y1 + 1e-6);
        }
      }
    }
    const layout = getMondrianSplitLayout();
    const { reflow, expand } = layout.timeline;
    const before = cellOf(getMondrianSplitState(reflow, layout), layout.target);
    const after = cellOf(getMondrianSplitState(expand, layout), layout.target);
    expect(boxArea(after)).toBeLessThan(boxArea(before));
  });

  it("keeps a narrow expanding cell open through its wind-up on very wide frames", () => {
    for (const seed of SEEDS) {
      for (const expandCell of [6, 9, 12]) {
        const layout = getMondrianSplitLayout({
          seed,
          splits: 12,
          expandCell,
          width: 2560,
          height: 720,
        });
        const { expand, end } = layout.timeline;
        for (let frame = expand; frame <= end; frame++) {
          const state = getMondrianSplitState(frame, layout);
          const cell = cellOf(state, layout.target);
          expect(cell.x1 - cell.x0).toBeGreaterThan(0);
          expect(cell.y1 - cell.y0).toBeGreaterThan(0);
          expect(state.field).not.toBeNull();
        }
      }
    }
  });

  it("only grows the expanding cell once every wind-up has passed", () => {
    for (const seed of SEEDS.slice(0, 8)) {
      const layout = getMondrianSplitLayout({ seed });
      const { expand, end } = layout.timeline;
      let previous = 0;
      for (let frame = expand + 14; frame <= end; frame++) {
        const { field } = getMondrianSplitState(frame, layout);
        if (!field) throw new Error("field is missing");
        const size = field.width * field.height;
        expect(size).toBeGreaterThanOrEqual(previous - 1e-6);
        previous = size;
      }
    }
  });
});

describe("mondrian split determinism", () => {
  it("renders any frame identically no matter the order it is sampled in", () => {
    const frames = [0, 17, 41, 58, 77, 91, 104, 120, 133, 200];
    const layout = getMondrianSplitLayout({ seed: 11 });
    const forward = frames.map((frame) => getMondrianSplitState(frame, layout));
    const fresh = () => getMondrianSplitLayout({ seed: 11 });
    const replay = [...frames].reverse();
    const later = replay.map((frame) => getMondrianSplitState(frame, fresh()));
    expect(later.reverse()).toEqual(forward);
  });

  it("gives a seed the same grid every time and a new seed a new grid", () => {
    const layout = getMondrianSplitLayout({ seed: 5 });
    expect(getMondrianSplitLayout({ seed: 5 })).toEqual(layout);
    const next = getMondrianSplitLayout({ seed: 6 });
    const positions = (value: typeof layout) =>
      value.lines.map((line) => line.position);
    expect(positions(next)).not.toEqual(positions(layout));
  });

  it("refines the same grid when the split count rises", () => {
    const shape = (splits: number) => {
      const { lines } = getMondrianSplitLayout({ splits });
      return lines.map((line) => [line.axis, line.position, line.node]);
    };
    expect(shape(9).slice(0, 5)).toEqual(shape(5));
  });
});

describe("mondrian split children and config", () => {
  it("clips children to nothing until the expanding cell fills", () => {
    const layout = getMondrianSplitLayout();
    const early = getMondrianSplitState(layout.timeline.field, layout);
    expect(getMondrianSplitClip(early.field, 1280, 720)).toBe("inset(50%)");
  });

  it("mirrors the component defaults and duration", () => {
    const { controls, durationInFrames, previewBackdrop } = mondrianSplitConfig;
    const keys = Object.keys(controls).sort();
    expect(keys).toEqual(Object.keys(mondrianSplitDefaults).sort());
    for (const [key, value] of Object.entries(mondrianSplitDefaults)) {
      const field = controls[key];
      const declared = field && "default" in field ? field.default : undefined;
      expect(declared).toBe(value);
    }
    expect(durationInFrames).toBe(getMondrianSplitDuration());
    const faster = mondrianSplitConfig.getDurationInFrames?.({ speed: 2 });
    expect(faster).toBe(getMondrianSplitDuration({ speed: 2 }));
    const denser = mondrianSplitConfig.getDurationInFrames?.({ splits: 12 });
    expect(denser).toBe(getMondrianSplitDuration({ splits: 12 }));
    expect(previewBackdrop).toEqual({ type: "color", value: "#f3efe6" });
  });
});
