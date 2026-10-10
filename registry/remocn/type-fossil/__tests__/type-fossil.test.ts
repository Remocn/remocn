import { describe, expect, test } from "bun:test";
import {
  getFossilLayerPose,
  getTypeFossilDuration,
  getTypeFossilState,
  parseFossilDrafts,
  typeFossilLength,
} from "..";

describe("type fossil slice", () => {
  test("revisions advance sequentially with opaque foreground lettering", () => {
    for (const [frame, revision] of [
      [0, 0],
      [28, 1],
      [46, 2],
      [64, 3],
    ]) {
      const state = getTypeFossilState(frame);
      expect(state.from).toBe(revision);
      expect(state.to).toBe(revision);
      expect(getFossilLayerPose(state, 0).opacity).toBe(1);
    }
    const wipe = getTypeFossilState(24);
    expect(wipe.from).toBe(0);
    expect(wipe.to).toBe(1);
    expect(wipe.change).toBeGreaterThan(0);
    expect(wipe.change).toBeLessThan(1);
  });
  test("all contours converge into the same held final word", () => {
    const state = getTypeFossilState(typeFossilLength);
    expect(state.from).toBe(6);
    expect(state.collapse).toBe(1);
    for (let i = 0; i < state.count; i++) {
      const pose = getFossilLayerPose(state, i);
      expect(pose.x).toBe(640);
      expect(pose.y).toBe(360);
      expect(pose.skew).toBeCloseTo(0);
      expect(pose.opacity).toBe(i === 0 ? 1 : 0);
      expect(pose).toEqual(getFossilLayerPose(getTypeFossilState(1000), i));
    }
  });
  test("geometry stays bounded across count, thickness and timeline extremes", () => {
    for (const layers of [4, 16, 24, Number.NaN])
      for (const depth of [50, 150, Number.NaN]) {
        for (let frame = 0; frame <= 210; frame += 3) {
          const state = getTypeFossilState(frame, { layers, depth });
          for (let i = 0; i < state.count; i++) {
            const pose = getFossilLayerPose(state, i);
            expect(Object.values(pose).every(Number.isFinite)).toBe(true);
            expect(pose.x).toBeGreaterThan(530);
            expect(pose.x).toBeLessThan(750);
            expect(pose.y).toBeGreaterThan(300);
            expect(pose.y).toBeLessThan(420);
          }
        }
      }
  });
  test("each draft gets a full beat and custom duration retains the final hold", () => {
    for (let draftCount = 0; draftCount <= 12; draftCount++) {
      const drafts = Array.from(
        { length: draftCount },
        (_, i) => `Draft ${i}`,
      ).join("|");
      const duration = getTypeFossilDuration({ drafts });
      const state = getTypeFossilState(duration - 1, { draftCount });
      expect(state.from).toBe(draftCount);
      expect(state.collapse).toBe(1);
      expect(duration - state.settle).toBe(34);
    }
    expect(getTypeFossilDuration()).toBe(208);
    expect(getTypeFossilDuration({ speed: 0.5 })).toBe(416);
    expect(getTypeFossilDuration({ speed: 0 })).toBe(1);
    expect(parseFossilDrafts("Maybe | \n Почти\n\nAgain")).toEqual([
      "Maybe",
      "Почти",
      "Again",
    ]);
    expect(parseFossilDrafts("a|b|c|d|e|f|g|h|i|j|k|l|m")).toHaveLength(12);
  });
  test("arbitrary seeking and stage boundaries preserve position continuity", () => {
    for (const frame of [0, 16, 20, 28, 38, 46, 110, 118, 126, 156, 174]) {
      const expected = getTypeFossilState(frame);
      getTypeFossilState(200);
      expect(getTypeFossilState(frame)).toEqual(expected);
      const a = getFossilLayerPose(getTypeFossilState(frame - 0.0001), 0);
      const b = getFossilLayerPose(getTypeFossilState(frame + 0.0001), 0);
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(0.01);
    }
  });
});
