import { describe, expect, it } from "bun:test";
import { getShaderTextState } from "..";

describe("shader text word timing", () => {
  it("uses one beat per word and keeps the final word visible", () => {
    expect(getShaderTextState(29, 2, 30).index).toBe(0);
    expect(getShaderTextState(30, 2, 30).index).toBe(1);
    const hold = getShaderTextState(300, 2, 30);
    expect(hold).toEqual({ index: 1, enter: 1, exit: 0, scale: 1 });
  });
  it("clears the outgoing word before beginning the next reveal", () => {
    expect(getShaderTextState(29.99, 2, 30).exit).toBeGreaterThan(0.999);
    const next = getShaderTextState(30, 2, 30);
    expect(next.enter).toBeLessThan(0.25);
    expect(next.exit).toBe(0);
  });
  it("clamps invalid duration and negative frames without invalid indices", () => {
    expect(getShaderTextState(-5, 0, 0)).toEqual(getShaderTextState(0, 1, 12));
    expect(getShaderTextState(12, 2, 2).index).toBe(1);
  });
  it("reproduces the same state when seeking backwards", () => {
    const first = getShaderTextState(9, 2, 30);
    getShaderTextState(50, 2, 30);
    expect(getShaderTextState(9, 2, 30)).toEqual(first);
  });
});
