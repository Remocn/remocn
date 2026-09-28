import { describe, expect, it } from "bun:test";
import { getDefaults, resolveControls } from "@/lib/customizer-config";
import {
  getSpeedLinesDuration,
  getSpeedLinesEase,
  getSpeedLinesPosition,
  getSpeedLinesRadius,
  getSpeedLinesRays,
  getSpeedLinesShape,
  getSpeedLinesState,
  getSpeedLinesStreaks,
  getSpeedLinesTime,
  getSpeedLinesTimeline,
  getSpeedLinesVelocity,
  type SpeedLinesOptions,
  type SpeedLinesStreak,
  speedLinesDefaults,
  speedLinesLength,
} from "..";
import { speedLinesConfig } from "../config";

const FOCUS: SpeedLinesOptions = { mode: "focus" };
const DEAD: SpeedLinesOptions = { bounce: 0, squash: 0 };
const DIAGONAL: SpeedLinesOptions = {
  from: { x: 0.1, y: 0.9 },
  to: { x: 0.7, y: 0.2 },
};
const HD: SpeedLinesOptions = { width: 1920, height: 1080 };
const BAND = speedLinesDefaults.spread;
const TRANSFORM =
  /^translate\(-50%, -50%\) rotate\((-?[\d.]+)deg\) scale\(([\d.]+), ([\d.]+)\) rotate\((-?[\d.]+)deg\)$/;

const frames = (first: number, last: number, step = 1) =>
  Array.from(
    { length: Math.floor((last - first) / step) + 1 },
    (_, i) => first + i * step,
  );

function directionOf(options: SpeedLinesOptions) {
  const from = options.from ?? speedLinesDefaults.from;
  const to = options.to ?? { x: 0.5, y: 0.5 };
  const dx = (to.x - from.x) * (options.width ?? 1280);
  const dy = (to.y - from.y) * (options.height ?? 720);
  const distance = Math.hypot(dx, dy);
  return { dx: dx / distance, dy: dy / distance, distance };
}

function offsetOf(time: number, options: SpeedLinesOptions = {}) {
  const to = options.to ?? { x: 0.5, y: 0.5 };
  const { dx, dy } = directionOf(options);
  const { x, y } = getSpeedLinesPosition(time, options);
  const ox = x - to.x * (options.width ?? 1280);
  const oy = y - to.y * (options.height ?? 720);
  return { forward: ox * dx + oy * dy, lateral: -ox * dy + oy * dx };
}

function reachByIndex(options: SpeedLinesOptions, at: number) {
  const map = new Map<number, SpeedLinesStreak>();
  for (const streak of getSpeedLinesStreaks(at, options)) {
    map.set(streak.index, streak);
  }
  return map;
}

describe("speed lines timeline", () => {
  it("ends trail at the documented length and snaps focus on frame 3", () => {
    expect(speedLinesLength).toBe(31);
    expect(getSpeedLinesTimeline()).toEqual({
      mode: "trail",
      impact: 14,
      end: 31,
    });
    expect(getSpeedLinesTimeline({ duration: 22 })).toEqual({
      mode: "trail",
      impact: 22,
      end: 39,
    });
    expect(getSpeedLinesTimeline({ bounce: 0 })).toEqual({
      mode: "trail",
      impact: 14,
      end: 20,
    });
    expect(getSpeedLinesTimeline({ bounce: 1 })).toEqual({
      mode: "trail",
      impact: 14,
      end: 43,
    });
    expect(getSpeedLinesTimeline(FOCUS)).toEqual({
      mode: "focus",
      impact: 3,
      end: 13,
    });
    expect(getSpeedLinesTimeline({ ...FOCUS, bounce: 1 })).toEqual({
      mode: "focus",
      impact: 3,
      end: 13,
    });
    expect(getSpeedLinesDuration()).toBe(speedLinesConfig.durationInFrames);
    expect(getSpeedLinesDuration()).toBe(55);
    expect(getSpeedLinesDuration(FOCUS)).toBe(37);
  });

  it("scales the preview duration with speed, delay, travel and bounce", () => {
    expect(getSpeedLinesDuration({ speed: 2 })).toBe(28);
    expect(getSpeedLinesDuration({ speed: 0.5 })).toBe(110);
    expect(getSpeedLinesDuration({ speed: 0 })).toBe(1);
    expect(getSpeedLinesDuration({ delay: 10 })).toBe(65);
    expect(getSpeedLinesDuration({ delay: 10, speed: 2 })).toBe(38);
    expect(getSpeedLinesDuration({ duration: 30 })).toBe(71);
    expect(getSpeedLinesDuration({ duration: 1 })).toBe(45);
    expect(getSpeedLinesDuration({ duration: Number.NaN })).toBe(55);
    expect(getSpeedLinesDuration({ bounce: 0 })).toBe(44);
    expect(getSpeedLinesDuration({ bounce: 1 })).toBe(67);
    expect(getSpeedLinesDuration({ bounce: Number.NaN })).toBe(55);
    expect(getSpeedLinesDuration({ bounce: 4 })).toBe(67);
    expect(getSpeedLinesDuration({ ...FOCUS, speed: 2 })).toBe(19);
    expect(getSpeedLinesDuration({ ...FOCUS, duration: 40 })).toBe(37);
    const resolve = speedLinesConfig.getDurationInFrames;
    expect(resolve?.({ mode: "focus", speed: 0.5, delay: 6 })).toBe(80);
    expect(resolve?.({ mode: "trail", duration: 20 })).toBe(61);
    expect(resolve?.({ mode: "trail", bounce: 0 })).toBe(44);
    expect(resolve?.({ mode: "other", speed: "fast" })).toBe(55);
  });

  it("maps frames through delay, speed and frame rate", () => {
    expect(getSpeedLinesTime(10)).toBe(10);
    expect(getSpeedLinesTime(10, { delay: 4 })).toBe(6);
    expect(getSpeedLinesTime(10, { speed: 2 })).toBe(20);
    expect(getSpeedLinesTime(10, { delay: 4, speed: 2 })).toBe(12);
    expect(getSpeedLinesTime(10, { fps: 60 })).toBe(5);
    expect(getSpeedLinesTime(10, { fps: 60, delay: 4 })).toBe(3);
    expect(getSpeedLinesTime(3, { delay: 4 })).toBe(0);
    expect(getSpeedLinesTime(Number.NaN)).toBe(0);
    expect(getSpeedLinesTime(10, { delay: -5 })).toBe(10);
  });
});

describe("speed lines travel", () => {
  it("keeps the old hard stop when bounce is 0", () => {
    const ease = (t: number) => getSpeedLinesEase(t, { bounce: 0 });
    expect(ease(-3)).toBe(0);
    expect(ease(0)).toBe(0);
    expect(ease(14)).toBe(1);
    expect(ease(20)).toBe(1);
    expect(ease(90)).toBe(1);
    const flight = frames(0, 14, 0.05).map(ease);
    for (let i = 1; i < flight.length; i++) {
      expect(flight[i]).toBeGreaterThan(flight[i - 1]);
    }
    const h = 1e-4;
    const rate = (t: number) => ((ease(t + h) - ease(t - h)) / (2 * h)) * 14;
    const peak = Math.max(...frames(0.5, 13.5, 0.01).map(rate));
    const contact = ((ease(14) - ease(14 - h)) / h) * 14;
    expect(peak).toBeCloseTo(1.404, 2);
    expect(contact / peak).toBeCloseTo(0.3, 2);
    const recoil = frames(14, 20, 0.05).map(ease);
    expect(Math.max(...recoil)).toBeGreaterThan(1.005);
    expect(Math.max(...recoil)).toBeLessThan(1.02);
    for (const value of recoil) expect(value).toBeGreaterThanOrEqual(1);
  });

  it("carries momentum past the target, swings back once and settles", () => {
    const ease = (t: number) => getSpeedLinesEase(t);
    const sample = (t: number) => ({ t, value: ease(t) });
    const { impact, end } = getSpeedLinesTimeline();
    expect(ease(impact)).toBe(1);
    expect(ease(end)).toBe(1);
    expect(ease(90)).toBe(1);
    const h = 1e-4;
    const rate = (t: number) => ((ease(t + h) - ease(t - h)) / (2 * h)) * 14;
    const peak = Math.max(...frames(0.5, 13.5, 0.01).map(rate));
    const arriving = ((ease(14) - ease(14 - h)) / h) * 14;
    const leaving = ((ease(14 + h) - ease(14)) / h) * 14;
    expect(arriving / peak).toBeCloseTo(0.45, 2);
    expect(leaving).toBeCloseTo(arriving, 2);
    const landing = frames(impact, end, 0.01).map(sample);
    const top = landing.reduce((a, b) => (b.value > a.value ? b : a));
    expect(top.value).toBeGreaterThan(1.03);
    expect(top.value).toBeLessThan(1.04);
    expect(top.t - impact).toBeGreaterThan(1.5);
    expect(top.t - impact).toBeLessThan(2.5);
    const rebound = landing.filter((point) => point.t > top.t);
    const low = rebound.reduce((a, b) => (b.value < a.value ? b : a));
    expect(low.value).toBeLessThan(1);
    expect(1 - low.value).toBeLessThan((top.value - 1) * 0.15);
    const tail = rebound.filter((point) => point.t > low.t);
    expect(Math.max(...tail.map((point) => point.value))).toBeLessThan(1.0005);
    const bouncy = (t: number) => getSpeedLinesEase(t, { bounce: 1 });
    const harder = Math.max(...frames(14, 43, 0.01).map(bouncy));
    expect(harder).toBeGreaterThan(top.value + 0.02);
    expect(harder).toBeLessThan(1.08);
  });

  it("overshoots along the travel direction and stays on the line", () => {
    const cases: SpeedLinesOptions[] = [
      {},
      DIAGONAL,
      { ...DIAGONAL, ...HD },
      { ...DIAGONAL, bounce: 1 },
    ];
    for (const options of cases) {
      const { impact, end } = getSpeedLinesTimeline(options);
      const { distance } = directionOf(options);
      const times = frames(impact, end, 0.05);
      const offsets = times.map((t) => offsetOf(t, options));
      const peak = Math.max(...offsets.map((offset) => offset.forward));
      const expected = options.bounce === 1 ? 0.0722 : 0.0354;
      expect(peak / distance).toBeCloseTo(expected, 3);
      for (const offset of offsets) {
        expect(Math.abs(offset.lateral)).toBeLessThan(1e-6);
      }
      expect(offsetOf(end, options).forward).toBeCloseTo(0, 9);
      expect(offsetOf(end + 30, options).forward).toBeCloseTo(0, 9);
    }
  });

  it("moves the element center from the start to the target", () => {
    expect(getSpeedLinesPosition(0)).toEqual({ x: -320, y: 360 });
    expect(getSpeedLinesPosition(-6)).toEqual({ x: -320, y: 360 });
    expect(getSpeedLinesPosition(14)).toEqual({ x: 640, y: 360 });
    expect(getSpeedLinesPosition(speedLinesLength)).toEqual({ x: 640, y: 360 });
    expect(getSpeedLinesPosition(60)).toEqual({ x: 640, y: 360 });
    const landing = { x: 0.25, y: 0.75 };
    expect(getSpeedLinesPosition(40, landing)).toEqual({ x: 320, y: 540 });
    const target = { ...landing, to: { x: 0.9, y: 0.1 } };
    expect(getSpeedLinesPosition(40, target)).toEqual({ x: 1152, y: 72 });
    const focus = getSpeedLinesPosition(5, { ...FOCUS, x: 0.2, y: 0.4 });
    expect(focus).toEqual({ x: 256, y: 288 });
  });

  it("derives velocity from the same position function", () => {
    const cases: SpeedLinesOptions[] = [
      {},
      DIAGONAL,
      { ...DIAGONAL, speed: 1.5 },
      { bounce: 1 },
    ];
    for (const options of cases) {
      for (const frame of frames(0, 40)) {
        const now = getSpeedLinesTime(frame, options);
        const before = getSpeedLinesTime(frame - 1, options);
        const a = getSpeedLinesPosition(now, options);
        const b = getSpeedLinesPosition(before, options);
        const velocity = getSpeedLinesVelocity(frame, options);
        expect(velocity.x).toBeCloseTo(a.x - b.x, 9);
        expect(velocity.y).toBeCloseTo(a.y - b.y, 9);
      }
    }
    const fast = getSpeedLinesVelocity(9, { fps: 60 });
    const late = getSpeedLinesPosition(4.5);
    const early = getSpeedLinesPosition(4);
    expect(fast.x).toBeCloseTo((late.x - early.x) * 2, 9);
    const { dx, dy } = directionOf(DIAGONAL);
    const moving = getSpeedLinesVelocity(8, DIAGONAL);
    expect(moving.forward).toBeCloseTo(Math.hypot(moving.x, moving.y), 6);
    expect(moving.forward).toBeCloseTo(moving.x * dx + moving.y * dy, 9);
    const rebounding = getSpeedLinesVelocity(18, DIAGONAL);
    const back = Math.hypot(rebounding.x, rebounding.y);
    expect(rebounding.forward).toBeLessThan(-5);
    expect(-rebounding.forward).toBeCloseTo(back, 6);
  });
});

describe("speed lines shape", () => {
  it("preserves the element's area and stays inside the caps", () => {
    const cases: SpeedLinesOptions[] = [
      {},
      DIAGONAL,
      HD,
      { squash: 1 },
      { bounce: 1, squash: 1 },
      { duration: 4, squash: 1 },
      { ...DIAGONAL, duration: 6, speed: 2 },
    ];
    for (const options of cases) {
      for (const time of frames(0, 60, 0.25)) {
        const { along, across } = getSpeedLinesShape(time, options);
        expect(along * across).toBeCloseTo(1, 12);
        expect(along).toBeLessThanOrEqual(1.3);
        expect(along).toBeGreaterThanOrEqual(0.8);
      }
    }
  });

  it("stretches along the path while fast and squashes on impact", () => {
    const { impact, end } = getSpeedLinesTimeline();
    const ease = (t: number) => getSpeedLinesEase(t);
    const along = (t: number) => getSpeedLinesShape(t).along;
    expect(getSpeedLinesShape(0)).toEqual({ rotation: 0, along: 1, across: 1 });
    for (const t of frames(4, 12)) {
      expect(along(t)).toBeGreaterThan(1.2);
      expect(along(t)).toBeLessThan(1.26);
    }
    expect(along(impact)).toBeGreaterThan(1.1);
    const landing = frames(impact, impact + 6, 0.01);
    const squashed = landing.reduce((a, t) => (along(t) < along(a) ? t : a));
    const overshoot = landing.reduce((a, t) => (ease(t) > ease(a) ? t : a));
    expect(Math.abs(squashed - overshoot)).toBeLessThan(0.05);
    expect(along(squashed)).toBeGreaterThan(0.8);
    expect(along(squashed)).toBeLessThan(0.85);
    expect(getSpeedLinesShape(squashed).across).toBeGreaterThan(1.15);
    const after = frames(squashed, end, 0.01);
    expect(Math.max(...after.map(along))).toBeLessThan(1.02);
    const echo = after.reduce((a, t) => (ease(t) < ease(a) ? t : a));
    expect(ease(echo)).toBeLessThan(1);
    expect(along(echo)).toBeCloseTo(1, 3);
    expect(along(end)).toBeCloseTo(1, 6);
    expect(getSpeedLinesShape(60)).toEqual({
      rotation: 0,
      along: 1,
      across: 1,
    });
  });

  it("deforms more at higher speeds and scales with the squash prop", () => {
    const series = (options: SpeedLinesOptions, from: number, to: number) =>
      frames(from, to, 0.25).map((t) => getSpeedLinesShape(t, options).along);
    const peak = (options: SpeedLinesOptions) =>
      Math.max(...series(options, 0, 14));
    const deepest = (options: SpeedLinesOptions) =>
      Math.min(...series(options, 14, 24));
    const slow = { from: { x: 0.2, y: 0.5 }, to: { x: 0.5, y: 0.5 } };
    expect(peak(slow)).toBeLessThan(peak({}));
    expect(deepest(slow)).toBeGreaterThan(deepest({}));
    expect(peak({ squash: 0.25 })).toBeLessThan(peak({}));
    expect(peak({ squash: 1 })).toBeGreaterThan(peak({}));
    expect(deepest({ squash: 1 })).toBeLessThan(deepest({}));
    expect(peak({ squash: 1 })).toBeLessThanOrEqual(1.3);
    expect(deepest({ squash: 1 })).toBeGreaterThanOrEqual(0.8);
    expect(peak({ ...HD })).toBeCloseTo(peak({}), 9);
    const quick = getSpeedLinesShape(6, { speed: 2 }).along;
    expect(quick).toBeGreaterThan(getSpeedLinesShape(6).along);
    expect(quick).toBeLessThanOrEqual(1.3);
  });

  it("orients the deformation along the travel angle", () => {
    const { dx, dy } = directionOf(DIAGONAL);
    const degrees = (Math.atan2(dy, dx) * 180) / Math.PI;
    for (const frame of [8, 16]) {
      const state = getSpeedLinesState(frame, DIAGONAL);
      expect(state.rotation).toBeCloseTo(degrees, 1);
      const match = state.transform.match(TRANSFORM);
      expect(match).not.toBeNull();
      const [first, sx, sy, last] = match?.slice(1).map(Number) ?? [];
      expect(first).toBe(state.rotation);
      expect(last).toBe(-state.rotation);
      expect(sx).toBeCloseTo(state.along, 4);
      expect(sy).toBeCloseTo(state.across, 4);
      const turn = (first * Math.PI) / 180;
      const c = Math.cos(turn);
      const s = Math.sin(turn);
      const apply = (vx: number, vy: number) => {
        const ux = sx * (c * vx + s * vy);
        const uy = sy * (-s * vx + c * vy);
        return [c * ux - s * uy, s * ux + c * uy];
      };
      const [ax, ay] = apply(dx, dy);
      expect(ax).toBeCloseTo(sx * dx, 3);
      expect(ay).toBeCloseTo(sx * dy, 3);
      const [nx, ny] = apply(-dy, dx);
      expect(nx).toBeCloseTo(-sy * dy, 3);
      expect(ny).toBeCloseTo(sy * dx, 3);
    }
    expect(getSpeedLinesState(8, DIAGONAL).along).toBeGreaterThan(1.2);
    expect(getSpeedLinesState(16, DIAGONAL).along).toBeLessThan(0.85);
    expect(getSpeedLinesState(8).rotation).toBe(0);
    const down = { from: { x: 0.5, y: -0.3 }, to: { x: 0.5, y: 0.5 } };
    expect(getSpeedLinesState(8, down).rotation).toBe(90);
  });

  it("gives back a rigid dead stop with bounce and squash at 0", () => {
    const { impact, end } = getSpeedLinesTimeline(DEAD);
    const dead = (t: number) => getSpeedLinesEase(t, DEAD);
    const kappa = (1 + Math.sqrt(0.7)) / 2;
    const gain = 1 / (0.5 - kappa / 3);
    const previous = (t: number) => {
      if (t <= 0) return 0;
      if (t < 14) {
        const w = t / 14;
        return gain * ((w * w) / 2 - (kappa * w * w * w) / 3);
      }
      const s = t - 14;
      if (s >= 6) return 1;
      const x = Math.min(1, Math.max(0, (s - 3) / 3));
      const taper = x * x * (3 - 2 * x);
      return 1 + ((gain * (1 - kappa)) / 14) * s * Math.exp(-s) * (1 - taper);
    };
    expect(end).toBe(impact + 6);
    for (const frame of frames(0, 40, 0.5)) {
      const state = getSpeedLinesState(frame, DEAD);
      expect(state.along).toBe(1);
      expect(state.across).toBe(1);
      expect(state.transform).toBe("translate(-50%, -50%)");
      const rigid = getSpeedLinesState(frame, { squash: 0 });
      expect(rigid.transform).toBe("translate(-50%, -50%)");
    }
    const landing = frames(impact, end, 0.05).map(dead);
    expect(Math.max(...landing)).toBeLessThan(1.012);
    for (const value of landing) expect(value).toBeGreaterThanOrEqual(1);
    for (const time of frames(-2, 30, 0.25)) {
      expect(dead(time)).toBeCloseTo(previous(time), 12);
    }
    for (const frame of frames(0, 40)) {
      const focus = getSpeedLinesState(frame, { ...FOCUS, squash: 1 });
      expect(focus.transform).toBe("translate(-50%, -50%)");
    }
  });
});

describe("speed lines streaks", () => {
  it("draws nothing before the start, at rest, or after the landing", () => {
    for (const frame of [...frames(-6, 0), ...frames(15, 60)]) {
      expect(getSpeedLinesStreaks(frame)).toEqual([]);
      expect(getSpeedLinesState(frame).path).toBe("");
    }
    for (const frame of frames(0, 12)) {
      expect(getSpeedLinesStreaks(frame, { delay: 12 })).toEqual([]);
    }
    for (const frame of frames(0, 40)) {
      expect(getSpeedLinesStreaks(frame, { speed: 0 })).toEqual([]);
      expect(getSpeedLinesStreaks(frame, FOCUS)).toEqual([]);
    }
    const still = { from: { x: 0.5, y: 0.5 }, to: { x: 0.5, y: 0.5 } };
    for (const frame of frames(0, 20)) {
      expect(getSpeedLinesStreaks(frame, still)).toEqual([]);
    }
  });

  it("exists only while the element is actually fast", () => {
    let drawn = 0;
    const cases: SpeedLinesOptions[] = [{}, DIAGONAL, HD, { duration: 30 }];
    for (const options of cases) {
      const unit = (options.height ?? 720) / 720;
      for (const frame of frames(-2, 50, 0.5)) {
        const streaks = getSpeedLinesStreaks(frame, options);
        if (streaks.length === 0) continue;
        drawn++;
        const { forward } = getSpeedLinesVelocity(frame, options);
        expect(forward).toBeGreaterThan(5 * unit);
      }
    }
    expect(drawn).toBeGreaterThan(40);
    for (const frame of frames(6, 14)) {
      expect(getSpeedLinesStreaks(frame).length).toBeGreaterThan(0);
    }
    const nudge = { from: { x: 0.47, y: 0.5 }, to: { x: 0.5, y: 0.5 } };
    for (const frame of frames(0, 30, 0.5)) {
      expect(getSpeedLinesStreaks(frame, nudge)).toEqual([]);
    }
  });

  it("dies at impact and never points back during the rebound", () => {
    const cases: SpeedLinesOptions[] = [
      {},
      DIAGONAL,
      { bounce: 1 },
      { bounce: 0 },
      { duration: 6 },
      { duration: 40, bounce: 1 },
      { speed: 2 },
      { delay: 5 },
      { fps: 60 },
    ];
    for (const options of cases) {
      const { impact, end } = getSpeedLinesTimeline(options);
      const scale = (options.fps ?? 30) / 30 / (options.speed ?? 1);
      const last = (options.delay ?? 0) + (end + 10) * scale;
      let rebound = 0;
      for (const frame of frames(0, last, 0.5)) {
        const time = getSpeedLinesTime(frame, options);
        const streaks = getSpeedLinesStreaks(frame, options);
        const { forward } = getSpeedLinesVelocity(frame, options);
        if (time >= impact + 1) expect(streaks).toEqual([]);
        if (forward <= 0) expect(streaks).toEqual([]);
        if (time > impact && forward < 0) rebound++;
      }
      expect(rebound).toBeGreaterThan(3);
    }
    expect(getSpeedLinesStreaks(14).length).toBeGreaterThan(0);
    expect(getSpeedLinesVelocity(15).forward).toBeGreaterThan(20);
    expect(getSpeedLinesStreaks(15)).toEqual([]);
    const longest = (frame: number, options: SpeedLinesOptions = {}) =>
      Math.max(0, ...getSpeedLinesStreaks(frame, options).map((s) => s.reach));
    const sixty = { fps: 60 };
    expect(longest(29, sixty)).toBeGreaterThan(0);
    expect(longest(29, sixty)).toBeLessThan(longest(28, sixty) * 0.5);
    expect(getSpeedLinesStreaks(30, sixty)).toEqual([]);
  });

  it("keeps streaks parallel, behind the element and inside the band", () => {
    const cases: SpeedLinesOptions[] = [
      {},
      DIAGONAL,
      { ...DIAGONAL, spread: 200 },
    ];
    for (const options of cases) {
      const { dx, dy } = directionOf(options);
      const band = options.spread ?? BAND;
      let checked = 0;
      for (const frame of frames(1, 16, 0.5)) {
        const state = getSpeedLinesState(frame, options);
        for (const streak of state.streaks) {
          const vx = streak.x2 - streak.x1;
          const vy = streak.y2 - streak.y1;
          expect(Math.abs(vx * dy - vy * dx)).toBeLessThan(0.05);
          expect(vx * dx + vy * dy).toBeLessThan(0);
          expect(Math.hypot(vx, vy)).toBeCloseTo(streak.length, 1);
          const fx = streak.x1 - state.x;
          const fy = streak.y1 - state.y;
          expect(fx * dx + fy * dy).toBeLessThan(0.05);
          const lateral = -fx * dy + fy * dx;
          expect(lateral).toBeCloseTo(streak.offset, 1);
          expect(Math.abs(streak.offset)).toBeLessThanOrEqual(band / 2);
          checked++;
        }
      }
      expect(checked).toBeGreaterThan(20);
    }
  });

  it("stretches each streak in proportion to the element's speed", () => {
    const ratios = new Map<number, number[]>();
    for (const frame of frames(3, 13)) {
      const { forward } = getSpeedLinesVelocity(frame);
      expect(forward).toBeGreaterThanOrEqual(14);
      for (const streak of getSpeedLinesStreaks(frame)) {
        const list = ratios.get(streak.index) ?? [];
        list.push(streak.reach / forward);
        ratios.set(streak.index, list);
      }
    }
    expect(ratios.size).toBeGreaterThan(6);
    for (const list of ratios.values()) {
      for (const ratio of list) {
        expect(ratio).toBeCloseTo(list[0], 9);
        expect(ratio).toBeGreaterThanOrEqual(0.8);
        expect(ratio).toBeLessThanOrEqual(1.6);
      }
    }
    const near = { from: { x: 0.1, y: 0.5 }, to: { x: 0.4, y: 0.5 } };
    const far = { from: { x: 0.1, y: 0.5 }, to: { x: 0.7, y: 0.5 } };
    let compared = 0;
    for (const frame of frames(4, 11)) {
      const short = reachByIndex(near, frame);
      const long = reachByIndex(far, frame);
      for (const [index, streak] of short) {
        const twin = long.get(index);
        if (!twin) continue;
        expect(twin.reach).toBeCloseTo(streak.reach * 2, 6);
        expect(twin.length).toBeCloseTo(streak.length * 2, 6);
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(10);
  });

  it("shortens the streaks as the element brakes into the landing", () => {
    const speeds = frames(9, 16).map((f) => getSpeedLinesVelocity(f).forward);
    for (let i = 1; i < speeds.length; i++) {
      expect(speeds[i]).toBeLessThan(speeds[i - 1]);
    }
    let compared = 0;
    for (const frame of frames(10, 13)) {
      const now = reachByIndex({}, frame);
      const next = reachByIndex({}, frame + 1);
      for (const [index, streak] of now) {
        const later = next.get(index);
        if (!later) continue;
        expect(later.reach).toBeLessThan(streak.reach);
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(2);
    const longest = (frame: number) =>
      Math.max(0, ...getSpeedLinesStreaks(frame).map((s) => s.reach));
    expect(longest(14)).toBeLessThan(longest(9) * 0.65);
    expect(longest(15)).toBe(0);
  });

  it("spreads consecutive streaks far apart across the band", () => {
    const offsets = new Map<number, number>();
    for (const frame of frames(0, 16, 0.25)) {
      for (const streak of getSpeedLinesStreaks(frame)) {
        offsets.set(streak.index, streak.offset);
      }
    }
    expect(offsets.size).toBe(speedLinesDefaults.count);
    const lanes = frames(0, speedLinesDefaults.count - 1).map(
      (index) => offsets.get(index) ?? Number.NaN,
    );
    for (let i = 1; i < lanes.length; i++) {
      expect(Math.abs(lanes[i] - lanes[i - 1])).toBeGreaterThan(BAND * 0.25);
    }
    expect(Math.min(...lanes)).toBeLessThan(-BAND * 0.3);
    expect(Math.max(...lanes)).toBeGreaterThan(BAND * 0.3);
  });
});

describe("speed lines focus", () => {
  it("draws nothing before the rush or after the retract", () => {
    for (const frame of [...frames(-4, 0), ...frames(13, 40)]) {
      expect(getSpeedLinesRays(frame, FOCUS)).toEqual([]);
      expect(getSpeedLinesState(frame, FOCUS).path).toBe("");
    }
    for (const frame of frames(0, 9)) {
      expect(getSpeedLinesRays(frame, { ...FOCUS, delay: 9 })).toEqual([]);
    }
    for (const frame of frames(0, 20)) {
      expect(getSpeedLinesRays(frame)).toEqual([]);
    }
    for (const frame of frames(2, 9)) {
      const rays = getSpeedLinesRays(frame, FOCUS);
      expect(rays).toHaveLength(speedLinesDefaults.count);
    }
  });

  it("rushes inner ends in, snaps on the impact frame, then retracts", () => {
    const at = (frame: number) =>
      new Map(getSpeedLinesRays(frame, FOCUS).map((ray) => [ray.index, ray]));
    const impact = at(3);
    for (const [index, ray] of impact) {
      expect(ray.inner).toBe(ray.rest);
      expect(ray.rest).toBeGreaterThanOrEqual(BAND);
      expect(ray.rest).toBeLessThanOrEqual(BAND * 1.6);
      const inners = frames(1, 12).map((f) => at(f).get(index)?.inner);
      const rush = [inners[0] ?? ray.outer, inners[1], inners[2]];
      expect(rush[0]).toBeGreaterThan(rush[1] ?? 0);
      expect(rush[1]).toBeGreaterThan(ray.inner);
      for (const inner of inners) {
        if (inner !== undefined) expect(inner).toBeGreaterThanOrEqual(ray.rest);
      }
      const hold = [4, 5, 6, 7].map((f) => at(f).get(index)?.inner ?? 0);
      for (const inner of hold) {
        expect(inner).toBeGreaterThan(ray.rest);
        expect(inner).toBeLessThan(ray.rest * 1.12);
      }
      const innerAt = (f: number) => at(f).get(index)?.inner ?? ray.outer;
      const late = frames(9, 12).map(innerAt);
      for (let i = 1; i < late.length; i++) {
        expect(late[i]).toBeGreaterThanOrEqual(late[i - 1]);
      }
      expect(late[late.length - 1]).toBeGreaterThan(ray.rest * 1.5);
    }
  });

  it("keeps rays radial, clear of the point and running off the frame", () => {
    const cases: SpeedLinesOptions[] = [
      FOCUS,
      { ...FOCUS, x: 0.2, y: 0.7, spread: 60 },
      { ...FOCUS, ...HD, count: 30 },
    ];
    for (const options of cases) {
      const width = options.width ?? 1280;
      const height = options.height ?? 720;
      const unit = height / 720;
      const cx = (options.x ?? 0.5) * width;
      const cy = (options.y ?? 0.5) * height;
      const spread = (options.spread ?? BAND) * unit;
      for (const frame of frames(1, 12, 0.5)) {
        for (const ray of getSpeedLinesRays(frame, options)) {
          const ix = ray.x1 - cx;
          const iy = ray.y1 - cy;
          expect(Math.hypot(ix, iy)).toBeCloseTo(ray.inner, 1);
          expect(ray.inner).toBeGreaterThanOrEqual(spread);
          const vx = ray.x2 - ray.x1;
          const vy = ray.y2 - ray.y1;
          const sine =
            Math.abs(vx * iy - vy * ix) / (Math.hypot(vx, vy) * ray.inner);
          expect(sine).toBeLessThan(0.02);
          expect(vx * ix + vy * iy).toBeGreaterThan(0);
          const off =
            ray.x2 <= 0 || ray.x2 >= width || ray.y2 <= 0 || ray.y2 >= height;
          expect(off).toBe(true);
        }
      }
    }
  });

  it("times one ray from the edge to the snap and back", () => {
    const ray = { rest: 100, outer: 500, start: 0.5, release: 9 };
    expect(getSpeedLinesRadius(0, ray)).toBe(500);
    expect(getSpeedLinesRadius(0.5, ray)).toBe(500);
    expect(getSpeedLinesRadius(3, ray)).toBe(100);
    const rush = frames(0.5, 3, 0.25).map((t) => getSpeedLinesRadius(t, ray));
    for (let i = 1; i < rush.length; i++) {
      expect(rush[i]).toBeLessThan(rush[i - 1]);
    }
    const steps = rush.slice(1).map((value, i) => rush[i] - value);
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]).toBeGreaterThan(steps[i - 1]);
    }
    expect(getSpeedLinesRadius(9, ray)).toBeLessThan(112);
    expect(getSpeedLinesRadius(12.5, ray)).toBe(500);
    expect(getSpeedLinesRadius(30, ray)).toBe(500);
  });
});

describe("speed lines reference scaling", () => {
  it("scales every size with the composition height", () => {
    const cases: [SpeedLinesOptions, number][] = [
      [{}, 9],
      [{}, 16],
      [DIAGONAL, 7],
      [FOCUS, 5],
      [{ ...FOCUS, x: 0.3, y: 0.6 }, 10],
    ];
    for (const [options, frame] of cases) {
      const base = getSpeedLinesState(frame, options);
      const large = getSpeedLinesState(frame, { ...options, ...HD });
      expect(large.unit).toBe(1.5);
      expect(large.strokeWidth).toBeCloseTo(base.strokeWidth * 1.5, 9);
      expect(large.radius).toBeCloseTo(base.radius * 1.5, 9);
      expect(large.x).toBeCloseTo(base.x * 1.5, 6);
      expect(large.y).toBeCloseTo(base.y * 1.5, 6);
      expect(large.left).toBeCloseTo(base.left, 9);
      expect(large.along).toBeCloseTo(base.along, 9);
      expect(large.rotation).toBeCloseTo(base.rotation, 9);
      const segments = [...base.streaks, ...base.rays];
      const scaled = [...large.streaks, ...large.rays];
      expect(scaled).toHaveLength(segments.length);
      for (const [i, segment] of segments.entries()) {
        expect(scaled[i].index).toBe(segment.index);
        expect(scaled[i].x1).toBeCloseTo(segment.x1 * 1.5, 1);
        expect(scaled[i].y1).toBeCloseTo(segment.y1 * 1.5, 1);
        expect(scaled[i].x2).toBeCloseTo(segment.x2 * 1.5, 1);
        expect(scaled[i].y2).toBeCloseTo(segment.y2 * 1.5, 1);
        expect(scaled[i].length).toBeCloseTo(segment.length * 1.5, 6);
      }
    }
    expect(getSpeedLinesState(9).streaks.length).toBeGreaterThan(0);
    expect(getSpeedLinesState(16).along).toBeLessThan(0.85);
    expect(getSpeedLinesState(0).strokeWidth).toBe(2);
    expect(getSpeedLinesState(0, { height: 2160 }).strokeWidth).toBe(6);
    const heavy = getSpeedLinesState(0, { weight: 3, height: 1440 });
    expect(heavy.strokeWidth).toBe(6);
    expect(getSpeedLinesState(0).radius).toBe(48);
  });
});

describe("speed lines determinism", () => {
  it("renders any frame identically in any sampling order", () => {
    const cases: SpeedLinesOptions[] = [
      { ...DIAGONAL, seed: 7 },
      { ...FOCUS, seed: 7 },
      { bounce: 1, squash: 1 },
    ];
    for (const options of cases) {
      const sample = (frame: number) => getSpeedLinesState(frame, options);
      const order = [0, 4, 7.5, 9, 12, 3, 15, 16, 22, 30];
      const forward = order.map(sample);
      const backward = [...order].reverse().map(sample).reverse();
      expect(backward).toEqual(forward);
      expect(sample(9)).toEqual(forward[3]);
      expect(sample(16)).toEqual(forward[7]);
    }
  });

  it("reseeds the streaks and rays", () => {
    const streaks = (seed: number) => getSpeedLinesStreaks(9, { seed });
    expect(streaks(1)).toEqual(streaks(1));
    expect(streaks(2)).not.toEqual(streaks(1));
    const rays = (seed: number) => getSpeedLinesRays(5, { ...FOCUS, seed });
    expect(rays(3)).toEqual(rays(3));
    expect(rays(4)).not.toEqual(rays(3));
  });

  it("maps other frame rates and speeds onto the 30 fps timeline", () => {
    for (const frame of [0, 5, 9, 14, 16, 17, 22, 25]) {
      const base = getSpeedLinesState(frame);
      const doubled = getSpeedLinesState(frame * 2, { fps: 60 });
      expect(doubled.x).toBeCloseTo(base.x, 9);
      expect(doubled.y).toBeCloseTo(base.y, 9);
      expect(doubled.along).toBeCloseTo(base.along, 9);
      const slow = getSpeedLinesState(frame * 2, { speed: 0.5 });
      expect(slow.x).toBeCloseTo(base.x, 9);
      expect(slow.along).toBeLessThanOrEqual(base.along);
      const rays = getSpeedLinesRays(frame * 2, { ...FOCUS, fps: 60 });
      expect(rays).toEqual(getSpeedLinesRays(frame, FOCUS));
    }
    const frozen = getSpeedLinesState(30, { speed: 0 });
    expect(frozen.x).toBe(-320);
    expect(frozen.along).toBe(1);
    expect(frozen.path).toBe("");
  });
});

describe("speed lines render state", () => {
  it("builds one clean path and clamps invalid input", () => {
    const state = getSpeedLinesState(9);
    expect(state.path.match(/M /g)).toHaveLength(state.streaks.length);
    expect(state.path).toMatch(/^M -?\d/);
    const cases: SpeedLinesOptions[] = [
      { count: Number.NaN, weight: 99, spread: -5 },
      { ...FOCUS, count: 1000, x: 1.4, y: -0.3 },
      { from: { x: Number.NaN, y: 0.2 }, duration: 0 },
      { bounce: Number.NaN, squash: 9 },
      { ...DIAGONAL, bounce: -3, squash: Number.POSITIVE_INFINITY },
    ];
    for (const options of cases) {
      for (const frame of frames(0, 48)) {
        const probe = getSpeedLinesState(frame, options);
        expect(probe.path).not.toMatch(/NaN|Infinity/);
        expect(probe.transform).not.toMatch(/NaN|Infinity/);
        expect(Number.isFinite(probe.x) && Number.isFinite(probe.y)).toBe(true);
        expect(probe.along).toBeLessThanOrEqual(1.3);
        expect(probe.along).toBeGreaterThanOrEqual(0.8);
        expect(probe.rays.length).toBeLessThanOrEqual(64);
        expect(probe.streaks.length).toBeLessThanOrEqual(64);
      }
    }
    expect(getSpeedLinesState(0, { weight: 99 }).strokeWidth).toBe(12);
    expect(getSpeedLinesState(0, { spread: -5 }).radius).toBe(4);
    expect(getSpeedLinesTimeline({ duration: 0 }).impact).toBe(4);
    expect(getSpeedLinesTimeline({ bounce: -3 }).end).toBe(20);
  });

  it("centers children on the moving point in percent of the frame", () => {
    const start = getSpeedLinesState(0);
    expect(start.left).toBeCloseTo(-25, 9);
    expect(start.top).toBeCloseTo(50, 9);
    expect(start.transform).toBe("translate(-50%, -50%)");
    const settled = getSpeedLinesState(speedLinesLength);
    expect(settled.left).toBeCloseTo(50, 9);
    expect(settled.top).toBeCloseTo(50, 9);
    const rest = getSpeedLinesState(speedLinesLength + 1);
    expect(rest.transform).toBe("translate(-50%, -50%)");
    const focus = getSpeedLinesState(4, { ...FOCUS, x: 0.8, y: 0.25 });
    expect(focus.left).toBeCloseTo(80, 9);
    expect(focus.top).toBeCloseTo(25, 9);
  });
});

describe("speed lines config", () => {
  it("matches the component defaults and exposes both modes", () => {
    const controls = resolveControls("speed-lines", speedLinesConfig.controls);
    expect(getDefaults(controls)).toEqual({
      mode: speedLinesDefaults.mode,
      count: speedLinesDefaults.count,
      weight: speedLinesDefaults.weight,
      spread: speedLinesDefaults.spread,
      duration: speedLinesDefaults.duration,
      bounce: speedLinesDefaults.bounce,
      squash: speedLinesDefaults.squash,
      x: speedLinesDefaults.x,
      y: speedLinesDefaults.y,
      delay: speedLinesDefaults.delay,
      color: speedLinesDefaults.color,
      seed: speedLinesDefaults.seed,
      speed: speedLinesDefaults.speed,
    });
    const mode = controls.mode;
    const modes = mode.type === "select" ? mode.options : [];
    expect(modes).toEqual(["trail", "focus"]);
    const range = (key: string) => {
      const control = controls[key];
      return control.type === "number" ? [control.min, control.max] : [];
    };
    expect(range("count")).toEqual([3, 32]);
    expect(range("weight")).toEqual([1, 8]);
    expect(range("spread")).toEqual([16, 320]);
    expect(range("duration")).toEqual([6, 40]);
    expect(range("bounce")).toEqual([0, 1]);
    expect(range("squash")).toEqual([0, 1]);
    expect(range("x")).toEqual([0, 1]);
    expect(range("y")).toEqual([0, 1]);
    expect(speedLinesConfig.previewBackdrop).toEqual({
      type: "color",
      value: "#002fa7",
    });
  });
});
