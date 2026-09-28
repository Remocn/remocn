import { describe, expect, it } from "bun:test";
import { getDefaults, resolveControls } from "@/lib/customizer-config";
import {
  getTypeRepeaterCopy,
  getTypeRepeaterIntro,
  getTypeRepeaterSpread,
  getTypeRepeaterTime,
  typeRepeaterDefaults,
  typeRepeaterLength,
  typeRepeaterModes,
} from "..";
import { typeRepeaterConfig } from "../config";

describe("type-repeater spread", () => {
  it("stays folded until frame 10 and after the collapse", () => {
    expect(getTypeRepeaterSpread(0)).toBe(0);
    expect(getTypeRepeaterSpread(10)).toBe(0);
    expect(getTypeRepeaterSpread(typeRepeaterLength)).toBe(0);
    expect(getTypeRepeaterSpread(200)).toBe(0);
  });

  it("unfolds with an overshoot, breathes, then collapses without jumps", () => {
    let peak = 0;
    for (let t = 10; t <= 34; t += 0.1) {
      peak = Math.max(peak, getTypeRepeaterSpread(t));
    }
    expect(peak).toBeGreaterThan(1.05);
    expect(getTypeRepeaterSpread(34)).toBeCloseTo(1, 10);
    expect(getTypeRepeaterSpread(43)).toBeCloseTo(1.06, 10);
    expect(getTypeRepeaterSpread(69.999)).toBeCloseTo(1, 3);
    expect(getTypeRepeaterSpread(70)).toBe(1);
    let last = getTypeRepeaterSpread(70);
    for (let t = 70; t <= 90; t += 0.5) {
      const s = getTypeRepeaterSpread(t);
      expect(s).toBeLessThanOrEqual(last);
      last = s;
    }
  });

  it("brings the word in over ten frames", () => {
    expect(getTypeRepeaterIntro(0)).toBe(0);
    expect(getTypeRepeaterIntro(10)).toBe(1);
  });
});

describe("type-repeater copies", () => {
  it("leaves the word itself untouched", () => {
    for (const mode of ["fan", "spiral", "tunnel"] as const) {
      expect(getTypeRepeaterCopy(0, 12, 1, mode)).toEqual({
        rotate: 0,
        scale: 1,
        opacity: 1,
        tint: 0,
      });
    }
  });

  it("grows tunnel copies outward without turning them", () => {
    const copy = getTypeRepeaterCopy(3, 12, 1, "tunnel");
    expect(copy.rotate).toBe(0);
    expect(copy.scale).toBeCloseTo(typeRepeaterModes.tunnel.scale ** 3, 10);
  });

  it("turns and grows spiral copies step by step", () => {
    const copy = getTypeRepeaterCopy(4, 12, 1, "spiral");
    expect(copy.rotate).toBeCloseTo(4 * typeRepeaterModes.spiral.rotate, 10);
    expect(copy.scale).toBeCloseTo(typeRepeaterModes.spiral.scale ** 4, 10);
  });

  it("fans copies out to alternating sides", () => {
    const step = typeRepeaterModes.fan.rotate;
    expect(getTypeRepeaterCopy(1, 12, 1, "fan").rotate).toBe(step);
    expect(getTypeRepeaterCopy(2, 12, 1, "fan").rotate).toBe(-step);
    expect(getTypeRepeaterCopy(3, 12, 1, "fan").rotate).toBe(2 * step);
    expect(getTypeRepeaterCopy(4, 12, 1, "fan").rotate).toBe(-2 * step);
  });

  it("collapses every copy onto the word at zero spread", () => {
    for (const mode of ["fan", "spiral", "tunnel"] as const) {
      const copy = getTypeRepeaterCopy(7, 12, 0, mode);
      expect(copy.rotate).toBe(0);
      expect(copy.scale).toBe(1);
      expect(copy.opacity).toBe(0);
    }
  });

  it("fades and tints copies toward the accent by index", () => {
    const near = getTypeRepeaterCopy(1, 12, 1, "tunnel");
    const far = getTypeRepeaterCopy(11, 12, 1, "tunnel");
    expect(far.opacity).toBeLessThan(near.opacity);
    expect(far.opacity).toBeGreaterThan(0);
    expect(far.tint).toBe(1);
    expect(near.tint).toBeCloseTo(1 / 11, 10);
  });
});

describe("type-repeater time and config", () => {
  it("maps frames onto the 30 fps timeline", () => {
    expect(getTypeRepeaterTime(30)).toBe(30);
    expect(getTypeRepeaterTime(60, { fps: 60 })).toBe(30);
    expect(getTypeRepeaterTime(10, { speed: 2 })).toBe(20);
  });

  it("previews the tunnel on the reel's orange field", () => {
    const defaults = getDefaults(
      resolveControls("type-repeater", typeRepeaterConfig.controls),
    );
    expect(defaults).toMatchObject({
      text: typeRepeaterDefaults.text,
      mode: typeRepeaterDefaults.mode,
      copies: typeRepeaterDefaults.copies,
      fontSize: typeRepeaterDefaults.fontSize,
      fontWeight: typeRepeaterDefaults.fontWeight,
      outline: typeRepeaterDefaults.outline,
    });
    expect(typeRepeaterConfig.durationInFrames).toBeGreaterThan(
      typeRepeaterLength,
    );
  });
});
