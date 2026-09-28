import { describe, expect, it } from "bun:test";
import { getDefaults, resolveControls } from "@/lib/customizer-config";
import {
  getTruchetFlipAngle,
  getTruchetFlipDuration,
  getTruchetFlipGrid,
  getTruchetFlipSnap,
  getTruchetFlipState,
  getTruchetFlipTilePath,
  getTruchetFlipTimeline,
  truchetFlipDefaults,
  truchetFlipLength,
} from "..";
import { truchetFlipConfig } from "../config";

type Side = "top" | "right" | "bottom" | "left";
type Cell = { col: number; row: number };
type State = ReturnType<typeof getTruchetFlipState>;

const CENTER = ["-1:-1", "0:-1", "-1:0", "0:0"];

const STEP: Record<Side, [number, number]> = {
  top: [0, -1],
  right: [1, 0],
  bottom: [0, 1],
  left: [-1, 0],
};

const OPPOSITE: Record<Side, Side> = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right",
};

const numbers = (path: string) =>
  (path.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);

const orientationOf = (angle: number) => (((angle / 90) % 2) + 2) % 2;

const distance = ({ col, row }: Cell) => Math.hypot(col + 0.5, row + 0.5);

function rotate(x: number, y: number, angle: number): [number, number] {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.round(Math.cos(radians));
  const sin = Math.round(Math.sin(radians));
  return [x * cos - y * sin, x * sin + y * cos];
}

function sideOf([x, y]: [number, number]): Side {
  if (y <= -0.5) return "top";
  if (x >= 0.5) return "right";
  if (y >= 0.5) return "bottom";
  return "left";
}

function connections() {
  const values = numbers(getTruchetFlipTilePath(2, "stroke", 0));
  const arcs = [
    [values[0], values[1], values[7], values[8]],
    [values[9], values[10], values[16], values[17]],
  ];
  return [0, 90].map((angle) => {
    const exits = new Map<Side, Side>();
    for (const [x1, y1, x2, y2] of arcs) {
      const from = sideOf(rotate(x1, y1, angle));
      const to = sideOf(rotate(x2, y2, angle));
      exits.set(from, to);
      exits.set(to, from);
    }
    return exits;
  });
}

function trace(state: State, col: number, row: number, side: Side) {
  const exits = connections();
  const orientation = new Map<string, number>();
  for (const tile of state.tiles) {
    orientation.set(`${tile.col}:${tile.row}`, orientationOf(tile.angle));
  }
  let cursor = { col, row, side };
  for (let step = 1; step <= 400; step++) {
    const current = orientation.get(`${cursor.col}:${cursor.row}`);
    if (current === undefined) return null;
    const exit = exits[current].get(cursor.side);
    if (exit === undefined) return null;
    const [dx, dy] = STEP[exit];
    const next = { col: cursor.col + dx, row: cursor.row + dy };
    cursor = { ...next, side: OPPOSITE[exit] };
    if (cursor.col === col && cursor.row === row && cursor.side === side) {
      return step;
    }
  }
  return null;
}

describe("truchet flip timeline", () => {
  it("settles the default resolve at the documented length", () => {
    const timeline = getTruchetFlipTimeline();
    expect(truchetFlipLength).toBe(102);
    expect(timeline.starts).toEqual([6, 30]);
    expect(timeline.resolveStart).toBe(60);
    expect(timeline.settled).toBe(truchetFlipLength);
    expect(timeline.duration).toBe(120);
    expect(getTruchetFlipDuration()).toBe(truchetFlipConfig.durationInFrames);
  });

  it("scales the preview duration with speed, passes and loop", () => {
    expect(getTruchetFlipDuration({ speed: 2 })).toBe(60);
    expect(getTruchetFlipDuration({ speed: 0.5 })).toBe(240);
    expect(getTruchetFlipDuration({ speed: 0 })).toBe(1);
    expect(getTruchetFlipDuration({ passes: 0 })).toBe(66);
    expect(getTruchetFlipDuration({ passes: 4 })).toBe(168);
    expect(getTruchetFlipDuration({ passes: 9 })).toBe(168);
    expect(getTruchetFlipDuration({ passes: Number.NaN })).toBe(120);
    expect(getTruchetFlipDuration({ loop: true })).toBe(168);
    const resolve = truchetFlipConfig.getDurationInFrames;
    expect(resolve?.({ speed: 0.5, passes: 1, loop: true })).toBe(288);
  });

  it("holds the seeded maze still until the first wave arrives", () => {
    for (const frame of [0, 3, 6]) {
      for (const tile of getTruchetFlipState(frame).tiles) {
        expect(tile.angle).toBe(tile.initial * 90);
      }
    }
    const { tiles } = getTruchetFlipState(8);
    const turning = tiles.filter((tile) => !Number.isInteger(tile.angle / 90));
    expect(turning.length).toBeGreaterThan(0);
  });

  it("rests every tile exactly on its target once the resolve settles", () => {
    for (const frame of [truchetFlipLength, 110, 119, 500]) {
      for (const tile of getTruchetFlipState(frame).tiles) {
        expect(Number.isInteger(tile.angle / 90)).toBe(true);
        expect(orientationOf(tile.angle)).toBe(tile.target);
      }
    }
  });
});

describe("truchet flip snap", () => {
  it("snaps fast, overshoots a little and lands on the quarter", () => {
    expect(getTruchetFlipSnap(-4)).toBe(0);
    expect(getTruchetFlipSnap(0)).toBe(0);
    expect(getTruchetFlipSnap(Number.NaN)).toBe(0);
    expect(getTruchetFlipSnap(1)).toBeGreaterThan(0.15);
    expect(getTruchetFlipSnap(4)).toBeCloseTo(1, 6);
    expect(getTruchetFlipSnap(12)).toBe(1);
    expect(getTruchetFlipSnap(40)).toBe(1);
    const times = Array.from({ length: 1200 }, (_, i) => i / 100);
    const samples = times.map(getTruchetFlipSnap);
    const peak = Math.max(...samples);
    expect(peak).toBeGreaterThan(1.04);
    expect(peak).toBeLessThan(1.1);
    for (let i = 1; i < 500; i++) {
      expect(samples[i]).toBeGreaterThan(samples[i - 1]);
    }
    expect(Math.abs(samples[1199] - 1)).toBeLessThan(0.002);
  });
});

describe("truchet flip wave order", () => {
  it("spreads the radial wave outward from the center vertex", () => {
    const { tiles } = getTruchetFlipGrid();
    const sorted = [...tiles].sort((a, b) => distance(a) - distance(b));
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].delay).toBeGreaterThanOrEqual(sorted[i - 1].delay);
    }
    const first = tiles.filter((tile) => tile.delay === 0);
    expect(first.map((tile) => `${tile.col}:${tile.row}`)).toEqual(CENTER);
    expect(Math.max(...tiles.map((tile) => tile.delay))).toBe(30);
  });

  it("sweeps the diagonal from the top-left corner to the bottom-right", () => {
    const { tiles } = getTruchetFlipGrid({ waveMode: "diagonal" });
    const index = ({ col, row }: Cell) => col + row;
    const sorted = [...tiles].sort((a, b) => index(a) - index(b));
    for (let i = 1; i < sorted.length; i++) {
      const step = index(sorted[i]) - index(sorted[i - 1]);
      const gap = sorted[i].delay - sorted[i - 1].delay;
      expect(step === 0 ? gap === 0 : gap > 0).toBe(true);
    }
    expect(sorted[0].delay).toBe(0);
    expect(sorted[sorted.length - 1].delay).toBe(30);
  });

  it("shuffles the random wave by seed at an even start rate", () => {
    const grid = getTruchetFlipGrid({ waveMode: "random", seed: 4 });
    const again = getTruchetFlipGrid({ waveMode: "random", seed: 4 });
    const other = getTruchetFlipGrid({ waveMode: "random", seed: 5 });
    expect(again).toEqual(grid);
    const delays = grid.tiles.map((tile) => tile.delay);
    expect(other.tiles.map((tile) => tile.delay)).not.toEqual(delays);
    const sorted = [...delays].sort((a, b) => a - b);
    expect(delays).not.toEqual(sorted);
    const step = 30 / (sorted.length - 1);
    for (const [rank, delay] of sorted.entries()) {
      expect(delay).toBeCloseTo(rank * step, 2);
    }
  });
});

describe("truchet flip resolve", () => {
  it("turns every tile each pass, then only the tiles off target", () => {
    const timeline = getTruchetFlipTimeline();
    const { tiles } = getTruchetFlipGrid();
    let resolving = 0;
    for (const tile of tiles) {
      const at = (time: number) => getTruchetFlipAngle(tile, time, timeline);
      const turned = (begin: number) => at(begin + 12.5) - at(begin - 0.5);
      for (const start of timeline.starts) {
        expect(Math.abs(turned(start + tile.delay))).toBe(90);
      }
      const begin = timeline.resolveStart + tile.delay;
      const change = Math.abs(turned(begin));
      const needed = orientationOf(at(begin - 0.5)) !== tile.target;
      expect(change).toBe(needed ? 90 : 0);
      if (needed) resolving++;
    }
    expect(resolving).toBeGreaterThan(0);
    expect(resolving).toBeLessThan(tiles.length);
  });

  it("closes the rings into a center circle and concentric loops", () => {
    const state = getTruchetFlipState(truchetFlipLength);
    const loops = [1, 2, 3, 4].map((k) => trace(state, 0, -k, "bottom"));
    expect(loops).toEqual([4, 12, 20, 28]);
  });

  it("aligns the field into open diagonals that run off the frame", () => {
    const state = getTruchetFlipState(truchetFlipLength, { resolve: "field" });
    const targets = state.tiles.map((tile) => tile.target);
    expect(targets.every((target) => target === 0)).toBe(true);
    for (const k of [1, 2, 3, 4]) {
      expect(trace(state, 0, -k, "bottom")).toBeNull();
    }
  });

  it("closes the silhouette into small rings inside a centered circle", () => {
    const settled = truchetFlipLength;
    const state = getTruchetFlipState(settled, { resolve: "silhouette" });
    const circles = [1, 2, 3].map((k) => trace(state, 0, -k, "bottom"));
    expect(circles).toEqual([4, 4, 4]);
    const inside = state.tiles.filter((tile) => distance(tile) < 3.8);
    const outside = state.tiles.filter((tile) => distance(tile) >= 3.8);
    expect(inside.some((tile) => tile.target === 1)).toBe(true);
    expect(outside.every((tile) => tile.target === 0)).toBe(true);
    expect(trace(state, 0, -5, "bottom")).toBeNull();
  });
});

describe("truchet flip determinism", () => {
  it("renders any frame identically in any sampling order", () => {
    const sample = (frame: number) =>
      getTruchetFlipState(frame, { seed: 11, waveMode: "random", passes: 3 });
    const frames = [0, 21, 57, 90, 133, 160];
    const forward = frames.map(sample);
    const backward = [...frames].reverse().map(sample).reverse();
    expect(backward).toEqual(forward);
    expect(sample(57)).toEqual(forward[2]);
  });

  it("changes the opening maze with the seed and keeps it balanced", () => {
    const maze = (seed: number) =>
      getTruchetFlipGrid({ seed }).tiles.map((tile) => tile.initial);
    expect(maze(1)).toEqual(maze(1));
    expect(maze(2)).not.toEqual(maze(1));
    const turned = maze(1).filter((value) => value === 1).length;
    expect(turned).toBeGreaterThan(180 * 0.3);
    expect(turned).toBeLessThan(180 * 0.7);
  });

  it("loops back to the opening maze without a seam", () => {
    const options = { loop: true };
    const { duration } = getTruchetFlipTimeline(options);
    expect(duration).toBe(168);
    const first = getTruchetFlipState(0, options).tiles;
    const last = getTruchetFlipState(duration - 1, options).tiles;
    for (const [index, tile] of first.entries()) {
      const halfTurns = (last[index].angle - tile.angle) / 180;
      expect(Math.abs(halfTurns - Math.round(halfTurns))).toBeLessThan(0.001);
    }
    const later = getTruchetFlipState(duration + 37, options);
    expect(later).toEqual(getTruchetFlipState(37, options));
  });

  it("maps other frame rates and speeds onto the 30 fps timeline", () => {
    const base = getTruchetFlipState(45).tiles;
    expect(getTruchetFlipState(90, { fps: 60 }).tiles).toEqual(base);
    expect(getTruchetFlipState(90, { speed: 0.5 }).tiles).toEqual(base);
    const frozen = getTruchetFlipState(90, { speed: 0 }).tiles;
    expect(frozen).toEqual(getTruchetFlipState(0).tiles);
  });
});

describe("truchet flip geometry", () => {
  it("covers wide, square and tall frames with short-side tiles", () => {
    for (const [width, height] of [
      [1280, 720],
      [720, 1280],
      [1080, 1080],
      [2560, 720],
    ]) {
      const grid = getTruchetFlipGrid({ width, height });
      const half = grid.size / 2;
      expect(grid.size).toBeCloseTo(Math.min(width, height) / 10, 6);
      for (const tile of grid.tiles) {
        expect(tile.x + half).toBeGreaterThan(0);
        expect(tile.x - half).toBeLessThan(width);
        expect(tile.y + half).toBeGreaterThan(0);
        expect(tile.y - half).toBeLessThan(height);
      }
      const xs = grid.tiles.map((tile) => tile.x);
      const ys = grid.tiles.map((tile) => tile.y);
      expect(Math.min(...xs) - half).toBeLessThanOrEqual(0.001);
      expect(Math.max(...xs) + half).toBeGreaterThanOrEqual(width - 0.001);
      expect(Math.min(...ys) - half).toBeLessThanOrEqual(0.001);
      expect(Math.max(...ys) + half).toBeGreaterThanOrEqual(height - 0.001);
      const origin = grid.tiles.find(({ col, row }) => col === 0 && row === 0);
      expect(origin?.x).toBeCloseTo(width / 2 + half, 2);
      expect(origin?.y).toBeCloseTo(height / 2 + half, 2);
    }
  });

  it("keeps element counts in the hundreds and clamps invalid input", () => {
    expect(getTruchetFlipGrid().tiles).toHaveLength(180);
    expect(getTruchetFlipGrid({ tiles: 24 }).tiles.length).toBeLessThan(1100);
    expect(getTruchetFlipGrid({ tiles: Number.NaN }).count).toBe(10);
    expect(getTruchetFlipGrid({ tiles: 1 }).count).toBe(4);
    expect(getTruchetFlipGrid({ tiles: 99 }).count).toBe(24);
    expect(getTruchetFlipGrid({ tiles: 9.6 }).count).toBe(10);
    for (const tiles of [4, 7, 24]) {
      for (const frame of [0, 40, 80, 200]) {
        const state = getTruchetFlipState(frame, { tiles, weight: 9 });
        expect(state.path).not.toMatch(/NaN|Infinity/);
        expect(state.strokeWidth).toBeCloseTo(state.size * 0.34, 2);
        for (const tile of state.tiles) {
          expect(tile.transform).not.toMatch(/NaN|Infinity/);
        }
      }
    }
  });

  it("ends every arc on an edge midpoint so neighbors join at rest", () => {
    const values = numbers(getTruchetFlipTilePath(72, "stroke", 0.75));
    expect(values).toHaveLength(18);
    const ends = [
      [values[0], values[1], 0, -36],
      [values[7], values[8], -36, 0],
      [values[9], values[10], 0, 36],
      [values[16], values[17], 36, 0],
    ];
    for (const [x, y, midX, midY] of ends) {
      expect(Math.hypot(x - midX, y - midY)).toBeCloseTo(0.75, 2);
    }
    const filled = getTruchetFlipTilePath(72, "filled", 0.75);
    expect(filled.match(/Z/g)).toHaveLength(2);
    expect(filled).not.toMatch(/NaN/);
  });

  it("fills the same two corners with quarter discs", () => {
    const values = numbers(getTruchetFlipTilePath(72, "filled", 0.75));
    expect(values).toHaveLength(22);
    for (const [offset, corner] of [
      [0, -36],
      [11, 36],
    ]) {
      const pushed = corner + Math.sign(corner) * 0.75;
      expect(values[offset]).toBeCloseTo(pushed, 2);
      expect(values[offset + 1]).toBeCloseTo(pushed, 2);
      for (const point of [offset + 2, offset + 9]) {
        const x = values[point] - corner;
        const y = values[point + 1] - corner;
        expect(Math.hypot(x, y)).toBeCloseTo(36, 2);
      }
    }
    const state = getTruchetFlipState(0, { variant: "filled" });
    expect(state.variant).toBe("filled");
    expect(state.path).toBe(getTruchetFlipTilePath(state.size, "filled"));
  });
});

describe("truchet flip config", () => {
  it("matches the component defaults and exposes every mode", () => {
    const { controls: schema } = truchetFlipConfig;
    const controls = resolveControls("truchet-flip", schema);
    expect(getDefaults(controls)).toEqual({
      ...truchetFlipDefaults,
      secondaryColor: truchetFlipDefaults.color,
    });
    const options = (key: string) => {
      const control = controls[key];
      return control.type === "select" ? control.options : [];
    };
    expect(options("waveMode")).toEqual(["radial", "diagonal", "random"]);
    expect(options("resolve")).toEqual(["rings", "field", "silhouette"]);
    expect(options("variant")).toEqual(["stroke", "filled"]);
    const range = (key: string) => {
      const control = controls[key];
      return control.type === "number" ? [control.min, control.max] : [];
    };
    expect(range("tiles")).toEqual([4, 24]);
    expect(range("weight")).toEqual([0.04, 0.34]);
    expect(range("passes")).toEqual([0, 4]);
  });
});
