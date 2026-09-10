import { describe, expect, it } from "bun:test";
import {
  getInlineWordRollDuration,
  getInlineWordRollState,
  parseInlineWords,
} from "..";

describe("inline word roll", () => {
  it("preserves phrases and ignores blank entries", () => {
    expect(
      parseInlineWords(" leads | new customers\n\n subscribers | "),
    ).toEqual(["leads", "new customers", "subscribers"]);
  });
  it("holds the first word, rolls one pair, and holds the final word", () => {
    expect(getInlineWordRollState(0, 3)).toEqual({
      from: 0,
      to: 0,
      progress: 1,
    });
    expect(getInlineWordRollState(15, 3)).toEqual({
      from: 0,
      to: 1,
      progress: 0.5,
    });
    expect(getInlineWordRollState(100, 3)).toEqual({
      from: 2,
      to: 2,
      progress: 1,
    });
  });
  it("accelerates intervals without overlapping rolls", () => {
    let previous = 0;
    for (let f = 0; f < 90; f += 0.1) {
      const state = getInlineWordRollState(f, 9, 12, 0.5, 6);
      expect(state.to - state.from).toBeLessThanOrEqual(1);
      expect(state.to).toBeGreaterThanOrEqual(previous);
      expect(state.progress).toBeGreaterThanOrEqual(0);
      expect(state.progress).toBeLessThanOrEqual(1);
      previous = state.to;
    }
    expect(
      getInlineWordRollDuration({ text: "a|b|c|d", acceleration: 0.5 }),
    ).toBeLessThan(
      getInlineWordRollDuration({ text: "a|b|c|d", acceleration: 1 }),
    );
  });
  it("duration ends on a settled final word and seeking is deterministic", () => {
    const text = "one|two|three";
    const duration = getInlineWordRollDuration({ text });
    expect(getInlineWordRollState(duration, 3)).toEqual({
      from: 2,
      to: 2,
      progress: 1,
    });
    expect(getInlineWordRollDuration({ text: "one" })).toBe(0);
    const first = getInlineWordRollState(14, 3);
    getInlineWordRollState(70, 3);
    expect(getInlineWordRollState(14, 3)).toEqual(first);
  });
});
