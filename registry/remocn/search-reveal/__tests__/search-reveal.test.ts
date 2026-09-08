import { describe, expect, it } from "bun:test";
import { getSearchRevealDuration, getSearchRevealState } from "..";
import { searchRevealConfig } from "../config";

describe("search reveal", () => {
  it("snaps from construction circles to the field at the reference cut", () => {
    expect(getSearchRevealState(25).circlesVisible).toBe(true);
    expect(getSearchRevealState(25).fieldVisible).toBe(false);
    expect(getSearchRevealState(26).circlesVisible).toBe(false);
    expect(getSearchRevealState(26).fieldWidth).toBe(130);
    expect(getSearchRevealState(48).fieldWidth).toBe(464);
    expect(getSearchRevealState(48).fieldHeight).toBe(80);
    expect(getSearchRevealState(48).tilt).toBe(0);
  });
  it("types remocn completely before three seconds and holds a stable final pose", () => {
    expect(getSearchRevealState(54).text).toBe("");
    expect(getSearchRevealState(58).text).toBe("r");
    expect(getSearchRevealState(78).text).toBe("remocn");
    for (const frame of [90, 108, 10000]) {
      const state = getSearchRevealState(frame);
      expect(state.text).toBe("remocn");
      expect(state.caretVisible).toBe(false);
      expect(state.panelWidth).toBe(774);
      expect(state.panelHeight).toBe(374);
      expect(state.panelRadius).toBe(0);
    }
  });
  it("preserves grapheme clusters and extends duration for edited copy", () => {
    expect(getSearchRevealState(58, { text: "👩‍💻é" }).text).toBe("👩‍💻");
    const props = { text: "Introducing remocn", framesPerCharacter: 8 };
    const duration = getSearchRevealDuration(props);
    expect(duration).toBeGreaterThan(108);
    expect(getSearchRevealState(duration - 1, props).text).toBe(props.text);
    expect(searchRevealConfig.getDurationInFrames?.(props)).toBe(duration);
  });
  it("supports empty copy, speed zero, and a static final pose", () => {
    expect(getSearchRevealState(90, { text: "" }).text).toBe("");
    expect(getSearchRevealDuration({ speed: 0 })).toBe(1);
    expect(getSearchRevealState(99, { speed: 0 }).circlesVisible).toBe(true);
    expect(getSearchRevealState(0, { reducedMotion: true }).text).toBe(
      "remocn",
    );
    expect(getSearchRevealState(0, { reducedMotion: true }).caretVisible).toBe(
      false,
    );
    expect(getSearchRevealState(90, { showPanel: false }).reveal).toBe(0);
  });
  it("seeks deterministically and applies speed to every stage", () => {
    for (const frame of [0, 25, 26, 40, 58, 74, 90]) {
      const before = getSearchRevealState(frame);
      getSearchRevealState(500);
      expect(getSearchRevealState(frame)).toEqual(before);
      expect(getSearchRevealState(frame / 2, { speed: 2 })).toEqual(before);
    }
    expect(getSearchRevealDuration({ speed: 2 })).toBe(54);
  });
});
