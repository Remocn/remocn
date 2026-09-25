import { describe, expect, it } from "bun:test";
import { getDefaults, resolveControls } from "@/lib/customizer-config";
import {
  getBaselineInLineBox,
  getLeadBarLetter,
  getLeadBarProgress,
  getLeadBarState,
  getLeadBarTrigger,
  getLeadBarTypeLength,
  getLeadBarTypeTime,
  getLeadBarUnderlineOffset,
  leadBarGeometry,
  leadBarTypeDefaults,
  leadBarTypeLength,
} from "..";
import { leadBarTypeConfig } from "../config";

const COUNT = Array.from(leadBarTypeDefaults.text).length;

describe("lead-bar-type bar", () => {
  it("crosses the word between frames 2 and 22", () => {
    expect(getLeadBarProgress(0, COUNT)).toBe(0);
    expect(getLeadBarProgress(2, COUNT)).toBe(0);
    expect(getLeadBarProgress(12, COUNT)).toBeCloseTo(COUNT / 2, 10);
    expect(getLeadBarProgress(22, COUNT)).toBeCloseTo(COUNT, 10);
    let last = -1;
    for (let t = 0; t <= 30; t += 0.25) {
      const p = getLeadBarProgress(t, COUNT);
      expect(p).toBeGreaterThanOrEqual(last);
      last = p;
    }
  });

  it("thins into an underline below the baseline", () => {
    const running = getLeadBarState(10, COUNT);
    expect(running.morph).toBe(0);
    expect(running.thickness).toBe(leadBarGeometry.thickness);
    expect(running.top).toBe(-leadBarGeometry.thickness);
    const settled = getLeadBarState(34, COUNT, 0.25);
    expect(settled.morph).toBe(1);
    expect(settled.thickness).toBeCloseTo(leadBarGeometry.underline, 10);
    expect(settled.top).toBeCloseTo(0.25, 10);
  });

  it("keeps the underline clear of descenders", () => {
    expect(getLeadBarUnderlineOffset(0)).toBe(leadBarGeometry.underlineOffset);
    expect(getLeadBarUnderlineOffset(0.2)).toBeCloseTo(0.25, 10);
  });
});

describe("lead-bar-type letters", () => {
  it("chase the bar in reading order", () => {
    let last = -1;
    for (let i = 0; i < COUNT; i++) {
      const trigger = getLeadBarTrigger(i, COUNT);
      expect(trigger).toBeGreaterThan(last);
      expect(getLeadBarProgress(trigger, COUNT)).toBeCloseTo(i + 0.35, 6);
      expect(getLeadBarLetter(trigger - 0.01, i, COUNT).opacity).toBe(0);
      last = trigger;
    }
  });

  it("smear on the way in and land with a small overshoot", () => {
    const trigger = getLeadBarTrigger(2, COUNT);
    const start = getLeadBarLetter(trigger, 2, COUNT);
    expect(start.scaleX).toBeCloseTo(1.8, 10);
    expect(start.x).toBeCloseTo(-0.3, 10);
    expect(getLeadBarLetter(trigger, 2, COUNT, 0).scaleX).toBe(1);
    let below = 0;
    for (let u = 0; u < 40; u += 0.1) {
      below = Math.max(below, getLeadBarLetter(trigger + u, 2, COUNT).y);
    }
    expect(below).toBeGreaterThan(0.02);
    expect(below).toBeLessThan(0.05);
  });

  it("settles the default word by its length", () => {
    expect(getLeadBarTypeLength(COUNT)).toBe(leadBarTypeLength);
    const rest = getLeadBarLetter(leadBarTypeLength, COUNT - 1, COUNT);
    expect(Math.abs(rest.y)).toBeLessThan(0.002);
    expect(rest.scaleX).toBe(1);
    expect(rest.blur).toBe(0);
    expect(rest.opacity).toBe(1);
  });
});

describe("lead-bar-type metrics and time", () => {
  it("places the Inter baseline inside a line-height 1 box", () => {
    expect(getBaselineInLineBox(0.96875, 0.2412)).toBeCloseTo(0.8638, 4);
  });

  it("maps frames onto the 30 fps timeline", () => {
    expect(getLeadBarTypeTime(30)).toBe(30);
    expect(getLeadBarTypeTime(60, { fps: 60 })).toBe(30);
    expect(getLeadBarTypeTime(10, { speed: 2 })).toBe(20);
    expect(getLeadBarTypeTime(Number.NaN)).toBe(0);
  });

  it("previews on the reel's orange field", () => {
    const defaults = getDefaults(
      resolveControls("lead-bar-type", leadBarTypeConfig.controls),
    );
    expect(defaults.text).toBe(leadBarTypeDefaults.text);
    expect(defaults.fontSize).toBe(leadBarTypeDefaults.fontSize);
    expect(defaults.fontWeight).toBe(leadBarTypeDefaults.fontWeight);
    expect(defaults.smear).toBe(leadBarTypeDefaults.smear);
    expect(leadBarTypeConfig.durationInFrames).toBeGreaterThan(
      leadBarTypeLength,
    );
  });
});
