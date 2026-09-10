import { describe, expect, it } from "bun:test";
import { getShaderSeamPhase } from "..";

describe("shader dissolve", () => {
  it("clamps seeking outside the transition and has transparent endpoints", () => {
    expect(getShaderSeamPhase(-0.1)).toEqual(getShaderSeamPhase(0));
    expect(getShaderSeamPhase(1.1)).toEqual(getShaderSeamPhase(1));
    expect(getShaderSeamPhase(0)).toEqual({
      presence: 0,
      dissolve: 0,
      showNext: false,
    });
    expect(getShaderSeamPhase(1)).toEqual({
      presence: 1,
      dissolve: 1,
      showNext: true,
    });
  });
  it("exchanges scenes only beneath the fully opaque material", () => {
    for (const p of [0.34, 0.399, 0.4, 0.401, 0.46]) {
      const phase = getShaderSeamPhase(p);
      expect(phase.presence).toBe(1);
      expect(phase.dissolve).toBe(0);
    }
    expect(getShaderSeamPhase(0.399).showNext).toBe(false);
    expect(getShaderSeamPhase(0.4).showNext).toBe(true);
  });
  it("reveals the next scene monotonically and deterministically", () => {
    let previous = 0;
    for (let i = 0; i <= 100; i++) {
      const phase = getShaderSeamPhase(i / 100);
      expect(phase.dissolve).toBeGreaterThanOrEqual(previous);
      previous = phase.dissolve;
    }
    const first = getShaderSeamPhase(0.7);
    getShaderSeamPhase(0.1);
    expect(getShaderSeamPhase(0.7)).toEqual(first);
  });
});
