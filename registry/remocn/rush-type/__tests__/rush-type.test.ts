import { describe, expect, it } from "bun:test";
import {
  getRushTypeCycleLength,
  getRushTypeDuration,
  getRushTypeFrameState,
  getRushTypePhraseAtlasRows,
  getRushTypeShutterRatios,
  normalizeRushTypePhrase,
  rushTypeLength,
} from "../index";

describe("RushType phrase and duration", () => {
  it("normalizes whitespace into a stable word sequence", () => {
    expect(normalizeRushTypePhrase("  gone\n before   you look ")).toEqual([
      "gone",
      "before",
      "you",
      "look",
    ]);
  });

  it("falls back to the reference phrase when the input is empty", () => {
    expect(normalizeRushTypePhrase("   ")).toEqual([
      "gone",
      "before",
      "you",
      "look",
    ]);
  });

  it("derives the natural length from the phrase and timing controls", () => {
    expect(getRushTypeCycleLength()).toBe(26);
    expect(rushTypeLength).toBe(104);
    expect(
      getRushTypeDuration({
        phrase: "one two",
        restDuration: 20,
        peakHoldDuration: 5,
      }),
    ).toBe(72);
  });
});

describe("RushType phrase atlas", () => {
  it("rounds the row count up to a power of two for mipmaps", () => {
    expect(
      getRushTypePhraseAtlasRows({
        wordCount: 3,
        rowHeight: 512,
        maxTextureSize: 4096,
      }),
    ).toBe(4);
    expect(
      getRushTypePhraseAtlasRows({
        wordCount: 4,
        rowHeight: 512,
        maxTextureSize: 4096,
      }),
    ).toBe(4);
  });

  it("keeps two rows for a single word", () => {
    expect(
      getRushTypePhraseAtlasRows({
        wordCount: 1,
        rowHeight: 512,
        maxTextureSize: 4096,
      }),
    ).toBe(2);
  });

  it("selects the pair-atlas fallback when the phrase is too tall", () => {
    expect(
      getRushTypePhraseAtlasRows({
        wordCount: 9,
        rowHeight: 512,
        maxTextureSize: 4096,
      }),
    ).toBeNull();
  });
});

describe("RushType shutter model", () => {
  it("has coincident shutters when chromatic spread is zero", () => {
    expect(getRushTypeShutterRatios(0)).toEqual([1, 1, 1]);
  });

  it("matches the reference shutter ratios at spread one", () => {
    const [red, green, blue] = getRushTypeShutterRatios(1);
    expect(red).toBeCloseTo(0.62);
    expect(green).toBe(1);
    expect(blue).toBeCloseTo(0.34);
  });

  it("widens the shutter separation without introducing channel colors", () => {
    const normal = getRushTypeShutterRatios(1);
    const strong = getRushTypeShutterRatios(2);
    expect(strong[0]).toBeLessThan(normal[0]);
    expect(strong[1]).toBe(1);
    expect(strong[2]).toBeLessThan(normal[2]);
  });
});

describe("RushType timeline", () => {
  it("starts on a readable resting word", () => {
    const state = getRushTypeFrameState({ frame: 0 });
    expect(state.phase).toBe("rest");
    expect(state.wordIndex).toBe(0);
    expect(state.isResting).toBe(true);
  });

  it("advances one word after one complete cycle", () => {
    const state = getRushTypeFrameState({
      frame: getRushTypeCycleLength(),
    });
    expect(state.phase).toBe("rest");
    expect(state.wordIndex).toBe(1);
  });

  it("makes every additive effect exactly zero at rest", () => {
    const state = getRushTypeFrameState({ frame: 0 });
    expect(state.motion).toBe(0);
    expect(state.swapAmount).toBe(0);
    expect(state.thinAmount).toBe(0);
    expect(state.bloomAmount).toBe(0);
    expect(state.crtAmount).toBe(0);
    expect(state.groundAmount).toBe(0);
  });

  it("places the word swap inside the peak shutter", () => {
    const state = getRushTypeFrameState({
      frame: 11,
      peakHoldDuration: 2,
    });
    expect(state.phase).toBe("hang");
    expect(state.motion).toBe(1);
    expect(state.beforeWordIndex).toBe(0);
    expect(state.afterWordIndex).toBe(1);
    expect(state.swapAmount).toBe(1);
  });
});
