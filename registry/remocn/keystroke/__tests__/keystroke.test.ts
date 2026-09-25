import { describe, expect, it } from "bun:test";
import { getDefaults, resolveControls } from "@/lib/customizer-config";
import {
  getKeystrokeDepth,
  getKeystrokeDuration,
  getKeystrokeLayout,
  getKeystrokeLeadIn,
  getKeystrokeMetrics,
  getKeystrokePress,
  getKeystrokeRelease,
  getKeystrokeRise,
  getKeystrokeState,
  getKeystrokeTime,
  getKeystrokeTimeline,
  getKeystrokeWordUnits,
  type KeystrokeOptions,
  type KeystrokePlatform,
  keystrokeDefaultSteps,
  keystrokeDefaults,
  keystrokeLength,
  keystrokePalettes,
  parseKeystrokeKeys,
} from "..";
import { keystrokeConfig } from "../config";

type State = ReturnType<typeof getKeystrokeState>;

const frames = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const samples = (step: number, end: number) =>
  Array.from({ length: Math.round(end / step) + 1 }, (_, i) => i * step);

const legends = (keys: string, platform?: KeystrokePlatform) =>
  parseKeystrokeKeys(keys, platform).map((chord) =>
    chord.map(({ legend }) =>
      legend.kind === "icon" ? legend.icon : legend.text,
    ),
  );

const units = (keys: string, platform?: KeystrokePlatform) =>
  parseKeystrokeKeys(keys, platform)
    .flat()
    .map((key) => key.units);

const groupOf = (state: State, step: number) => {
  const group = state.groups.find((item) => item.step === step);
  if (!group) throw new Error(`step ${step} is not on screen`);
  return group;
};

const only = (keys: string, at = 40, hold?: number) => {
  const { groups } = getKeystrokeTimeline({ steps: [{ at, keys, hold }] });
  return groups[0];
};

describe("keystroke timeline", () => {
  it("fires every default step on its at frame and ends on the length", () => {
    const { groups, end } = getKeystrokeTimeline();
    expect(keystrokeLength).toBe(166);
    expect(end).toBe(keystrokeLength);
    expect(groups.map((group) => group.enter)).toEqual([7, 48, 98]);
    expect(groups.map((group) => group.timing.map((c) => c.fire))).toEqual([
      [20],
      [58, 78],
      [114],
    ]);
    expect(groups.map((group) => group.at)).toEqual(
      keystrokeDefaultSteps.map((step) => step.at),
    );
    expect(groups.map((group) => group.lastRelease)).toEqual([31, 86, 128]);
    expect(groups.map((group) => group.pushes)).toEqual([[48], [98], []]);
    expect(groups.map((group) => group.exit)).toEqual([61, 116, 158]);
    expect(groups.map((group) => group.end)).toEqual([69, 124, 166]);
    expect(getKeystrokeDuration()).toBe(180);
    expect(keystrokeConfig.durationInFrames).toBe(getKeystrokeDuration());
  });

  it("scales the preview with speed, linger and frame rate", () => {
    expect(getKeystrokeDuration({ speed: 2 })).toBe(97);
    expect(getKeystrokeDuration({ speed: 0.5 })).toBe(346);
    expect(getKeystrokeDuration({ speed: 0 })).toBe(14);
    expect(getKeystrokeDuration({ linger: 0 })).toBe(150);
    expect(getKeystrokeDuration({ linger: 90 })).toBe(240);
    expect(getKeystrokeDuration({ steps: [] })).toBe(14);
    const single = { steps: [{ at: 20, keys: "mod+k" }] };
    expect(getKeystrokeDuration(single)).toBe(83);
    const doubled = {
      steps: [{ at: 40, keys: "mod+k", hold: 16 }],
      linger: 60,
      fps: 60,
    };
    expect(getKeystrokeDuration(doubled)).toBe(166);
    const resolve = keystrokeConfig.getDurationInFrames;
    expect(resolve?.({ speed: 2, linger: 0 })).toBe(82);
    expect(resolve?.({ speed: "fast", linger: "long" })).toBe(180);
  });

  it("schedules a chord backward from the frame it fires", () => {
    const group = only("shift+mod+p", 40, 10);
    const [chord] = group.timing;
    expect(chord.fire).toBe(40);
    expect(chord.keys.map((key) => key.press)).toEqual([31, 34, 37]);
    expect(chord.keys.map((key) => key.release)).toEqual([56, 53, 50]);
    expect(chord.enter).toBe(24);
    expect(group.lastRelease).toBe(56);
    expect(getKeystrokeLeadIn("enter")).toBe(10);
    expect(getKeystrokeLeadIn("mod+k")).toBe(13);
    expect(getKeystrokeLeadIn("shift+mod+p")).toBe(16);
    expect(getKeystrokeLeadIn("g i")).toBe(30);
    expect(getKeystrokeLeadIn("g i", 20)).toBe(42);
    expect(getKeystrokeLeadIn("")).toBe(0);
  });

  it("chains the chords of a sequence and fires on the last one", () => {
    const group = only("g i", 60);
    expect(group.timing.map((chord) => chord.fire)).toEqual([40, 60]);
    expect(group.timing.map((chord) => chord.enter)).toEqual([30, 50]);
    expect(group.timing[1].enter).toBe(group.timing[0].keys[0].release + 2);
    expect(group.label).toBe("G then I");
  });

  it("drops invalid steps and orders groups by the frame they appear", () => {
    const { groups } = getKeystrokeTimeline({
      steps: [
        { at: 90, keys: "mod+s" },
        { at: Number.NaN, keys: "mod+k" },
        { at: 30, keys: "   " },
        { at: 40, keys: "mod+z", hold: -5 },
      ],
    });
    expect(groups.map((group) => group.keys)).toEqual(["mod+z", "mod+s"]);
    expect(groups.map((group) => group.step)).toEqual([3, 0]);
    expect(groups.map((group) => group.index)).toEqual([0, 1]);
    expect(groups[0].hold).toBe(0);
    expect(getKeystrokeTimeline({ steps: [] })).toEqual({
      platform: "mac",
      linger: 30,
      groups: [],
      end: 0,
    });
  });
});

describe("keystroke press", () => {
  it("goes down in three eased frames and holds exactly at the bottom", () => {
    expect(getKeystrokePress(0)).toBe(0);
    expect(getKeystrokePress(1)).toBeCloseTo(7 / 27, 6);
    expect(getKeystrokePress(2)).toBeCloseTo(20 / 27, 6);
    expect(getKeystrokePress(3)).toBe(1);
    expect(getKeystrokePress(40)).toBe(1);
    expect(getKeystrokePress(-2)).toBe(0);
    expect(getKeystrokePress(Number.NaN)).toBe(0);
    const curve = samples(0.01, 3).map(getKeystrokePress);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i]).toBeGreaterThan(curve[i - 1]);
    }
    const steps = curve.slice(1).map((value, i) => value - curve[i]);
    expect(steps[0]).toBeLessThan(steps[150]);
    expect(steps[steps.length - 1]).toBeLessThan(steps[150]);
  });

  it("springs back up with a capped overshoot and lands on rest", () => {
    expect(getKeystrokeRelease(0)).toBe(0);
    expect(getKeystrokeRelease(-1)).toBe(0);
    expect(getKeystrokeRelease(Number.NaN)).toBe(0);
    expect(getKeystrokeRelease(3)).toBeCloseTo(1, 6);
    expect(getKeystrokeRelease(10)).toBe(1);
    expect(getKeystrokeRelease(60)).toBe(1);
    const curve = samples(0.01, 10).map(getKeystrokeRelease);
    const peak = Math.max(...curve);
    expect(peak).toBeGreaterThan(1.15);
    expect(peak).toBeLessThan(1.22);
    for (let i = 1; i <= 300; i++) {
      expect(curve[i]).toBeGreaterThan(curve[i - 1]);
    }
    const after = curve.slice(curve.indexOf(peak));
    expect(Math.min(...after)).toBeGreaterThan(0.98);
    expect(Math.abs(curve[999] - 1)).toBeLessThan(0.001);
  });

  it("rises in with a small settle and lands on frame 10", () => {
    expect(getKeystrokeRise(0)).toBe(0);
    expect(getKeystrokeRise(4)).toBeCloseTo(1, 6);
    expect(getKeystrokeRise(10)).toBe(1);
    const curve = samples(0.01, 10).map(getKeystrokeRise);
    const peak = Math.max(...curve);
    expect(peak).toBeGreaterThan(1.05);
    expect(peak).toBeLessThan(1.08);
    for (let i = 1; i <= 400; i++) {
      expect(curve[i]).toBeGreaterThan(curve[i - 1]);
    }
    expect(Math.min(...curve.slice(curve.indexOf(peak)))).toBeGreaterThan(0.99);
  });

  it("keeps the modifiers down while the trigger taps", () => {
    for (const keys of ["mod+k", "shift+mod+p", "ctrl+alt+shift+delete"]) {
      const [chord] = only(keys).timing;
      const trigger = chord.keys[chord.keys.length - 1];
      expect(getKeystrokeDepth(chord.fire, trigger)).toBe(1);
      expect(getKeystrokeDepth(chord.fire - 0.5, trigger)).toBeLessThan(1);
      for (const [i, key] of chord.keys.entries()) {
        if (i > 0) {
          expect(key.press - chord.keys[i - 1].press).toBe(3);
          expect(chord.keys[i - 1].release - key.release).toBe(3);
        }
        for (const later of chord.keys.slice(i + 1)) {
          for (const offset of samples(0.25, later.release - later.press)) {
            expect(getKeystrokeDepth(later.press + offset, key)).toBe(1);
          }
        }
      }
    }
  });

  it("shortens the wall, tightens the shadow and lights the legend", () => {
    const caps = (frame: number) => getKeystrokeState(frame).groups[0].caps;
    const [rest] = caps(14);
    const [command, key] = caps(20);
    expect(rest.depth).toBe(0);
    expect(rest.lift).toBe(0);
    expect(rest.wall).toBeCloseTo(64 * 0.16, 3);
    expect(command.depth).toBe(1);
    expect(key.depth).toBe(1);
    expect(command.lift).toBeCloseTo(64 * 0.12, 3);
    expect(command.wall).toBeCloseTo(64 * 0.04, 3);
    expect(command.shadowY).toBeLessThan(rest.shadowY);
    expect(command.shadowBlur).toBeLessThan(rest.shadowBlur);
    expect(rest.color).toBe(keystrokePalettes.light.ink);
    expect(command.color).toBe(keystrokeDefaults.accent);
    expect(caps(16)[0].color).toMatch(
      /^color-mix\(in srgb, #0a84ff \d+%, #1d1d1f\)$/,
    );
    const [, overshoot] = caps(33);
    expect(overshoot.depth).toBeLessThan(-0.15);
    expect(overshoot.wall).toBeGreaterThan(rest.wall);
    expect(overshoot.shadowY).toBeGreaterThan(rest.shadowY);
    expect(overshoot.color).toBe(keystrokePalettes.light.ink);
    for (const frame of frames(34, 47)) {
      for (const cap of caps(frame)) {
        expect(cap.depth).toBeLessThan(1);
        if (cap.depth < 0.01) {
          expect(cap.color).toBe(keystrokePalettes.light.ink);
        }
      }
    }
  });
});

describe("keystroke sequence", () => {
  it("adds a separator, re-centers the row and dims the earlier chord", () => {
    const before = groupOf(getKeystrokeState(66), 1);
    expect(before.caps.map((cap) => cap.key.label)).toEqual(["G"]);
    expect(before.separators).toEqual([]);
    expect(before.width).toBe(64);
    const settled = groupOf(getKeystrokeState(80), 1);
    expect(settled.caps.map((cap) => cap.key.label)).toEqual(["G", "I"]);
    expect(settled.separators).toHaveLength(1);
    expect(settled.width).toBeCloseTo(2.95 * 64, 3);
    const [first, last] = settled.caps;
    expect(first.x + last.x + last.width).toBeCloseTo(0, 3);
    expect(settled.separators[0].x).toBeCloseTo(first.x + 64, 3);
    expect(first.opacity).toBeCloseTo(0.45, 3);
    expect(last.opacity).toBe(1);
    let previous = Number.POSITIVE_INFINITY;
    for (const frame of frames(68, 78)) {
      const [g] = groupOf(getKeystrokeState(frame), 1).caps;
      expect(g.x).toBeLessThanOrEqual(previous);
      previous = g.x;
    }
    const dims = frames(72, 78).map(
      (frame) => groupOf(getKeystrokeState(frame), 1).caps[0].opacity,
    );
    expect(dims[0]).toBe(1);
    for (let i = 1; i < dims.length; i++) {
      expect(dims[i]).toBeLessThan(dims[i - 1]);
    }
    expect(dims[dims.length - 1]).toBeCloseTo(0.45, 3);
  });
});

describe("keystroke stack", () => {
  it("keeps at most two groups on screen, newest in front", () => {
    for (const frame of frames(0, 200)) {
      const { groups } = getKeystrokeState(frame);
      expect(groups.length).toBeLessThanOrEqual(2);
      if (groups.length < 2) continue;
      const [back, front] = groups;
      expect(back.index).toBeLessThan(front.index);
      expect(front.slot).toBe(0);
      expect(back.slot).toBeGreaterThan(0);
      expect(back.y).toBeLessThan(0);
      expect(back.scale).toBeLessThan(1);
    }
  });

  it("parks a pushed group one slot above the front row", () => {
    const [pushed] = getKeystrokeState(60).groups;
    expect(pushed.step).toBe(0);
    expect(pushed.slot).toBe(1);
    expect(pushed.scale).toBeCloseTo(0.86, 3);
    expect(pushed.opacity).toBeCloseTo(0.55, 3);
    expect(pushed.y).toBeCloseTo(-1.09 * 64, 2);
    const bottom = pushed.y + (64 / 2) * pushed.scale;
    expect(bottom).toBeCloseTo(-32 - 0.16 * 64, 2);
  });

  it("leaves after its linger, soon after a push, or on a third", () => {
    const linger = getKeystrokeTimeline({
      steps: [{ at: 20, keys: "mod+k" }],
      linger: 45,
    });
    expect(linger.groups[0].exit).toBe(31 + 45);
    const brief = getKeystrokeTimeline({
      steps: [
        { at: 20, keys: "mod+k" },
        { at: 50, keys: "mod+s" },
      ],
      linger: 60,
    });
    expect(brief.groups[0].pushes).toEqual([37]);
    expect(brief.groups[0].exit).toBe(37 + 18);
    const pressed = getKeystrokeTimeline({
      steps: [
        { at: 20, keys: "mod+k" },
        { at: 40, keys: "mod+s" },
      ],
      linger: 60,
    });
    expect(pressed.groups[0].pushes).toEqual([27]);
    expect(pressed.groups[0].exit).toBe(31 + 18);
    const dense = getKeystrokeTimeline({
      steps: [
        { at: 20, keys: "mod+k" },
        { at: 30, keys: "mod+s" },
        { at: 40, keys: "mod+z" },
      ],
    });
    expect(dense.groups[0].pushes).toEqual([17, 27]);
    expect(dense.groups[0].exit).toBe(27);
    for (const time of samples(0.5, 120)) {
      const holding = dense.groups.filter(
        (group) => time > group.enter && time < group.exit,
      );
      expect(holding.length).toBeLessThanOrEqual(2);
    }
    const late = getKeystrokeTimeline({
      steps: [
        { at: 20, keys: "mod+k" },
        { at: 120, keys: "mod+s" },
      ],
    });
    expect(late.groups[0].pushes).toEqual([]);
    expect(late.groups[0].exit).toBe(61);
  });

  it("brings the keys of a pushed group up before it leaves", () => {
    const steps = [
      { at: 20, keys: "shift+mod+z", hold: 30 },
      { at: 36, keys: "mod+k" },
    ];
    const [held] = getKeystrokeTimeline({ steps }).groups;
    expect(held.pushes).toEqual([23]);
    expect(held.lastRelease).toBe(56);
    expect(held.exit).toBe(56 + 18);
    for (const frame of frames(50, 66)) {
      const back = groupOf(getKeystrokeState(frame, { steps }), 0);
      expect(back.slot).toBe(1);
      expect(back.opacity).toBeCloseTo(0.55, 3);
    }
    const settled = groupOf(getKeystrokeState(66, { steps }), 0);
    expect(settled.caps.map((cap) => cap.depth)).toEqual([0, 0, 0]);
  });

  it("sinks a front group and lifts a pushed group as it leaves", () => {
    const front = frames(159, 165).map(
      (frame) => getKeystrokeState(frame).groups[0],
    );
    for (const [i, group] of front.entries()) {
      expect(group.step).toBe(2);
      expect(group.y).toBeGreaterThan(0);
      if (i > 0) {
        expect(group.y).toBeGreaterThan(front[i - 1].y);
        expect(group.opacity).toBeLessThan(front[i - 1].opacity);
      }
    }
    const pushed = frames(62, 68).map(
      (frame) => getKeystrokeState(frame).groups[0],
    );
    for (const [i, group] of pushed.entries()) {
      expect(group.step).toBe(0);
      if (i > 0) {
        expect(group.y).toBeLessThan(pushed[i - 1].y);
        expect(group.opacity).toBeLessThan(pushed[i - 1].opacity);
      }
    }
    const after = getKeystrokeState(69).groups.map((group) => group.step);
    expect(after).toEqual([1]);
    expect(getKeystrokeState(166).groups).toEqual([]);
  });
});

describe("keystroke keys", () => {
  it("resolves mod and draws glyphs on mac and words on windows", () => {
    expect(legends("mod+k")).toEqual([["command", "K"]]);
    expect(legends("mod+k", "windows")).toEqual([["Ctrl", "K"]]);
    expect(legends("shift+mod+p")).toEqual([["shift", "command", "P"]]);
    expect(legends("shift+mod+p", "windows")).toEqual([
      ["Ctrl", "Shift", "P"],
    ]);
    expect(legends("enter")).toEqual([["return"]]);
    expect(legends("return", "windows")).toEqual([["Enter"]]);
    expect(legends("mod+backspace")).toEqual([["command", "delete"]]);
    expect(legends("esc tab space")).toEqual([["escape"], ["tab"], ["space"]]);
    expect(legends("esc tab space", "windows")).toEqual([
      ["Esc"],
      ["Tab"],
      ["Space"],
    ]);
    expect(legends("up down left right", "windows")).toEqual([
      ["up"],
      ["down"],
      ["left"],
      ["right"],
    ]);
    const [[command]] = parseKeystrokeKeys("cmd");
    expect(command).toEqual({
      name: "meta",
      label: "Command",
      legend: { kind: "icon", icon: "command" },
      units: 1,
      modifier: true,
    });
  });

  it("orders modifiers the platform way and collapses duplicates", () => {
    expect(legends("mod+cmd+k")).toEqual([["command", "K"]]);
    expect(legends("cmd+option+control+esc")).toEqual([
      ["control", "option", "command", "escape"],
    ]);
    expect(legends("fn+cmd+shift+alt+ctrl+a")).toEqual([
      ["fn", "control", "option", "shift", "command", "A"],
    ]);
    expect(legends("shift+alt+ctrl+meta+x", "windows")).toEqual([
      ["Win", "Ctrl", "Alt", "Shift", "X"],
    ]);
    expect(legends("Mod+Shift+Enter")).toEqual([
      ["shift", "command", "return"],
    ]);
  });

  it("splits sequences on spaces and reads plus and named characters", () => {
    expect(legends("g i")).toEqual([["G"], ["I"]]);
    expect(legends("  g   i  ")).toEqual([["G"], ["I"]]);
    expect(legends("mod++")).toEqual([["command", "+"]]);
    expect(legends("mod+plus")).toEqual([["command", "+"]]);
    expect(legends("+")).toEqual([["+"]]);
    expect(legends("mod+slash shift+comma")).toEqual([
      ["command", "/"],
      ["shift", ","],
    ]);
    expect(legends("f5 fn+f12")).toEqual([["F5"], ["fn", "F12"]]);
    expect(legends("")).toEqual([]);
    expect(legends("   ")).toEqual([]);
  });

  it("makes shift, enter, space and windows words wider", () => {
    expect(units("shift+mod+p")).toEqual([1.5, 1, 1]);
    expect(units("mod+enter")).toEqual([1, 1.5]);
    expect(units("mod+space")).toEqual([1, 2.5]);
    expect(units("ctrl+alt+shift+enter", "windows")).toEqual([
      1.25, 1.25, 1.5, 1.5,
    ]);
    expect(units("backspace", "windows")).toEqual([2]);
    expect(units("space", "windows")).toEqual([2.5]);
    for (const width of units("ctrl+alt+shift+esc+tab+delete", "windows")) {
      expect(width).toBeGreaterThan(1);
    }
    expect(getKeystrokeWordUnits("Ctrl")).toBe(1.25);
    expect(getKeystrokeWordUnits("fn")).toBe(1);
    expect(getKeystrokeWordUnits("Backspace")).toBe(2);
  });

  it("lays caps out left to right with a separator between chords", () => {
    const layout = getKeystrokeLayout(parseKeystrokeKeys("g shift+mod+p"));
    expect(layout.caps.map((cap) => cap.x)).toEqual([0, 1.95, 3.59, 4.73]);
    expect(layout.caps.map((cap) => cap.width)).toEqual([1, 1.5, 1, 1]);
    expect(layout.separators).toEqual([{ chord: 1, x: 1, width: 0.95 }]);
    expect(layout.widths).toEqual([1, 5.73]);
  });
});

describe("keystroke geometry", () => {
  it("sizes everything in reference px scaled by height / 720", () => {
    const base = getKeystrokeState(60);
    expect(base.originX).toBe(640);
    expect(base.originY).toBeCloseTo(619.2, 3);
    expect(base.metrics).toEqual(getKeystrokeMetrics(64));
    expect(base.metrics).toEqual({
      size: 64,
      height: 64,
      wall: 10.24,
      travel: 7.68,
      keytop: 53.76,
      radius: 10.24,
      rise: 26.88,
      border: 1,
      charFont: 25.6,
      wordFont: 16.64,
      icon: 23.04,
      separatorFont: 16,
    });
    const large = getKeystrokeState(60, { width: 1920, height: 1080 });
    expect(large.unit).toBe(1.5);
    expect(large.metrics.size).toBe(96);
    expect(large.metrics.border).toBe(1.5);
    for (const [g, group] of base.groups.entries()) {
      const other = large.groups[g];
      expect(other.y).toBeCloseTo(group.y * 1.5, 2);
      expect(other.width).toBeCloseTo(group.width * 1.5, 2);
      for (const [c, cap] of group.caps.entries()) {
        expect(other.caps[c].x).toBeCloseTo(cap.x * 1.5, 2);
        expect(other.caps[c].width).toBeCloseTo(cap.width * 1.5, 2);
        expect(other.caps[c].lift).toBeCloseTo(cap.lift * 1.5, 2);
      }
    }
    const small = getKeystrokeState(60, { size: 32 });
    expect(small.metrics.size).toBe(32);
    expect(small.groups[1].caps[0].width).toBe(32);
  });

  it("clamps size and falls back on invalid input", () => {
    const nan = Number.NaN;
    const broken = getKeystrokeState(60, {
      x: nan,
      y: nan,
      size: nan,
      linger: nan,
      speed: nan,
      fps: nan,
      width: nan,
      height: nan,
      accent: " ",
    });
    expect(broken).toEqual(getKeystrokeState(60));
    expect(getKeystrokeState(60, { size: 1 }).metrics.size).toBe(8);
    expect(getKeystrokeState(60, { size: 9000 }).metrics.size).toBe(400);
    const dark = getKeystrokeState(20, { theme: "dark", accent: "#ff6a00" });
    expect(dark.palette).toEqual(keystrokePalettes.dark);
    expect(dark.groups[0].caps[1].color).toBe("#ff6a00");
  });
});

describe("keystroke determinism", () => {
  it("renders any frame identically in any sampling order", () => {
    const options: KeystrokeOptions = {
      platform: "windows",
      theme: "dark",
      steps: [
        { at: 24, keys: "mod+shift+k" },
        { at: 70, keys: "g p", hold: 12 },
        { at: 96, keys: "alt+up" },
      ],
    };
    const sample = (frame: number) => getKeystrokeState(frame, options);
    const order = [0, 12, 20, 33, 49, 70, 81, 99, 130, 160];
    const forward = order.map(sample);
    const backward = [...order].reverse().map(sample).reverse();
    expect(backward).toEqual(forward);
    expect(sample(81)).toEqual(forward[6]);
  });

  it("maps other frame rates and speeds onto the same timeline", () => {
    const base = getKeystrokeState(50);
    expect(getKeystrokeState(100, { speed: 0.5 })).toEqual(base);
    const doubled = {
      steps: keystrokeDefaultSteps.map((step) => ({
        ...step,
        at: step.at * 2,
        hold: 16,
      })),
      linger: 60,
      fps: 60,
    };
    expect(getKeystrokeState(100, doubled)).toEqual(base);
    for (const frame of [0, 40, 90, 400]) {
      expect(getKeystrokeState(frame, { speed: 0 }).groups).toEqual([]);
    }
    expect(getKeystrokeTime(12, { speed: 2 })).toBe(24);
    expect(getKeystrokeTime(20, { fps: 60, speed: 0.5 })).toBe(5);
    expect(getKeystrokeTime(-5)).toBe(0);
    expect(getKeystrokeTime(Number.NaN)).toBe(0);
  });

  it("bottoms out on the frame a remocn-ui step with that at fires", () => {
    for (const speed of [0.5, 1, 2]) {
      for (const [step, { at }] of keystrokeDefaultSteps.entries()) {
        const trigger = (frame: number) =>
          groupOf(getKeystrokeState(frame, { speed }), step).caps.at(-1);
        expect(trigger(at / speed)?.depth).toBe(1);
        expect(trigger(at / speed - 1)?.depth).toBeLessThan(1);
      }
    }
  });
});

describe("keystroke config", () => {
  it("matches the component defaults and exposes every option", () => {
    const controls = resolveControls("keystroke", keystrokeConfig.controls);
    expect(getDefaults(controls)).toEqual(keystrokeDefaults);
    expect(keystrokeConfig.componentName).toBe("Keystroke");
    expect(keystrokeConfig.importPath).toBe("@/components/remocn/keystroke");
    const options = (key: string) => {
      const control = controls[key];
      return control.type === "select" ? control.options : [];
    };
    expect(options("platform")).toEqual(["mac", "windows"]);
    expect(options("theme")).toEqual(["light", "dark"]);
    const range = (key: string) => {
      const control = controls[key];
      return control.type === "number" ? [control.min, control.max] : [];
    };
    expect(range("size")).toEqual([32, 128]);
    expect(range("linger")).toEqual([0, 90]);
    expect(range("x")).toEqual([0, 1]);
    expect(range("y")).toEqual([0, 1]);
  });
});
