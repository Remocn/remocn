import { describe, expect, it } from "bun:test";
import {
  bauhausBuildBand,
  bauhausBuildDefaults,
  bauhausBuildGrid,
  bauhausBuildLength,
  bauhausBuildPieces,
  bauhausBuildTimeline,
  getBauhausBuildDuration,
  getBauhausBuildField,
  getBauhausBuildOrder,
  getBauhausBuildState,
  getBauhausBuildVariant,
  getBauhausFootprint,
  getBauhausPaths,
  getBauhausPoseFrame,
  getBauhausShapePath,
  getBauhausStepFrame,
  getTumbleDuration,
  getTumbleProgress,
  getUnfoldScale,
} from "..";
import { bauhausBuildConfig } from "../config";

type Frame = ReturnType<typeof getBauhausPoseFrame>;
type Box = ReturnType<typeof getBauhausFootprint>;
type Piece = (typeof bauhausBuildPieces)[number];

interface Point {
  x: number;
  y: number;
}

const radians = (degrees: number) => (degrees * Math.PI) / 180;

const toWorld = (frame: Frame, point: Point): Point => {
  const cos = Math.cos(radians(frame.rotation)) * frame.scale;
  const sin = Math.sin(radians(frame.rotation)) * frame.scale;
  return {
    x: frame.x + point.x * cos - point.y * sin,
    y: frame.y + point.x * sin + point.y * cos,
  };
};

const toLocal = (frame: Frame, point: Point): Point => {
  const cos = Math.cos(radians(frame.rotation)) / frame.scale;
  const sin = Math.sin(radians(frame.rotation)) / frame.scale;
  const dx = point.x - frame.x;
  const dy = point.y - frame.y;
  return { x: dx * cos + dy * sin, y: dy * cos - dx * sin };
};

const lean = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

const near = (a: Point, b: Point) =>
  Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6;

const corners = (box: Box): Point[] => [
  { x: box.x0, y: box.y0 },
  { x: box.x1, y: box.y0 },
  { x: box.x1, y: box.y1 },
  { x: box.x0, y: box.y1 },
];

const localCorners = (piece: { width: number; height: number }) =>
  corners({ x0: 0, y0: 0, x1: piece.width, y1: piece.height });

const areaOf = (box: Box) => (box.x1 - box.x0) * (box.y1 - box.y0);

const overlaps = (a: Box, b: Box) =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

const pathsOf = (piece: Piece) => {
  const paths = getBauhausPaths(piece);
  return [paths.enter, paths.rebuild];
};

const specOf = (id: string) => {
  const piece = bauhausBuildPieces.find((candidate) => candidate.id === id);
  if (!piece) throw new Error(`missing piece ${id}`);
  return piece;
};

const pieceAt = (time: number, id: string, seed = 1) => {
  const frame = getBauhausBuildState(time, { seed }).pieces.find(
    (candidate) => candidate.id === id,
  );
  if (!frame) throw new Error(`missing frame ${id}`);
  return frame;
};

const insideShape = (piece: Piece, { x, y }: Point) => {
  const { width, height } = piece;
  const r = width / 2;
  if (x < 0 || y < 0 || x > width || y > height) return false;
  switch (piece.shape) {
    case "circle":
      return (x - r) ** 2 + (y - r) ** 2 <= r * r;
    case "semicircle":
      return (x - r) ** 2 + (y - height) ** 2 <= r * r;
    case "quarter":
      return x ** 2 + (y - height) ** 2 <= width * width;
    default:
      return true;
  }
};

const samplesOf = (piece: Piece) => {
  const points: Point[] = [];
  for (let i = 0; i <= piece.width * 6; i++) {
    for (let j = 0; j <= piece.height * 6; j++) {
      const point = { x: i / 6, y: j / 6 };
      if (insideShape(piece, point)) points.push(point);
    }
  }
  return points;
};

describe("bauhaus build timeline", () => {
  it("opens on an empty frame for every seed", () => {
    for (let seed = 1; seed <= 12; seed++) {
      for (const time of [0, 0.5]) {
        const { pieces } = getBauhausBuildState(time, { seed });
        expect(pieces.some((piece) => piece.visible)).toBe(false);
      }
    }
  });

  it("unfolds each arrival from its hinge and lands it on the six-frame beat", () => {
    const { lead, beat } = bauhausBuildTimeline;
    for (const seed of [1, 2, 5, 9]) {
      for (const [arrival, piece] of getBauhausBuildOrder(seed).entries()) {
        const duration = getTumbleDuration(piece);
        const land = lead + arrival * beat;
        const start = land - piece.enter.length * duration;
        expect(start).toBeGreaterThan(0.5);
        expect(pieceAt(start - 0.01, piece.id, seed).visible).toBe(false);
        const unfolding = pieceAt(start + 0.01, piece.id, seed);
        expect(unfolding.scale).toBeGreaterThan(0);
        expect(unfolding.scale).toBeLessThan(0.05);
        const grown = pieceAt(start + duration, piece.id, seed);
        expect(grown.scale).toBeCloseTo(1, 6);
        const rest = getBauhausPoseFrame(piece, piece.slot);
        const landing = pieceAt(land, piece.id, seed);
        expect(landing.pivot).not.toBeNull();
        expect(lean(landing.rotation, rest.rotation)).toBeCloseTo(4.5, 6);
        const settled = pieceAt(land + duration / 2 + 0.01, piece.id, seed);
        expect(settled).toMatchObject(rest);
      }
    }
  });

  it("holds the frieze from the last landing until the rebuild", () => {
    const settled = getBauhausBuildState(75.01).pieces;
    expect(getBauhausBuildState(89.99).pieces).toEqual(settled);
    for (const frame of settled) {
      const piece = specOf(frame.id);
      expect(frame).toMatchObject(getBauhausPoseFrame(piece, piece.slot));
    }
  });

  it("ends on the handoff at the documented length and holds it", () => {
    const moving = getBauhausBuildState(bauhausBuildLength - 1).pieces;
    expect(moving.some((frame) => frame.pivot !== null)).toBe(true);
    for (const time of [bauhausBuildLength, 150, 1000]) {
      for (const frame of getBauhausBuildState(time).pieces) {
        const piece = specOf(frame.id);
        const handoff = getBauhausPaths(piece).handoff;
        expect(frame).toMatchObject(getBauhausPoseFrame(piece, handoff));
        expect(frame.visible).toBe(true);
      }
    }
  });

  it("adjusts the preview duration with speed and loop", () => {
    expect(getBauhausBuildDuration()).toBe(150);
    expect(bauhausBuildConfig.durationInFrames).toBe(150);
    expect(bauhausBuildConfig.getDurationInFrames?.({ speed: 0.5 })).toBe(300);
    expect(getBauhausBuildDuration({ speed: 2 })).toBe(75);
    expect(getBauhausBuildDuration({ speed: 0 })).toBe(1);
    expect(getBauhausBuildDuration({ loop: true })).toBe(300);
    expect(getBauhausBuildDuration({ loop: true, speed: 2 })).toBe(150);
  });
});

describe("bauhaus build corner tumble", () => {
  it("hinges each quarter turn on a leading-edge corner and lands beyond it", () => {
    for (const piece of bauhausBuildPieces) {
      for (const path of pathsOf(piece)) {
        for (const step of path) {
          const from = getBauhausFootprint(piece, step.from);
          const to = getBauhausFootprint(piece, step.to);
          expect(corners(from)).toContainEqual(step.pivot);
          expect(corners(to)).toContainEqual(step.pivot);
          expect(step.to.turn).toBe((step.from.turn + step.spin + 4) % 4);
          expect(areaOf(to)).toBe(areaOf(from));
          switch (step.move.charAt(0)) {
            case "R":
              expect(step.pivot.x).toBe(from.x1);
              expect(to.x0).toBe(from.x1);
              break;
            case "L":
              expect(step.pivot.x).toBe(from.x0);
              expect(to.x1).toBe(from.x0);
              break;
            case "D":
              expect(step.pivot.y).toBe(from.y1);
              expect(to.y0).toBe(from.y1);
              break;
            default:
              expect(step.pivot.y).toBe(from.y0);
              expect(to.y1).toBe(from.y0);
          }
        }
      }
    }
  });

  it("moves the hinge to another corner after every quarter turn, into the rebuild too", () => {
    for (const piece of bauhausBuildPieces) {
      const paths = getBauhausPaths(piece);
      const hinges = [...paths.enter, ...paths.rebuild].map((step) => {
        const rest = getBauhausPoseFrame(piece, step.from);
        const local = toLocal(rest, step.pivot);
        return `${Math.round(local.x)},${Math.round(local.y)}`;
      });
      for (let index = 1; index < hinges.length; index++) {
        expect(hinges[index]).not.toBe(hinges[index - 1]);
      }
    }
  });

  it("hinges arcs and half disks on a point of the shape", () => {
    for (const piece of bauhausBuildPieces) {
      if (piece.shape === "circle") continue;
      const paths = getBauhausPaths(piece);
      for (const step of [...paths.enter, ...paths.rebuild]) {
        const rest = getBauhausPoseFrame(piece, step.from);
        const local = toLocal(rest, step.pivot);
        const hinge = { x: Math.round(local.x), y: Math.round(local.y) };
        expect(insideShape(piece, hinge)).toBe(true);
      }
    }
  });

  it("turns rigidly about a fixed hinge at every progress and unfold scale", () => {
    for (const piece of bauhausBuildPieces) {
      for (const path of pathsOf(piece)) {
        for (const step of path) {
          const rest = getBauhausPoseFrame(piece, step.from);
          const hinge = toLocal(rest, step.pivot);
          for (const progress of [0, 0.25, 0.5, 0.8, 1, 1.05]) {
            for (const grow of [0.2, 1]) {
              const frame = getBauhausStepFrame(piece, step, progress, grow);
              const point = toWorld(frame, hinge);
              expect(point.x).toBeCloseTo(step.pivot.x, 9);
              expect(point.y).toBeCloseTo(step.pivot.y, 9);
            }
          }
        }
      }
    }
  });

  it("lands exactly on the next rest pose after a full quarter turn", () => {
    for (const piece of bauhausBuildPieces) {
      const paths = getBauhausPaths(piece);
      expect(paths.enter.at(-1)?.to).toEqual(piece.slot);
      expect(paths.start).not.toEqual(piece.slot);
      for (const path of pathsOf(piece)) {
        for (const step of path) {
          const turned = getBauhausStepFrame(piece, step, 1);
          const rest = getBauhausPoseFrame(piece, step.to);
          expect(turned.x).toBeCloseTo(rest.x, 9);
          expect(turned.y).toBeCloseTo(rest.y, 9);
          expect(lean(turned.rotation, rest.rotation)).toBeCloseTo(0, 9);
        }
      }
    }
  });

  it("overshoots only on the landing turn, by at most 4.5 degrees", () => {
    for (const piece of bauhausBuildPieces) {
      const duration = getTumbleDuration(piece);
      let peak = 0;
      for (let sample = 0; sample <= 300; sample++) {
        const elapsed = (duration * 1.5 * sample) / 300;
        const travel = getTumbleProgress(elapsed, duration, false);
        expect(travel).toBeLessThanOrEqual(1);
        peak = Math.max(peak, getTumbleProgress(elapsed, duration, true));
      }
      expect(peak).toBeGreaterThan(1);
      expect((peak - 1) * 90).toBeLessThanOrEqual(4.5 + 1e-9);
      expect(getTumbleProgress(0, duration, true)).toBe(0);
      const settled = getTumbleProgress(duration * 1.5, duration, true);
      expect(settled).toBeCloseTo(1, 12);
    }
    expect(getUnfoldScale(0)).toBe(0);
    expect(getUnfoldScale(1)).toBe(1);
    expect(getUnfoldScale(0.5)).toBeGreaterThan(getUnfoldScale(0.25));
  });

  it("weighs larger pieces with slower quarter turns", () => {
    expect(getTumbleDuration(specOf("tile"))).toBe(5);
    expect(getTumbleDuration(specOf("block"))).toBeCloseTo(7.071, 3);
    expect(getTumbleDuration(specOf("sun"))).toBe(10);
    expect(getTumbleDuration(specOf("pillar"))).toBe(10);
  });

  it("hinges every moving frame on a corner of the piece at a grid point", () => {
    for (const seed of [1, 2, 3, 4]) {
      for (let time = 0; time <= 150; time += 0.5) {
        for (const frame of getBauhausBuildState(time, { seed }).pieces) {
          const pivot = frame.pivot;
          if (pivot && frame.scale > 0.05) {
            const local = toLocal(frame, pivot);
            const hinged = localCorners(frame).some((c) => near(c, local));
            expect(hinged).toBe(true);
            expect(Number.isInteger(pivot.x)).toBe(true);
            expect(Number.isInteger(pivot.y)).toBe(true);
          }
        }
      }
    }
  });
});

describe("bauhaus build compositions", () => {
  const slots = bauhausBuildPieces.map((piece) =>
    getBauhausFootprint(piece, piece.slot),
  );
  const handoffs = bauhausBuildPieces.map((piece) =>
    getBauhausFootprint(piece, getBauhausPaths(piece).handoff),
  );

  it("keeps both compositions inside the poster without overlaps", () => {
    for (const boxes of [slots, handoffs]) {
      for (const [index, box] of boxes.entries()) {
        expect(box.x0).toBeGreaterThanOrEqual(0);
        expect(box.y0).toBeGreaterThanOrEqual(0);
        expect(box.x1).toBeLessThanOrEqual(bauhausBuildGrid);
        expect(box.y1).toBeLessThanOrEqual(bauhausBuildGrid);
        for (const other of boxes.slice(index + 1)) {
          expect(overlaps(box, other)).toBe(false);
        }
      }
    }
  });

  it("builds a frieze across the band, then opens the band for the handoff", () => {
    const { top, bottom } = bauhausBuildBand;
    const inBand = (box: Box) => box.y0 < bottom && box.y1 > top;
    expect(slots.filter(inBand).length).toBeGreaterThanOrEqual(5);
    expect(handoffs.filter(inBand)).toEqual([]);
  });

  it("matches the designed handoff layout", () => {
    const handoff = (id: string) => getBauhausPaths(specOf(id)).handoff;
    expect(handoff("hill")).toEqual({ turn: 2, x: 0, y: 8 });
    expect(handoff("tile")).toEqual({ turn: 1, x: 4, y: 8 });
    expect(handoff("pillar")).toEqual({ turn: 2, x: 2, y: 3 });
    expect(handoff("sun")).toEqual({ turn: 3, x: 6, y: 0 });
    expect(handoff("dome")).toEqual({ turn: 0, x: 3, y: 1 });
    expect(handoff("post")).toEqual({ turn: 0, x: 8, y: 8 });
    expect(handoff("dot")).toEqual({ turn: 3, x: 10, y: 3 });
    expect(handoff("block")).toEqual({ turn: 1, x: 4, y: 10 });
    expect(handoff("fan")).toEqual({ turn: 3, x: 10, y: 10 });
  });

  it("keeps the band clear of every shape from the clear frame onward", () => {
    const { top, bottom } = bauhausBuildBand;
    const { clear, duration } = bauhausBuildTimeline;
    const samples = new Map<string, Point[]>(
      bauhausBuildPieces.map((piece) => [piece.id, samplesOf(piece)]),
    );
    const intruders: string[] = [];
    for (const seed of [1, 2]) {
      for (let time = clear; time <= duration; time += 0.5) {
        for (const frame of getBauhausBuildState(time, { seed }).pieces) {
          const inside = (samples.get(frame.id) ?? []).some((sample) => {
            const { y } = toWorld(frame, sample);
            return y > top + 0.02 && y < bottom - 0.02;
          });
          if (inside) intruders.push(`${frame.id} at ${time}`);
        }
      }
    }
    expect(intruders).toEqual([]);
  });

  it("opens the frieze on a three-frame cascade of paired hinges", () => {
    const cues = bauhausBuildPieces.map((piece) => piece.cue);
    expect(cues).toEqual(cues.map((_, index) => index * 3));
    for (const [a, b] of [
      ["hill", "tile"],
      ["pillar", "sun"],
    ]) {
      const first = getBauhausPaths(specOf(a)).rebuild[0];
      const second = getBauhausPaths(specOf(b)).rebuild[0];
      expect(first.pivot).toEqual(second.pivot);
      expect(first.spin).toBe(-second.spin);
    }
  });
});

describe("bauhaus build seed and determinism", () => {
  it("returns identical output for the same frame and seed in any order", () => {
    const options = { seed: 3, loop: true };
    for (const time of [0, 12, 40, 76, 101, 118, 400]) {
      const first = getBauhausBuildState(time, options);
      getBauhausBuildState(1000, { seed: 7 });
      getBauhausBuildState(time + 50, { seed: 3 });
      expect(getBauhausBuildState(time, options)).toEqual(first);
    }
  });

  it("reshuffles the arrival order without breaking a hinge prerequisite", () => {
    const orders = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const order = getBauhausBuildOrder(seed).map((piece) => piece.id);
      expect(new Set(order).size).toBe(bauhausBuildPieces.length);
      for (const piece of bauhausBuildPieces) {
        for (const before of piece.after) {
          expect(order.indexOf(before)).toBeLessThan(order.indexOf(piece.id));
        }
      }
      const rendered = getBauhausBuildState(60, { seed }).pieces;
      expect(rendered.map((frame) => frame.id)).toEqual(order);
      orders.add(order.join(" "));
    }
    expect(orders.size).toBeGreaterThan(10);
  });

  it("cycles through four mirror variants", () => {
    const variants = [1, 2, 3, 4, 5].map(getBauhausBuildVariant);
    expect(variants).toEqual([
      { flipX: false, flipY: false },
      { flipX: true, flipY: false },
      { flipX: false, flipY: true },
      { flipX: true, flipY: true },
      { flipX: false, flipY: false },
    ]);
  });
});

describe("bauhaus build framing and loop", () => {
  it("fits the poster to the shorter side on wide, square and tall frames", () => {
    for (const [width, height] of [
      [1280, 720],
      [1080, 1080],
      [720, 1280],
    ]) {
      const state = getBauhausBuildState(0, { width, height });
      const short = Math.min(width, height);
      expect(state.size).toBeCloseTo(short * 0.8, 9);
      expect(state.unit * bauhausBuildGrid).toBeCloseTo(state.size, 9);
      expect(state.originX * 2 + state.size).toBeCloseTo(width, 9);
      expect(state.originY * 2 + state.size).toBeCloseTo(height, 9);
      const large = getBauhausBuildState(0, { width, height, scale: 9 });
      expect(large.size).toBeCloseTo(short, 9);
      const small = getBauhausBuildState(0, { width, height, scale: 0 });
      expect(small.size).toBeCloseTo(short * 0.4, 9);
    }
  });

  it("reports the open band as a centered, full-width title field", () => {
    for (const [width, height] of [
      [1280, 720],
      [1080, 1080],
      [720, 1280],
    ]) {
      for (const scale of [0.5, 1, 1.25]) {
        const field = getBauhausBuildField({ width, height, scale });
        const state = getBauhausBuildState(0, { width, height, scale });
        expect(field.x).toBe(0);
        expect(field.width).toBe(width);
        expect(field.y + field.height / 2).toBeCloseTo(height / 2, 9);
        expect(field.height).toBeCloseTo(state.size / 3, 9);
        expect(field.unit).toBeCloseTo(state.unit, 9);
      }
    }
    const field = getBauhausBuildField();
    expect(field.y).toBeCloseTo(264, 9);
    expect(field.height).toBeCloseTo(192, 9);
  });

  it("plays forward and back so the loop repeats seamlessly", () => {
    const cycle = bauhausBuildTimeline.duration * 2;
    for (const time of [0, 13, 45, 90, 118, 150]) {
      const forward = getBauhausBuildState(time, { loop: true }).pieces;
      const back = getBauhausBuildState(cycle - time, { loop: true }).pieces;
      const next = getBauhausBuildState(time + cycle, { loop: true }).pieces;
      expect(back).toEqual(forward);
      expect(next).toEqual(forward);
    }
    const empty = getBauhausBuildState(cycle, { loop: true }).pieces;
    expect(empty.some((frame) => frame.visible)).toBe(false);
  });

  it("draws closed, finite shapes", () => {
    for (const piece of bauhausBuildPieces) {
      const path = getBauhausShapePath(piece.shape, piece.width, piece.height);
      expect(path.startsWith("M ")).toBe(true);
      expect(path.endsWith(" Z")).toBe(true);
      expect(path).not.toMatch(/NaN|Infinity|undefined/);
    }
  });
});

describe("bauhausBuildConfig", () => {
  const defaultOf = (name: string) => {
    const control = bauhausBuildConfig.controls[name];
    return "default" in control ? control.default : null;
  };

  it("matches the component defaults", () => {
    const expected = Object.entries(bauhausBuildDefaults).filter(
      ([name]) => name !== "speed",
    );
    for (const [name, value] of expected) {
      expect(defaultOf(name)).toBe(value);
    }
    expect(Object.keys(bauhausBuildConfig.controls).sort()).toEqual(
      expected.map(([name]) => name).sort(),
    );
    expect(bauhausBuildDefaults.speed).toBe(1);
  });

  it("exposes number controls in the customizer list", () => {
    for (const control of Object.values(bauhausBuildConfig.controls)) {
      if (control.type === "number") {
        expect(control.hiddenFromList).toBe(false);
      }
    }
    expect(bauhausBuildConfig.previewBackdrop).toEqual({
      type: "color",
      value: "#f1eee7",
    });
  });
});
