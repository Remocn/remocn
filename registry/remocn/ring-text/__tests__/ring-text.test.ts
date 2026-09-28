import { describe, expect, it } from "bun:test";
import { getDefaults, resolveControls } from "@/lib/customizer-config";
import {
  getRingTextLayout,
  getRingTextPose,
  getRingTextShade,
  getRingTextTime,
  getRingTextToken,
  ringTextDefaults,
  ringTextLength,
} from "..";
import { ringTextConfig } from "../config";

const TAU = 2 * Math.PI;

describe("ring-text token", () => {
  it("joins the text and separator with spaces", () => {
    expect(getRingTextToken("Hi", "•").join("")).toBe("Hi • ");
    expect(getRingTextToken("Hi", "").join("")).toBe("Hi ");
    expect(getRingTextToken("👋🏽", "").length).toBe(3);
  });
});

describe("ring-text layout", () => {
  const advances = [20, 12, 18, 10];

  it("repeats the token to fill the circumference and closes the band", () => {
    const layout = getRingTextLayout(advances, 100);
    const circumference = TAU * 100;
    expect(layout.repeats).toBe(Math.floor(circumference / 60));
    expect(layout.spacing).toBeGreaterThanOrEqual(0);
    const total = layout.panels.reduce((sum, p) => sum + p.width, 0);
    expect(total).toBeCloseTo(circumference, 6);
    expect(layout.panels).toHaveLength(layout.repeats * advances.length);
  });

  it("orders panels around one turn", () => {
    const { panels } = getRingTextLayout(advances, 100);
    let last = -1;
    for (const panel of panels) {
      expect(panel.angle).toBeGreaterThan(last);
      expect(panel.angle).toBeLessThan(TAU);
      last = panel.angle;
    }
    expect(panels[0].char).toBe(0);
    expect(panels[advances.length].char).toBe(0);
  });

  it("grows the radius when one lap of text is longer than the ring", () => {
    const layout = getRingTextLayout([400, 400], 50);
    expect(layout.repeats).toBe(1);
    expect(layout.spacing).toBe(0);
    expect(layout.radius).toBeCloseTo(800 / TAU, 10);
  });

  it("returns no panels for empty text", () => {
    expect(getRingTextLayout([], 100).panels).toEqual([]);
    expect(getRingTextLayout([0, 0], 100).panels).toEqual([]);
  });
});

describe("ring-text pose", () => {
  it("arrives spinning fast and settles to one turn per period", () => {
    const start = getRingTextPose(0);
    expect(start.spin).toBe(0);
    expect(start.scale).toBeCloseTo(0.85, 10);
    expect(start.opacity).toBe(0);
    const early = getRingTextPose(3).spin - getRingTextPose(0).spin;
    const cruise =
      getRingTextPose(ringTextLength + 10).spin -
      getRingTextPose(ringTextLength + 7).spin;
    expect(early).toBeGreaterThan(cruise * 2);
    expect(cruise).toBeCloseTo((3 * 360) / ringTextDefaults.period, 10);
    const settled = getRingTextPose(ringTextLength);
    expect(settled.scale).toBe(1);
    expect(settled.opacity).toBe(1);
  });

  it("wobbles the tilt by six degrees around its value", () => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (let t = 0; t < 300; t += 0.5) {
      const { tilt } = getRingTextPose(t);
      min = Math.min(min, tilt);
      max = Math.max(max, tilt);
    }
    expect(min).toBeCloseTo(ringTextDefaults.tilt - 6, 2);
    expect(max).toBeCloseTo(ringTextDefaults.tilt + 6, 2);
  });

  it("dims letters on the far side", () => {
    expect(getRingTextShade(0, 0)).toBe(1);
    expect(getRingTextShade(Math.PI, 0)).toBeCloseTo(0.55, 10);
    expect(getRingTextShade(Math.PI, 180)).toBe(1);
  });
});

describe("ring-text time and config", () => {
  it("maps frames onto the 30 fps timeline", () => {
    expect(getRingTextTime(30)).toBe(30);
    expect(getRingTextTime(60, { fps: 60 })).toBe(30);
    expect(getRingTextTime(10, { speed: 2 })).toBe(20);
  });

  it("previews on the reel's lime field", () => {
    const defaults = getDefaults(
      resolveControls("ring-text", ringTextConfig.controls),
    );
    expect(defaults.text).toBe(ringTextDefaults.text);
    expect(defaults.separator).toBe(ringTextDefaults.separator);
    expect(defaults.radius).toBe(ringTextDefaults.radius);
    expect(defaults.fontSize).toBe(ringTextDefaults.fontSize);
    expect(defaults.tilt).toBe(ringTextDefaults.tilt);
    expect(defaults.roll).toBe(ringTextDefaults.roll);
    expect(defaults.period).toBe(ringTextDefaults.period);
  });
});
