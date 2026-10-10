import { describe, expect, test } from "bun:test";
import { getSpiralPassPhase } from "..";

describe("spiral pass", () => {
  test("exact endpoints contain the correct untransformed scene", () => {
    const start = getSpiralPassPhase(0);
    const end = getSpiralPassPhase(1);
    expect(start.cover).toBe(0);
    expect(start.showNext).toBe(false);
    expect(start.outgoingZoom).toBe(1);
    expect(end.showNext).toBe(true);
    expect(end.aperture).toBe(1);
    expect(end.incomingZoom).toBe(1);
  });

  test("scene exchange happens under full coverage before the exit opens", () => {
    for (const p of [0.19999, 0.2, 0.20001]) {
      const phase = getSpiralPassPhase(p);
      expect(phase.cover).toBe(1);
      expect(phase.aperture).toBe(0);
    }
    expect(getSpiralPassPhase(0.19999).showNext).toBe(false);
    expect(getSpiralPassPhase(0.2).showNext).toBe(true);
  });

  test("camera advances and exit expands without reversal", () => {
    let previous = getSpiralPassPhase(0);
    for (let frame = 1; frame <= 120; frame++) {
      const phase = getSpiralPassPhase(frame / 120);
      expect(phase.zoom).toBeGreaterThanOrEqual(previous.zoom);
      expect(phase.aperture).toBeGreaterThanOrEqual(previous.aperture);
      previous = phase;
    }
  });

  test("keeps the incoming scene behind the tunnel until the final approach", () => {
    expect(getSpiralPassPhase(0.6).aperture).toBe(0);
    expect(getSpiralPassPhase(0.64).aperture).toBe(0);
    expect(getSpiralPassPhase(0.7).aperture).toBeLessThan(0.01);
    expect(getSpiralPassPhase(0.9).aperture).toBeGreaterThan(0.5);
  });

  test("clamps overshoot and invalid input to renderable phases", () => {
    expect(getSpiralPassPhase(-0.1)).toEqual(getSpiralPassPhase(0));
    expect(getSpiralPassPhase(1.1)).toEqual(getSpiralPassPhase(1));
    expect(getSpiralPassPhase(Number.NaN, Number.NaN)).toEqual(
      getSpiralPassPhase(0),
    );
    expect(getSpiralPassPhase(1, Infinity).zoom).toBeCloseTo(14);
  });
});
