import { describe, expect, it } from "bun:test";
import { getDefaults, resolveControls } from "@/lib/customizer-config";
import {
  getTrimBurstDotScale,
  getTrimBurstDuration,
  getTrimBurstEndProgress,
  getTrimBurstLeash,
  getTrimBurstStartProgress,
  getTrimBurstState,
  getTrimBurstStrokes,
  getTrimBurstTime,
  getTrimBurstTimeline,
  getTrimBurstTrim,
  trimBurstDefaults,
  trimBurstLength,
} from "..";
import { trimBurstConfig } from "../config";

type State = ReturnType<typeof getTrimBurstState>;
type Layout = Parameters<typeof getTrimBurstStrokes>[0];

const frames = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const samples = (step: number, end: number) =>
  Array.from({ length: Math.round(end / step) + 1 }, (_, i) => i * step);

const drawn = (state: State) => state.lines.length + state.dots.length;

const lengthOf = (line: State["lines"][number]) =>
  Math.hypot(line.x2 - line.x1, line.y2 - line.y1);

describe("trim burst timeline", () => {
  it("lives 18 frames and previews with a short hold", () => {
    expect(trimBurstLength).toBe(18);
    expect(getTrimBurstTimeline()).toEqual({
      life: 15,
      lag: 3,
      stagger: 3,
      length: 18,
    });
    expect(getTrimBurstTimeline({ jitter: 1 }).length).toBe(21);
    expect(getTrimBurstTimeline({ jitter: 0 }).length).toBe(15);
    expect(getTrimBurstTimeline({ count: 1 }).stagger).toBe(0);
    expect(getTrimBurstDuration()).toBe(42);
    expect(getTrimBurstDuration()).toBe(trimBurstConfig.durationInFrames);
  });

  it("scales the preview with speed, jitter, count and delay", () => {
    expect(getTrimBurstDuration({ speed: 2 })).toBe(33);
    expect(getTrimBurstDuration({ speed: 0.5 })).toBe(60);
    expect(getTrimBurstDuration({ speed: 0.25 })).toBe(96);
    expect(getTrimBurstDuration({ speed: 4 })).toBe(29);
    expect(getTrimBurstDuration({ speed: 0 })).toBe(24);
    expect(getTrimBurstDuration({ jitter: 0 })).toBe(39);
    expect(getTrimBurstDuration({ jitter: 1 })).toBe(45);
    expect(getTrimBurstDuration({ count: 1 })).toBe(39);
    expect(getTrimBurstDuration({ delay: 10 })).toBe(52);
    const resolve = trimBurstConfig.getDurationInFrames;
    expect(resolve?.({ speed: 2, jitter: 1, delay: 6 })).toBe(41);
    expect(resolve?.({ speed: "fast", jitter: "loose" })).toBe(42);
  });

  it("draws nothing before the burst fires or after it ends", () => {
    expect(drawn(getTrimBurstState(0, { dots: true }))).toBe(0);
    for (const frame of frames(1, 17)) {
      expect(getTrimBurstState(frame).lines.length).toBeGreaterThan(0);
    }
    for (const frame of [trimBurstLength, 19, 30, 200]) {
      expect(drawn(getTrimBurstState(frame, { dots: true }))).toBe(0);
    }
    const loose = { jitter: 1, dots: true };
    expect(drawn(getTrimBurstState(20, loose))).toBeGreaterThan(0);
    expect(drawn(getTrimBurstState(21, loose))).toBe(0);
    const rigid = { jitter: 0, dots: true };
    expect(drawn(getTrimBurstState(14, rigid))).toBeGreaterThan(0);
    expect(drawn(getTrimBurstState(15, rigid))).toBe(0);
  });

  it("waits for the delay and never fires at speed 0", () => {
    const delayed = { delay: 10, dots: true };
    for (const frame of frames(0, 10)) {
      expect(drawn(getTrimBurstState(frame, delayed))).toBe(0);
    }
    expect(getTrimBurstState(11, delayed).lines.length).toBeGreaterThan(0);
    expect(drawn(getTrimBurstState(27, delayed))).toBeGreaterThan(0);
    for (const frame of [28, 40]) {
      expect(drawn(getTrimBurstState(frame, delayed))).toBe(0);
    }
    for (const frame of [0, 10, 100]) {
      const frozen = getTrimBurstState(frame, { speed: 0, dots: true });
      expect(drawn(frozen)).toBe(0);
    }
  });

  it("maps other frame rates and speeds onto the 30 fps timeline", () => {
    const base = getTrimBurstState(5);
    expect(getTrimBurstState(10, { fps: 60 })).toEqual(base);
    expect(getTrimBurstState(10, { speed: 0.5 })).toEqual(base);
    expect(getTrimBurstTime(12, { delay: 4, speed: 2 })).toBe(16);
    expect(getTrimBurstTime(20, { fps: 60, speed: 0.5 })).toBe(5);
    expect(getTrimBurstTime(-5)).toBe(0);
    expect(getTrimBurstTime(Number.NaN)).toBe(0);
  });
});

describe("trim burst signature", () => {
  it("leads with the end on a fast ease-out that brakes hard", () => {
    const progress = frames(0, 15).map(getTrimBurstEndProgress);
    expect(progress[0]).toBe(0);
    expect(progress[1]).toBeGreaterThan(0.35);
    expect(progress[2]).toBeGreaterThan(0.55);
    expect(progress[15]).toBe(1);
    const steps = progress.slice(1).map((value, i) => value - progress[i]);
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]).toBeLessThan(steps[i - 1]);
    }
    expect(steps[14]).toBeLessThan(0.001);
    for (const time of samples(0.01, 30)) {
      expect(getTrimBurstEndProgress(time)).toBeLessThanOrEqual(1);
    }
    expect(getTrimBurstEndProgress(-3)).toBe(0);
    expect(getTrimBurstEndProgress(Number.NaN)).toBe(0);
    expect(getTrimBurstEndProgress(40)).toBe(1);
  });

  it("holds the start for three frames, then eases in and out", () => {
    for (const time of [0, 1, 2, 3]) {
      expect(getTrimBurstStartProgress(time)).toBe(0);
    }
    expect(getTrimBurstStartProgress(3.5)).toBeGreaterThan(0);
    expect(getTrimBurstStartProgress(9)).toBeCloseTo(0.5, 6);
    expect(getTrimBurstStartProgress(15)).toBe(1);
    expect(getTrimBurstStartProgress(Number.NaN)).toBe(0);
    const progress = frames(3, 15).map(getTrimBurstStartProgress);
    const steps = progress.slice(1).map((value, i) => value - progress[i]);
    for (let i = 1; i < 6; i++) {
      expect(steps[i]).toBeGreaterThan(steps[i - 1]);
    }
    for (let i = 7; i < steps.length; i++) {
      expect(steps[i]).toBeLessThan(steps[i - 1]);
    }
    for (const time of samples(0.25, 12)) {
      const early = getTrimBurstStartProgress(3 + time);
      const late = getTrimBurstStartProgress(15 - time);
      expect(early + late).toBeCloseTo(1, 6);
    }
  });

  it("grows, travels, then zips shut at the reach by default", () => {
    const { reach, strokeLength } = trimBurstDefaults;
    const trims = frames(0, 15).map((time) =>
      getTrimBurstTrim(time, reach, strokeLength),
    );
    const lengths = trims.map((trim) => trim.length);
    expect(lengths[0]).toBe(0);
    for (const trim of trims.slice(1, 4)) {
      expect(trim.start).toBeLessThan(0.05 * reach);
    }
    expect(trims[3].end).toBeGreaterThan(0.7 * reach);
    for (let time = 1; time <= 4; time++) {
      expect(lengths[time]).toBeGreaterThan(lengths[time - 1]);
    }
    const fine = samples(0.01, 15).map(
      (time) => getTrimBurstTrim(time, reach, strokeLength).length,
    );
    const peak = Math.max(...fine);
    expect(peak / reach).toBeGreaterThan(0.74);
    expect(peak / reach).toBeLessThan(0.8);
    for (const time of [4, 5, 6]) {
      expect(lengths[time]).toBeGreaterThan(0.95 * peak);
    }
    expect(trims[6].start - trims[4].start).toBeGreaterThan(5);
    expect(trims[6].end - trims[4].end).toBeGreaterThan(5);
    for (let time = 6; time <= 15; time++) {
      expect(lengths[time]).toBeLessThan(lengths[time - 1]);
    }
    const chase = trims[11].start - trims[10].start;
    expect(chase).toBeGreaterThan(20 * (trims[11].end - trims[10].end));
    expect(trims[15]).toEqual({ start: reach, end: reach, length: 0 });
  });

  it("moves the start on one smooth hump by default", () => {
    const { reach, strokeLength } = trimBurstDefaults;
    const starts = samples(0.05, 15).map(
      (time) => getTrimBurstTrim(time, reach, strokeLength).start,
    );
    const steps = starts.slice(1).map((value, i) => value - starts[i]);
    const top = steps.indexOf(Math.max(...steps));
    expect(top * 0.05).toBeGreaterThan(8);
    expect(top * 0.05).toBeLessThan(10.5);
    for (let i = 1; i <= top; i++) {
      expect(steps[i]).toBeGreaterThanOrEqual(steps[i - 1]);
    }
    for (let i = top + 1; i < steps.length; i++) {
      expect(steps[i]).toBeLessThanOrEqual(steps[i - 1]);
    }
  });

  it("turns a short stroke into a dash that travels, then zips", () => {
    const trims = frames(0, 15).map((time) => getTrimBurstTrim(time, 64, 32));
    expect(trims[0].length).toBe(0);
    expect(trims[1].start).toBeLessThan(1);
    expect(trims[1].length).toBeLessThan(trims[2].length);
    expect(trims[2].length).toBeLessThan(trims[3].length);
    for (const trim of trims.slice(3, 8)) {
      expect(trim.length).toBeGreaterThan(32 * 0.98);
      expect(trim.length).toBeLessThan(32);
    }
    expect(trims[8].start - trims[3].start).toBeGreaterThan(12);
    expect(trims[8].end - trims[3].end).toBeGreaterThan(12);
    for (let time = 9; time <= 15; time++) {
      expect(trims[time].length).toBeLessThan(trims[time - 1].length);
    }
    const chase = trims[11].start - trims[10].start;
    expect(chase).toBeGreaterThan(20 * (trims[11].end - trims[10].end));
    expect(trims[15]).toEqual({ start: 64, end: 64, length: 0 });
  });

  it("never lets a stroke outgrow its length or the free chase", () => {
    for (const length of [32, trimBurstDefaults.strokeLength]) {
      for (const time of samples(0.005, 15)) {
        const trim = getTrimBurstTrim(time, 64, length);
        const own = 64 * getTrimBurstStartProgress(time);
        expect(trim.length).toBeLessThan(length);
        expect(trim.length).toBeLessThanOrEqual(trim.end - own + 1e-9);
        expect(trim.start).toBeGreaterThanOrEqual(0);
        expect(trim.start).toBeLessThanOrEqual(trim.end);
      }
    }
  });

  it("chases freely when the stroke length does not bind", () => {
    for (const time of [1, 2, 3]) {
      expect(getTrimBurstTrim(time, 64, 1000).start).toBeLessThan(0.001);
    }
    const lengths = samples(0.01, 15).map(
      (time) => getTrimBurstTrim(time, 64, 1000).length,
    );
    const peak = Math.max(...lengths) / 64;
    expect(peak).toBeGreaterThan(0.84);
    expect(peak).toBeLessThan(0.86);
  });

  it("keeps a short stroke short on a long reach", () => {
    const lengths = samples(0.01, 15).map(
      (time) => getTrimBurstTrim(time, 200, 20).length,
    );
    const peak = Math.max(...lengths);
    expect(peak).toBeGreaterThan(19.9);
    expect(peak).toBeLessThan(20);
    const closed = getTrimBurstTrim(15, 200, 20);
    expect(closed).toEqual({ start: 200, end: 200, length: 0 });
  });

  it("caps the gap with a smooth minimum", () => {
    expect(getTrimBurstLeash(0, 32)).toBe(0);
    expect(getTrimBurstLeash(-5, 32)).toBe(0);
    expect(getTrimBurstLeash(10, 0)).toBe(0);
    expect(getTrimBurstLeash(Number.NaN, 32)).toBe(0);
    expect(getTrimBurstLeash(10, Number.POSITIVE_INFINITY)).toBe(10);
    expect(getTrimBurstLeash(32, 32)).toBeCloseTo(32 * 2 ** (-1 / 6), 6);
    expect(getTrimBurstLeash(1000, 32)).toBeCloseTo(32, 6);
    let previous = 0;
    for (const gap of samples(0.1, 200).slice(1)) {
      const length = getTrimBurstLeash(gap, 32);
      expect(length).toBeGreaterThan(previous);
      expect(length).toBeLessThanOrEqual(Math.min(gap, 32));
      previous = length;
    }
  });
});

describe("trim burst layout", () => {
  it("spaces a rigid ring evenly from 12 o'clock", () => {
    const strokes = getTrimBurstStrokes({ jitter: 0 });
    const angles = strokes.map((stroke) => stroke.angle);
    expect(angles).toEqual([0, 45, 90, 135, 180, 225, 270, 315]);
    for (const stroke of strokes) {
      expect(stroke.scale).toBe(1);
      expect(stroke.launch).toBe(0);
    }
    const turned = getTrimBurstStrokes({ jitter: 0, rotation: 30 });
    expect(turned.map((stroke) => stroke.angle)).toEqual([
      30, 75, 120, 165, 210, 255, 300, 345,
    ]);
  });

  it("varies angles, lengths and launches slightly from the seed", () => {
    const strokes = getTrimBurstStrokes();
    const offsets = strokes.map((stroke) => stroke.angle - stroke.index * 45);
    for (const offset of offsets) {
      expect(Math.abs(offset)).toBeLessThanOrEqual(0.25 * 0.5 * 45);
    }
    expect(offsets.some((offset) => Math.abs(offset) > 1)).toBe(true);
    for (const stroke of strokes) {
      expect(stroke.scale).toBeGreaterThan(1 - 0.45 * 0.5);
      expect(stroke.scale).toBeLessThanOrEqual(1);
    }
    const launches = strokes.map((stroke) => stroke.launch);
    const sorted = [...launches].sort((a, b) => a - b);
    for (const [rank, launch] of sorted.entries()) {
      expect(launch).toBeCloseTo((rank * 3) / 7, 6);
    }
    expect(launches).not.toEqual(sorted);
  });

  it("fans strokes across the spread around the rotation", () => {
    const angles = (layout: Layout) =>
      getTrimBurstStrokes({ jitter: 0, ...layout }).map((item) => item.angle);
    expect(angles({ count: 3, spread: 90 })).toEqual([-45, 0, 45]);
    expect(angles({ count: 3, spread: 90, rotation: 90 })).toEqual([
      45, 90, 135,
    ]);
    expect(angles({ count: 1, spread: 90, rotation: 20 })).toEqual([20]);
    expect(angles({ count: 1, rotation: 20 })).toEqual([20]);
  });

  it("rounds and clamps the stroke count", () => {
    const count = (value: number) =>
      getTrimBurstStrokes({ count: value }).length;
    expect(count(0)).toBe(1);
    expect(count(-3)).toBe(1);
    expect(count(7.6)).toBe(8);
    expect(count(99)).toBe(32);
    expect(count(Number.NaN)).toBe(8);
  });
});

describe("trim burst geometry", () => {
  it("runs every stroke outward along its angle from the inner radius", () => {
    const state = getTrimBurstState(5, { jitter: 0 });
    const { reach, strokeLength } = trimBurstDefaults;
    const trim = getTrimBurstTrim(5, reach, strokeLength);
    expect(state.lines).toHaveLength(8);
    for (const line of state.lines) {
      const inner = Math.hypot(line.x1 - 640, line.y1 - 360);
      const outer = Math.hypot(line.x2 - 640, line.y2 - 360);
      expect(inner).toBeCloseTo(16 + trim.start, 2);
      expect(outer).toBeCloseTo(16 + trim.end, 2);
      const angle = (Math.atan2(line.x2 - 640, 360 - line.y2) * 180) / Math.PI;
      expect((angle + 360) % 360).toBeCloseTo(line.index * 45, 2);
    }
    const up = state.lines.find((line) => line.index === 0);
    expect(up?.x2).toBeCloseTo(640, 3);
    expect(up?.y2).toBeLessThan(360);
  });

  it("sizes everything in reference px scaled by height / 720", () => {
    const base = getTrimBurstState(6, { dots: true });
    const large = getTrimBurstState(6, {
      width: 1920,
      height: 1080,
      dots: true,
    });
    expect(large.unit).toBe(1.5);
    expect(large.weight).toBe(3);
    expect(large.lines).toHaveLength(base.lines.length);
    expect(large.dots).toHaveLength(base.dots.length);
    expect(base.dots.length).toBeGreaterThan(0);
    for (const [i, line] of base.lines.entries()) {
      const other = large.lines[i];
      expect(other.x1).toBeCloseTo(line.x1 * 1.5, 2);
      expect(other.y1).toBeCloseTo(line.y1 * 1.5, 2);
      expect(other.x2).toBeCloseTo(line.x2 * 1.5, 2);
      expect(other.y2).toBeCloseTo(line.y2 * 1.5, 2);
      expect(other.width).toBeCloseTo(line.width * 1.5, 2);
    }
    for (const [i, dot] of base.dots.entries()) {
      const other = large.dots[i];
      expect(other.cx).toBeCloseTo(dot.cx * 1.5, 2);
      expect(other.cy).toBeCloseTo(dot.cy * 1.5, 2);
      expect(other.r).toBeCloseTo(dot.r * 1.5, 2);
    }
    const tall = getTrimBurstState(6, { width: 1080, height: 1920 });
    expect(tall.originX).toBe(540);
    expect(tall.originY).toBe(960);
    for (const [i, line] of base.lines.entries()) {
      const scaled = lengthOf(tall.lines[i]);
      expect(scaled).toBeCloseTo((lengthOf(line) * 1920) / 720, 1);
    }
  });

  it("keeps element counts small and falls back on invalid input", () => {
    for (const frame of frames(0, 30)) {
      const state = getTrimBurstState(frame, { count: 24, dots: true });
      expect(state.lines.length).toBeLessThanOrEqual(24);
      expect(state.dots.length).toBeLessThanOrEqual(24);
    }
    const nan = Number.NaN;
    const broken = getTrimBurstState(6, {
      x: nan,
      y: nan,
      count: nan,
      innerRadius: nan,
      reach: nan,
      strokeLength: nan,
      weight: nan,
      rotation: nan,
      spread: nan,
      jitter: nan,
      seed: nan,
      delay: nan,
      speed: nan,
      fps: nan,
      width: nan,
      height: nan,
    });
    expect(broken).toEqual(getTrimBurstState(6));
    expect(getTrimBurstState(6, { weight: 0 }).weight).toBe(0.25);
    expect(getTrimBurstState(6, { weight: 100 }).weight).toBe(24);
    for (const line of getTrimBurstState(6, { strokeLength: 0 }).lines) {
      expect(lengthOf(line)).toBeLessThanOrEqual(1.002);
    }
  });

  it("thins a closing stroke so a round cap shrinks to a point", () => {
    for (const frame of frames(0, 20)) {
      const state = getTrimBurstState(frame);
      for (const line of state.lines) {
        expect(line.width).toBeLessThanOrEqual(state.weight);
        expect(line.width).toBeLessThanOrEqual(lengthOf(line) + 0.003);
      }
    }
    const closing = getTrimBurstState(17).lines;
    expect(closing.length).toBeGreaterThan(0);
    for (const line of closing) {
      expect(line.width).toBeLessThan(1);
    }
  });
});

describe("trim burst dots", () => {
  it("stays off unless dots is set", () => {
    for (const frame of frames(0, 20)) {
      expect(getTrimBurstState(frame).dots).toEqual([]);
    }
  });

  it("pops just past full size, then shrinks to nothing", () => {
    for (const time of [0, 2, 4, 15, 20]) {
      expect(getTrimBurstDotScale(time)).toBe(0);
    }
    expect(getTrimBurstDotScale(Number.NaN)).toBe(0);
    const scales = samples(0.01, 15).map(getTrimBurstDotScale);
    const peak = Math.max(...scales);
    expect(peak).toBeGreaterThan(1.05);
    expect(peak).toBeLessThan(1.08);
    expect(getTrimBurstDotScale(8)).toBeCloseTo(1, 6);
    for (let i = 801; i < scales.length; i++) {
      expect(scales[i]).toBeLessThanOrEqual(scales[i - 1]);
    }
  });

  it("sits on each stroke's line just past its end", () => {
    const state = getTrimBurstState(8, { dots: true, jitter: 0 });
    expect(state.dots).toHaveLength(8);
    for (const dot of state.dots) {
      const line = state.lines.find((item) => item.index === dot.index);
      expect(line).toBeDefined();
      if (!line) continue;
      const tip = Math.hypot(line.x2 - 640, line.y2 - 360);
      const center = Math.hypot(dot.cx - 640, dot.cy - 360);
      expect(center - tip).toBeCloseTo(3.25 * 2, 2);
      expect(dot.r).toBeCloseTo(2.5, 3);
    }
    for (const frame of frames(0, 20)) {
      for (const dot of getTrimBurstState(frame, { dots: true }).dots) {
        expect(dot.r).toBeLessThanOrEqual(1.25 * 2 * 1.071);
      }
    }
  });
});

describe("trim burst determinism", () => {
  it("renders any frame identically in any sampling order", () => {
    const options = { seed: 7, jitter: 0.8, dots: true };
    const sample = (frame: number) => getTrimBurstState(frame, options);
    const order = [0, 3, 7, 12, 16, 25];
    const forward = order.map(sample);
    const backward = [...order].reverse().map(sample).reverse();
    expect(backward).toEqual(forward);
    expect(sample(12)).toEqual(forward[3]);
  });

  it("keeps the layout for a seed and changes it with another", () => {
    const layout = getTrimBurstStrokes({ seed: 2 });
    expect(getTrimBurstStrokes({ seed: 2 })).toEqual(layout);
    expect(getTrimBurstStrokes()).not.toEqual(layout);
    const state = getTrimBurstState(6, { seed: 3 });
    expect(getTrimBurstState(6, { seed: 3 })).toEqual(state);
  });
});

describe("trim burst config", () => {
  it("matches the component defaults and ranges", () => {
    const controls = resolveControls("trim-burst", trimBurstConfig.controls);
    expect(getDefaults(controls)).toEqual(trimBurstDefaults);
    expect(trimBurstConfig.componentName).toBe("TrimBurst");
    expect(trimBurstConfig.importPath).toBe("@/components/remocn/trim-burst");
    const cap = controls.cap;
    expect(cap.type === "select" ? cap.options : []).toEqual(["round", "butt"]);
    const range = (key: string) => {
      const control = controls[key];
      return control.type === "number" ? [control.min, control.max] : [];
    };
    expect(range("count")).toEqual([1, 24]);
    expect(range("weight")).toEqual([0.5, 8]);
    expect(range("jitter")).toEqual([0, 1]);
    expect(range("x")).toEqual([0, 1]);
    expect(range("y")).toEqual([0, 1]);
  });
});
