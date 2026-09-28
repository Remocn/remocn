import { describe, expect, it } from "bun:test";
import { getDefaults, resolveControls } from "@/lib/customizer-config";
import {
  getSquiggleCalm,
  getSquiggleCurve,
  getSquiggleDuration,
  getSquiggleEnvelope,
  getSquiggleHead,
  getSquigglePath,
  getSquigglePhase,
  getSquiggleState,
  getSquiggleTail,
  getSquiggleTime,
  getSquiggleTimeline,
  getSquiggleTrim,
  type SquiggleOptions,
  type SquigglePoint,
  type SquiggleShape,
  squiggleDefaults,
  squiggleLength,
} from "..";
import { squiggleConfig } from "../config";

const SHAPES: SquiggleShape[] = ["wave", "zigzag", "loops", "coil"];
const ORIGIN = { x: 0.375, y: 0.5 };

function polylineLength(points: readonly SquigglePoint[]) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return total;
}

function backwardRuns(points: readonly SquigglePoint[]) {
  const runs: number[] = [];
  let run = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    if (dx < 0) {
      run -= dx;
    } else if (run > 0) {
      runs.push(run);
      run = 0;
    }
  }
  return runs;
}

function crestsOf(points: readonly SquigglePoint[], from: number, to: number) {
  const crests: number[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const { x, y } = points[i];
    if (x <= from || x >= to) continue;
    if (y > points[i - 1].y && y >= points[i + 1].y) crests.push(x);
  }
  return crests;
}

function heightAt(points: readonly SquigglePoint[], x: number) {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (a.x <= x && x <= b.x && b.x > a.x) {
      return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
    }
  }
  return Number.NaN;
}

function bandOf(frame: number, options: SquiggleOptions = {}) {
  const state = getSquiggleState(frame, { erase: false, ...options });
  return Math.max(...state.points.map((point) => point.y - state.start.y));
}

describe("squiggle timeline", () => {
  it("ends the default draw, hold and erase at the documented length", () => {
    const timeline = getSquiggleTimeline();
    expect(squiggleLength).toBe(66);
    expect(timeline.draw).toBe(24);
    expect(timeline.settle).toBe(36);
    expect(timeline.eraseStart).toBe(48);
    expect(timeline.eraseEnd).toBe(66);
    expect(timeline.end).toBe(squiggleLength);
    expect(timeline.duration).toBe(80);
    expect(getSquiggleDuration()).toBe(squiggleConfig.durationInFrames);
  });

  it("scales the preview duration with speed, hold, delay and erase", () => {
    expect(getSquiggleDuration({ speed: 2 })).toBe(40);
    expect(getSquiggleDuration({ speed: 0.5 })).toBe(160);
    expect(getSquiggleDuration({ speed: 0 })).toBe(1);
    expect(getSquiggleDuration({ hold: 30 })).toBe(98);
    expect(getSquiggleDuration({ hold: Number.NaN })).toBe(80);
    expect(getSquiggleDuration({ erase: false })).toBe(60);
    expect(getSquiggleDuration({ delay: 10 })).toBe(90);
    expect(getSquiggleDuration({ delay: 10, speed: 2 })).toBe(50);
    expect(getSquiggleTimeline({ erase: false }).end).toBe(36);
    const resolve = squiggleConfig.getDurationInFrames;
    expect(resolve?.({ speed: 2, hold: 0, erase: true })).toBe(34);
    expect(resolve?.({ erase: false, delay: 6 })).toBe(66);
  });

  it("maps frames onto the 30 fps timeline after the delay", () => {
    expect(getSquiggleTime(Number.NaN)).toBe(0);
    expect(getSquiggleTime(-5)).toBe(0);
    expect(getSquiggleTime(8, { delay: 12 })).toBe(0);
    expect(getSquiggleTime(10, { delay: 4, speed: 2, fps: 60 })).toBe(6);
  });

  it("draws nothing before the start and nothing once the tail lands", () => {
    for (const frame of [-5, 0]) {
      const state = getSquiggleState(frame);
      expect(state.visible).toBe(false);
      expect(state.path).toBe("");
      expect(state.points).toEqual([]);
    }
    expect(getSquiggleState(1).visible).toBe(true);
    for (const frame of [0, 6, 12]) {
      expect(getSquiggleState(frame, { delay: 12 }).visible).toBe(false);
    }
    expect(getSquiggleState(13, { delay: 12 }).visible).toBe(true);
    expect(getSquiggleState(64).visible).toBe(true);
    for (const frame of [66, 67, 80, 500]) {
      for (const shape of SHAPES) {
        const state = getSquiggleState(frame, { shape });
        expect(state.visible).toBe(false);
        expect(state.path).toBe("");
      }
    }
    const kept = getSquiggleState(500, { erase: false });
    expect(kept.visible).toBe(true);
    expect(kept.head).toBe(1);
    expect(kept.tail).toBe(0);
  });
});

describe("squiggle trim path", () => {
  it("runs the head out on a fast ease-out, never at constant speed", () => {
    expect(getSquiggleHead(0)).toBe(0);
    expect(getSquiggleHead(-3)).toBe(0);
    expect(getSquiggleHead(Number.NaN)).toBe(0);
    expect(getSquiggleHead(1)).toBeCloseTo(1 - (23 / 24) ** 4, 10);
    expect(getSquiggleHead(1)).toBeGreaterThan(3 / 24);
    expect(getSquiggleHead(8)).toBeGreaterThan(0.8);
    expect(getSquiggleHead(24)).toBe(1);
    expect(getSquiggleHead(40)).toBe(1);
    for (let frame = 1; frame < 24; frame++) {
      const before = getSquiggleHead(frame) - getSquiggleHead(frame - 1);
      const after = getSquiggleHead(frame + 1) - getSquiggleHead(frame);
      expect(after).toBeLessThan(before);
    }
  });

  it("advances the head point along the course on every frame", () => {
    const forward: SquiggleShape[] = ["wave", "zigzag"];
    for (const shape of forward) {
      let previous = Number.NEGATIVE_INFINITY;
      for (let frame = 1; frame <= 24; frame++) {
        const options = { ...ORIGIN, shape, erase: false };
        const { points } = getSquiggleState(frame, options);
        const head = points[points.length - 1].x;
        expect(head).toBeGreaterThan(previous);
        previous = head;
      }
      expect(previous).toBeCloseTo(800, 6);
    }
  });

  it("erases on an ease-in-out only after the hold", () => {
    const timeline = getSquiggleTimeline();
    const tail = (time: number) => getSquiggleTail(time, timeline);
    expect(tail(48)).toBe(0);
    expect(tail(57)).toBeCloseTo(0.5, 10);
    expect(tail(66)).toBe(1);
    const early = tail(49) - tail(48);
    const middle = tail(57) - tail(56);
    expect(middle).toBeGreaterThan(early * 20);
    const kept = getSquiggleTimeline({ erase: false });
    expect(getSquiggleTail(60, kept)).toBe(0);
    expect(getSquiggleTail(60, getSquiggleTimeline({ hold: 30 }))).toBe(0);
  });

  it("cuts the visible path at the head and tail fractions of the arc", () => {
    for (const shape of SHAPES) {
      for (const frame of [1, 4, 8, 12, 50, 57, 62]) {
        const state = getSquiggleState(frame, { shape });
        const drawn = polylineLength(state.points);
        expect(drawn / state.total).toBeCloseTo(state.head - state.tail, 6);
      }
    }
    const corner = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    expect(getSquiggleTrim(corner, 0.25, 0.75)).toEqual({
      total: 20,
      points: [
        { x: 5, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 5 },
      ],
    });
    expect(getSquiggleTrim(corner, 0.5, 0.5).points).toEqual([]);
    expect(getSquiggleTrim([], 0, 1)).toEqual({ total: 0, points: [] });
  });

  it("pins both ends of every shape to the course once drawn", () => {
    const placements = [
      { ...ORIGIN, angle: 0 },
      { angle: 30, x: 0.2, y: 0.3 },
    ];
    for (const placement of placements) {
      const radians = (placement.angle * Math.PI) / 180;
      const start = { x: placement.x * 1280, y: placement.y * 720 };
      const end = {
        x: start.x + 320 * Math.cos(radians),
        y: start.y + 320 * Math.sin(radians),
      };
      for (const shape of SHAPES) {
        for (const frame of [24, 36, 48]) {
          const state = getSquiggleState(frame, { shape, ...placement });
          const first = state.points[0];
          const last = state.points[state.points.length - 1];
          expect(first.x).toBeCloseTo(start.x, 6);
          expect(first.y).toBeCloseTo(start.y, 6);
          expect(last.x).toBeCloseTo(end.x, 6);
          expect(last.y).toBeCloseTo(end.y, 6);
          expect(state.end.x).toBeCloseTo(end.x, 6);
          expect(state.end.y).toBeCloseTo(end.y, 6);
        }
      }
    }
  });

  it("erases in the drawing direction toward the pinned end point", () => {
    for (const angle of [0, 90]) {
      let previous = Number.NEGATIVE_INFINITY;
      for (const frame of [50, 52, 54, 56, 58, 60, 62, 64]) {
        const state = getSquiggleState(frame, { angle });
        const first = state.points[0];
        const last = state.points[state.points.length - 1];
        expect(last.x).toBeCloseTo(state.end.x, 6);
        expect(last.y).toBeCloseTo(state.end.y, 6);
        const progress = angle === 0 ? first.x : first.y;
        expect(progress).toBeGreaterThan(previous);
        previous = progress;
      }
    }
  });
});

describe("squiggle signature motion", () => {
  it("swims the phase forward while drawing, then comes to rest", () => {
    const timeline = getSquiggleTimeline();
    const phase = (time: number) => getSquigglePhase(time, timeline);
    expect(phase(0)).toBe(0);
    for (let frame = 0; frame < 36; frame++) {
      expect(phase(frame + 1)).toBeGreaterThan(phase(frame));
    }
    for (let frame = 1; frame < 36; frame++) {
      const before = phase(frame) - phase(frame - 1);
      const after = phase(frame + 1) - phase(frame);
      expect(after).toBeLessThan(before);
    }
    expect(phase(12)).toBeGreaterThan(1);
    expect(phase(36)).toBe(1.5);
    expect(phase(48)).toBe(1.5);
    expect(phase(57)).toBeCloseTo(1.75, 10);
    expect(phase(66)).toBe(2);
    const kept = getSquiggleTimeline({ erase: false });
    expect(getSquigglePhase(66, kept)).toBe(1.5);
  });

  it("moves every crest of the drawn line forward with the phase", () => {
    const crests = (frame: number) => {
      const state = getSquiggleState(frame, { ...ORIGIN, erase: false });
      return { phase: state.phase, crests: crestsOf(state.points, 560, 720) };
    };
    for (const frame of [12, 16, 24, 36]) {
      const sample = crests(frame);
      expect(sample.crests.length).toBeGreaterThanOrEqual(3);
      for (const crest of sample.crests) {
        const cycles = (crest - 492) / 48 - sample.phase;
        expect(Math.abs(cycles - Math.round(cycles))).toBeLessThan(1e-6);
      }
    }
    const before = crests(12).crests[0];
    const after = crests(16).crests[0];
    const travel = (getSquigglePhase(16) - getSquigglePhase(12)) * 48;
    expect(after - before).toBeCloseTo(travel, 6);
    expect(travel).toBeGreaterThan(8);
  });

  it("eases the amplitude from lively to calm without overshoot", () => {
    expect(getSquiggleCalm(0)).toBe(0);
    expect(getSquiggleCalm(36)).toBe(1);
    expect(getSquiggleCalm(90)).toBe(1);
    const amplitudes: number[] = [];
    for (let frame = 0; frame <= 60; frame++) {
      amplitudes.push(getSquiggleState(frame).amplitude);
    }
    expect(amplitudes[0]).toBe(14);
    expect(amplitudes[36]).toBeCloseTo(7, 10);
    for (let i = 1; i < amplitudes.length; i++) {
      expect(amplitudes[i]).toBeLessThanOrEqual(amplitudes[i - 1]);
    }
    expect(Math.min(...amplitudes)).toBeCloseTo(7, 10);
    expect(bandOf(8)).toBeGreaterThan(12);
    expect(bandOf(8)).toBeLessThanOrEqual(14);
    expect(bandOf(36)).toBeCloseTo(7, 6);
    expect(bandOf(36, { settle: 0 })).toBeCloseTo(14, 6);
    expect(bandOf(36, { settle: 1 })).toBeCloseTo(0, 6);
  });

  it("recomputes the shape every frame, never a static reveal", () => {
    const early = getSquiggleState(6, ORIGIN).points;
    const later = getSquiggleState(10, ORIGIN).points;
    for (const x of [560, 600, 640]) {
      const drift = Math.abs(heightAt(early, x) - heightAt(later, x));
      expect(drift).toBeGreaterThan(1);
    }
    expect(getSquiggleState(24).path).not.toBe(getSquiggleState(36).path);
    expect(getSquiggleState(36).path).toBe(getSquiggleState(47).path);
  });
});

describe("squiggle shapes", () => {
  it("keeps the wave and the zigzag moving forward inside the band", () => {
    const forward: SquiggleShape[] = ["wave", "zigzag"];
    for (const shape of forward) {
      const points = getSquiggleCurve({
        shape,
        length: 320,
        wavelength: 48,
        amplitude: 10,
        phase: 0.3,
      });
      expect(backwardRuns(points)).toEqual([]);
      for (const point of points) {
        expect(Math.abs(point.y)).toBeLessThanOrEqual(10 + 1e-9);
      }
      expect(Math.max(...points.map((point) => point.y))).toBeCloseTo(10, 6);
    }
  });

  it("builds the zigzag from exact alternating corners", () => {
    const points = getSquiggleCurve({
      shape: "zigzag",
      length: 320,
      wavelength: 48,
      amplitude: 10,
      phase: 0,
    });
    expect(points).toHaveLength(15);
    const corners = points.slice(1, -1);
    for (const [index, corner] of corners.entries()) {
      expect(corner.x).toBeCloseTo(12 + index * 24, 6);
      expect(Math.sign(corner.y)).toBe(index % 2 === 0 ? 1 : -1);
    }
    for (const corner of corners.slice(2, -2)) {
      expect(Math.abs(corner.y)).toBeCloseTo(10, 6);
    }
    expect(getSquiggleState(24, { shape: "zigzag" }).join).toBe("miter");
    expect(getSquiggleState(24, { shape: "wave" }).join).toBe("round");
  });

  it("loops above the course, the coil wider than the loops", () => {
    const widthOf = (shape: SquiggleShape, amplitude: number) => {
      const points = getSquiggleCurve({
        shape,
        length: 320,
        wavelength: 48,
        amplitude,
        phase: 0,
      });
      for (let i = 1; i < points.length; i++) {
        if (points[i].x < points[i - 1].x) {
          expect(points[i].y).toBeLessThan(0);
          expect(points[i - 1].y).toBeLessThan(0);
        }
      }
      return Math.max(...backwardRuns(points));
    };
    for (const amplitude of [14, 7]) {
      const loops = widthOf("loops", amplitude);
      const coil = widthOf("coil", amplitude);
      expect(loops).toBeGreaterThan(12);
      expect(loops).toBeLessThan(20);
      expect(coil).toBeGreaterThan(36);
      expect(coil).toBeLessThan(48);
    }
  });

  it("unfurls loops into a straight line when the height calms away", () => {
    const looped: SquiggleShape[] = ["loops", "coil"];
    for (const shape of looped) {
      const points = getSquiggleCurve({
        shape,
        length: 320,
        wavelength: 48,
        amplitude: 0,
        phase: 0.4,
      });
      expect(backwardRuns(points)).toEqual([]);
      expect(polylineLength(points)).toBeCloseTo(320, 6);
      const state = getSquiggleState(40, { shape, settle: 1 });
      expect(state.total).toBeCloseTo(320, 6);
    }
  });

  it("tapers the pattern to nothing at both pinned ends", () => {
    expect(getSquiggleEnvelope(0, 320, 48)).toBe(0);
    expect(getSquiggleEnvelope(320, 320, 48)).toBe(0);
    expect(getSquiggleEnvelope(160, 320, 48)).toBe(1);
    expect(getSquiggleEnvelope(24, 320, 48)).toBeCloseTo(0.5, 10);
    expect(getSquiggleEnvelope(296, 320, 48)).toBeCloseTo(0.5, 10);
    expect(getSquiggleEnvelope(10, 0, 48)).toBe(0);
  });
});

describe("squiggle reference-px scaling", () => {
  it("scales sizes by height / 720 and positions by fractions", () => {
    const at = (width: number, height: number) =>
      getSquiggleState(36, { ...ORIGIN, width, height });
    const base = at(1280, 720);
    const hd = at(1920, 1080);
    const uhd = at(3840, 2160);
    expect(base.unit).toBe(1);
    expect(hd.unit).toBe(1.5);
    expect(uhd.unit).toBe(3);
    expect(base.strokeWidth).toBe(3);
    expect(hd.strokeWidth).toBe(4.5);
    expect(uhd.strokeWidth).toBe(9);
    expect(hd.amplitude).toBeCloseTo(10.5, 10);
    expect(uhd.amplitude).toBeCloseTo(21, 10);
    expect(hd.wavelength).toBe(72);
    expect(uhd.wavelength).toBe(144);
    expect(base.start).toEqual({ x: 480, y: 360 });
    expect(hd.start).toEqual({ x: 720, y: 540 });
    expect(uhd.start).toEqual({ x: 1440, y: 1080 });
    expect(hd.end.x).toBeCloseTo(1200, 6);
    expect(uhd.end.x).toBeCloseTo(2400, 6);
    expect(hd.total / base.total).toBeCloseTo(1.5, 2);
    expect(uhd.total / base.total).toBeCloseTo(3, 2);
    const band = (state: typeof base) =>
      Math.max(...state.points.map((point) => point.y - state.start.y));
    expect(band(hd) / band(base)).toBeCloseTo(1.5, 6);
    expect(band(uhd) / band(base)).toBeCloseTo(3, 6);
    expect(at(1080, 1920).length).toBeCloseTo((320 * 1920) / 720, 6);
  });
});

describe("squiggle determinism", () => {
  it("renders any frame identically in any sampling order", () => {
    const sample = (frame: number) =>
      getSquiggleState(frame, { shape: "coil", angle: -20, x: 0.3, y: 0.6 });
    const frames = [0, 1, 7, 19, 33, 50, 61, 66, 90];
    const forward = frames.map(sample);
    const backward = [...frames].reverse().map(sample).reverse();
    expect(backward).toEqual(forward);
    expect(sample(19)).toEqual(forward[3]);
    expect(sample(19).path).toBe(forward[3].path);
  });

  it("maps frame rate, speed and delay onto the same timeline", () => {
    const base = getSquiggleState(20, { shape: "loops" });
    expect(getSquiggleState(40, { shape: "loops", fps: 60 })).toEqual(base);
    expect(getSquiggleState(40, { shape: "loops", speed: 0.5 })).toEqual(base);
    expect(getSquiggleState(30, { shape: "loops", delay: 10 })).toEqual(base);
    const frozen = getSquiggleState(90, { speed: 0 });
    expect(frozen).toEqual(getSquiggleState(0));
    expect(frozen.visible).toBe(false);
  });

  it("stays finite and bounded for invalid or extreme input", () => {
    for (const shape of SHAPES) {
      for (const frame of [1, 12, 40, 57]) {
        const state = getSquiggleState(frame, {
          shape,
          length: Number.NaN,
          amplitude: -5,
          wavelength: 0,
          weight: Number.NaN,
          x: Number.POSITIVE_INFINITY,
          settle: 9,
          hold: -3,
        });
        expect(state.path).not.toMatch(/NaN|Infinity/);
        expect(state.strokeWidth).toBe(3);
      }
      const dense = getSquiggleCurve({
        shape,
        length: 100000,
        wavelength: 1,
        amplitude: 10,
        phase: 0.3,
      });
      expect(dense.length).toBeLessThanOrEqual(4000);
    }
    const repeated = [
      { x: 0, y: 0 },
      { x: 0.001, y: 0 },
      { x: 1, y: 1 },
    ];
    expect(getSquigglePath(repeated)).toBe("M0 0L1 1");
  });
});

describe("squiggle config", () => {
  it("matches the component defaults and exposes every shape", () => {
    const controls = resolveControls("squiggle", squiggleConfig.controls);
    expect(getDefaults(controls)).toEqual({ ...squiggleDefaults });
    const shape = controls.shape;
    expect(shape.type === "select" ? shape.options : []).toEqual(SHAPES);
    const range = (key: string) => {
      const control = controls[key];
      return control.type === "number" ? [control.min, control.max] : [];
    };
    expect(range("weight")).toEqual([1, 12]);
    expect(range("amplitude")).toEqual([0, 60]);
    expect(range("x")).toEqual([0, 1]);
    expect(range("y")).toEqual([0, 1]);
    expect(range("settle")).toEqual([0, 1]);
    expect(squiggleConfig.previewBackdrop).toEqual({
      type: "color",
      value: "#002fa7",
    });
  });
});
