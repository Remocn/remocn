import { describe, expect, it } from "bun:test";
import { getDefaults, resolveControls } from "@/lib/customizer-config";
import {
  getTypeWallBand,
  getTypeWallDirection,
  getTypeWallEntranceEnd,
  getTypeWallMotion,
  getTypeWallRow,
  getTypeWallRows,
  getTypeWallStyle,
  getTypeWallTime,
  getTypeWallTokenCount,
  typeWallDefaults,
} from "..";
import { typeWallConfig } from "../config";

describe("type-wall layout", () => {
  it("covers the frame with rows around a centered row 0", () => {
    const rows = getTypeWallRows(720, 64);
    expect(rows).toContain(0);
    expect(rows[0]).toBe(-rows[rows.length - 1]);
    const top = 360 + (rows[0] - 0.5) * 64;
    const bottom = 360 + (rows[rows.length - 1] + 0.5) * 64;
    expect(top).toBeLessThanOrEqual(0);
    expect(bottom).toBeGreaterThanOrEqual(720);
  });

  it("keeps the accent row solid and cycles the faces outward", () => {
    expect(getTypeWallStyle(0)).toBe("solid");
    expect(getTypeWallStyle(1)).toBe("narrow");
    expect(getTypeWallStyle(2)).toBe("outline");
    expect(getTypeWallStyle(3)).toBe("solid");
    expect(getTypeWallStyle(-1)).toBe("outline");
    expect(getTypeWallStyle(-2)).toBe("narrow");
  });

  it("runs neighbors in opposite directions", () => {
    for (let k = -6; k < 6; k++) {
      expect(getTypeWallDirection(k)).toBe(-getTypeWallDirection(k + 1));
    }
    expect(getTypeWallDirection(0)).toBe(-1);
  });

  it("repeats enough tokens to cover the width twice", () => {
    const count = getTypeWallTokenCount(1280, 64, "MOTION · ");
    expect(count * 9 * 0.4 * 64).toBeGreaterThanOrEqual(1280);
    expect(getTypeWallTokenCount(1280, 1, "")).toBe(48);
  });
});

describe("type-wall motion", () => {
  it("gives every row a seeded speed within ±30% of the base", () => {
    const base = 0.22 / 30;
    for (let k = -8; k <= 8; k++) {
      const { velocity, phase } = getTypeWallMotion(k, 7);
      expect(velocity).toBeGreaterThanOrEqual(base * 0.7);
      expect(velocity).toBeLessThanOrEqual(base * 1.3);
      expect(phase).toBeGreaterThanOrEqual(0);
      expect(phase).toBeLessThan(1);
      expect(getTypeWallMotion(k, 7)).toEqual({ velocity, phase });
    }
    expect(getTypeWallMotion(1, 7)).not.toEqual(getTypeWallMotion(1, 8));
  });

  it("keeps the strip shift within one token", () => {
    for (let t = 0; t < 400; t += 3.7) {
      for (const k of [-3, 0, 2]) {
        const { shift } = getTypeWallRow(t, k);
        expect(shift).toBeGreaterThanOrEqual(-1);
        expect(shift).toBeLessThanOrEqual(0);
      }
    }
  });

  it("moves each row in its direction at cruise", () => {
    const step = (k: number) => {
      const a = getTypeWallRow(200, k).shift;
      const b = getTypeWallRow(201, k).shift;
      return b - a;
    };
    expect(step(0)).toBeLessThan(0);
    expect(step(1)).toBeGreaterThan(0);
  });

  it("reveals rows from the center outward", () => {
    expect(getTypeWallRow(0, 0).reveal).toBe(0);
    expect(getTypeWallRow(20, 0).reveal).toBe(1);
    expect(getTypeWallRow(20, 3).reveal).toBeLessThan(1);
    expect(getTypeWallRow(26, 3).reveal).toBe(1);
    expect(getTypeWallEntranceEnd(720, 64)).toBe(20 + 2 * 7);
  });

  it("grows the accent band over frames 6–20", () => {
    expect(getTypeWallBand(6)).toBe(0);
    expect(getTypeWallBand(20)).toBe(1);
    expect(getTypeWallBand(13)).toBeGreaterThan(0.5);
  });
});

describe("type-wall time and config", () => {
  it("maps frames onto the 30 fps timeline", () => {
    expect(getTypeWallTime(30)).toBe(30);
    expect(getTypeWallTime(60, { fps: 60 })).toBe(30);
    expect(getTypeWallTime(10, { speed: 2 })).toBe(20);
  });

  it("previews the reel's blue wall", () => {
    const defaults = getDefaults(
      resolveControls("type-wall", typeWallConfig.controls),
    );
    expect(defaults.text).toBe(typeWallDefaults.text);
    expect(defaults.separator).toBe(typeWallDefaults.separator);
    expect(defaults.fontSize).toBe(typeWallDefaults.fontSize);
    expect(defaults.seed).toBe(typeWallDefaults.seed);
  });
});
