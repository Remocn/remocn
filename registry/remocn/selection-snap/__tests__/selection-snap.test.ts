import { describe, expect, it } from "bun:test";
import { getDefaults, resolveControls } from "@/lib/customizer-config";
import {
  getSelectionSnapPadding,
  getSelectionSnapSize,
  getSelectionSnapState,
  getSelectionSnapTime,
  selectionSnapDefaults,
  selectionSnapHandles,
  selectionSnapLength,
  selectionSnapPadding,
} from "..";
import { selectionSnapConfig } from "../config";

const sample = (from: number, to: number, step = 0.25) => {
  const out: number[] = [];
  for (let t = from; t <= to; t += step) out.push(t);
  return out;
};

describe("selection-snap timeline", () => {
  it("starts empty and loose", () => {
    const s = getSelectionSnapState(0);
    expect(s.intro).toBe(0);
    expect(s.snap).toBe(0);
    expect(s.weight).toBe(0);
    expect(s.tint).toBe(0);
    expect(s.edges).toBe(0);
    expect(s.badge).toBe(0);
    expect(s.handles.every((h) => h === 0)).toBe(true);
  });

  it("comes to rest exactly at its length", () => {
    for (const t of [selectionSnapLength, selectionSnapLength + 30]) {
      const s = getSelectionSnapState(t);
      expect(s.intro).toBe(1);
      expect(s.bracketScale).toBe(1);
      expect(s.snap).toBeCloseTo(1, 10);
      expect(s.weight).toBe(1);
      expect(s.tint).toBe(1);
      expect(s.edges).toBe(1);
      expect(s.badge).toBeCloseTo(1, 10);
      expect(s.count).toBe(1);
      for (const h of s.handles) expect(h).toBeCloseTo(1, 10);
    }
    const before = getSelectionSnapState(selectionSnapLength - 1);
    expect(before.count).toBeLessThan(1);
  });

  it("grows the weight monotonically", () => {
    let last = -1;
    for (const t of sample(0, selectionSnapLength)) {
      const { weight } = getSelectionSnapState(t);
      expect(weight).toBeGreaterThanOrEqual(last);
      last = weight;
    }
  });

  it("snaps with a small overshoot past the tight box", () => {
    const peak = Math.max(
      ...sample(14, 28).map((t) => getSelectionSnapState(t).snap),
    );
    expect(peak).toBeGreaterThan(1.02);
    expect(peak).toBeLessThan(1.12);
    const pad = getSelectionSnapPadding(peak);
    expect(pad.x).toBeGreaterThan(0);
  });

  it("closes the frame before the handles pop, corners before midpoints", () => {
    expect(getSelectionSnapState(24).edges).toBeCloseTo(0.94, 1);
    expect(getSelectionSnapState(26).edges).toBe(1);
    const s = getSelectionSnapState(28);
    const corners = s.handles.slice(0, 4);
    const mids = s.handles.slice(4);
    expect(Math.min(...corners)).toBeGreaterThan(Math.max(...mids));
    expect(selectionSnapHandles).toHaveLength(8);
  });

  it("maps frames onto the 30 fps timeline", () => {
    expect(getSelectionSnapTime(30)).toBe(30);
    expect(getSelectionSnapTime(60, { fps: 60 })).toBe(30);
    expect(getSelectionSnapTime(10, { speed: 2 })).toBe(20);
    expect(getSelectionSnapTime(10, { speed: 0 })).toBe(0);
    expect(getSelectionSnapTime(Number.NaN)).toBe(0);
    expect(getSelectionSnapTime(-5)).toBe(0);
  });
});

describe("selection-snap geometry", () => {
  it("interpolates the padding between the loose and tight boxes", () => {
    expect(getSelectionSnapPadding(0)).toEqual(selectionSnapPadding.loose);
    expect(getSelectionSnapPadding(1)).toEqual(selectionSnapPadding.tight);
  });

  it("reports the snapped box in reference px", () => {
    expect(getSelectionSnapSize(400, 150)).toEqual({ width: 436, height: 150 });
  });
});

describe("selection-snap config", () => {
  it("previews the reel palette over the component defaults", () => {
    const defaults = getDefaults(
      resolveControls("selection-snap", selectionSnapConfig.controls),
    );
    expect(defaults.text).toBe(selectionSnapDefaults.text);
    expect(defaults.fontSize).toBe(selectionSnapDefaults.fontSize);
    expect(defaults.fromWeight).toBe(selectionSnapDefaults.fromWeight);
    expect(defaults.toWeight).toBe(selectionSnapDefaults.toWeight);
    expect(defaults.speed).toBe(1);
    expect(selectionSnapConfig.durationInFrames).toBeGreaterThan(
      selectionSnapLength,
    );
  });
});
