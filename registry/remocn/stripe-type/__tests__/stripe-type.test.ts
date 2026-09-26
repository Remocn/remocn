import { describe, expect, it } from "bun:test";
import { getDefaults, resolveControls } from "@/lib/customizer-config";
import {
  getStripeBandOffset,
  getStripeBands,
  getStripeGap,
  getStripeTypeDuration,
  getStripeTypeTime,
  getStripeTypeTimeline,
  stripeTypeDefaults,
} from "..";
import { stripeTypeConfig } from "../config";

describe("stripe-type bands", () => {
  it("spans the ink box from the first band's top to the last band's bottom", () => {
    const bands = getStripeBands(8, 0.35);
    expect(bands).toHaveLength(8);
    expect(bands[0].top).toBe(0);
    expect(bands[7].bottom).toBeCloseTo(1, 10);
  });

  it("keeps equal bands and equal gaps", () => {
    const bands = getStripeBands(5, 0.4);
    const heights = bands.map((b) => b.bottom - b.top);
    const gaps = bands.slice(1).map((b, i) => b.top - bands[i].bottom);
    for (const h of heights) expect(h).toBeCloseTo(heights[0], 10);
    for (const g of gaps) expect(g).toBeCloseTo((heights[0] * 0.4) / 0.6, 10);
  });

  it("tiles the box without gaps at gap 0", () => {
    const bands = getStripeBands(4, 0);
    expect(bands.map((b) => [b.top, b.bottom])).toEqual([
      [0, 0.25],
      [0.25, 0.5],
      [0.5, 0.75],
      [0.75, 1],
    ]);
  });

  it("clamps the band count and gap", () => {
    expect(getStripeBands(0, 0.3)).toHaveLength(1);
    expect(getStripeBands(3.6, 0.3)).toHaveLength(4);
    const [only] = getStripeBands(1, 2);
    expect(only.top).toBe(0);
    expect(only.bottom).toBeCloseTo(1, 10);
  });
});

describe("stripe-type timeline", () => {
  it("locks every band by frame 30, then exits after the hold", () => {
    expect(getStripeTypeTimeline()).toEqual({
      entered: 30,
      settled: 30,
      exitStart: 60,
      exitEnd: 90,
      duration: 100,
    });
    const solid = getStripeTypeTimeline({ settle: "solid", exit: false });
    expect(solid.settled).toBe(40);
    expect(solid.duration).toBe(70);
  });

  it("enters from alternating sides and passes on through on the exit", () => {
    expect(getStripeBandOffset(0, 0)).toBe(-1);
    expect(getStripeBandOffset(0, 1)).toBe(1);
    expect(getStripeBandOffset(30, 0)).toBe(0);
    expect(getStripeBandOffset(30, 7)).toBe(0);
    expect(getStripeBandOffset(59, 3)).toBe(0);
    expect(getStripeBandOffset(90, 0)).toBe(1);
    expect(getStripeBandOffset(90, 1)).toBe(-1);
    expect(getStripeBandOffset(90, 0, { exit: false })).toBe(0);
  });

  it("staggers the bands two frames apart", () => {
    const first = getStripeBandOffset(8, 0);
    expect(getStripeBandOffset(10, 1)).toBeCloseTo(-first, 10);
  });

  it("closes the gaps only when settling solid", () => {
    expect(getStripeGap(35, 0.35)).toBe(0.35);
    expect(getStripeGap(30, 0.35, { settle: "solid" })).toBe(0.35);
    expect(getStripeGap(40, 0.35, { settle: "solid" })).toBe(0);
  });

  it("scales the preview duration with speed", () => {
    expect(getStripeTypeDuration()).toBe(100);
    expect(getStripeTypeDuration({ speed: 2 })).toBe(50);
    expect(getStripeTypeDuration({ speed: 0 })).toBe(1);
    expect(stripeTypeConfig.getDurationInFrames?.({ exit: false })).toBe(60);
  });

  it("maps frames onto the 30 fps timeline", () => {
    expect(getStripeTypeTime(30)).toBe(30);
    expect(getStripeTypeTime(60, { fps: 60 })).toBe(30);
    expect(getStripeTypeTime(10, { speed: 2 })).toBe(20);
  });
});

describe("stripe-type config", () => {
  it("previews with the component's defaults", () => {
    const defaults = getDefaults(
      resolveControls("stripe-type", stripeTypeConfig.controls),
    );
    expect(defaults).toMatchObject({
      text: stripeTypeDefaults.text,
      color: stripeTypeDefaults.color,
      settle: stripeTypeDefaults.settle,
      fontSize: stripeTypeDefaults.fontSize,
      fontWeight: stripeTypeDefaults.fontWeight,
      stripes: stripeTypeDefaults.stripes,
      gap: stripeTypeDefaults.gap,
      hold: stripeTypeDefaults.hold,
      exit: stripeTypeDefaults.exit,
    });
    expect(stripeTypeConfig.durationInFrames).toBe(getStripeTypeDuration());
  });
});
