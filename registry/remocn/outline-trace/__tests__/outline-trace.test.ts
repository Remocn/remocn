import { describe, expect, it } from "bun:test";
import { getDefaults, resolveControls } from "@/lib/customizer-config";
import {
  getOutlineContours,
  getOutlineTraceLength,
  getOutlineTraceLetter,
  getOutlineTraceTime,
  outlineTraceDefaults,
  outlineTraceTiming,
  type PathCommand,
} from "..";
import { outlineTraceConfig } from "../config";

const square = (x: number, y: number, size: number): PathCommand[] => [
  { type: "M", x, y },
  { type: "L", x: x + size, y },
  { type: "L", x: x + size, y: y + size },
  { type: "L", x, y: y + size },
  { type: "Z" },
];

describe("outline-trace contours", () => {
  it("splits commands into closed contours with their boxes", () => {
    const contours = getOutlineContours([
      ...square(0, 0, 10),
      ...square(20, 0, 5),
    ]);
    expect(contours).toHaveLength(2);
    expect(contours[0].d).toBe("M0 0L10 0L10 10L0 10Z");
    expect(contours[0].box).toEqual({ x0: 0, y0: 0, x1: 10, y1: 10 });
    expect(contours[1].box).toEqual({ x0: 20, y0: 0, x1: 25, y1: 5 });
  });

  it("marks a contour inside another as a counter", () => {
    const contours = getOutlineContours([
      ...square(0, 0, 10),
      ...square(3, 3, 4),
    ]);
    expect(contours.map((c) => c.counter)).toEqual([false, true]);
  });

  it("keeps curve control points in the box and in the path", () => {
    const [contour] = getOutlineContours([
      { type: "M", x: 0, y: 0 },
      { type: "Q", x1: 5, y1: -8, x: 10, y: 0 },
      { type: "C", x1: 12, y1: 4, x2: 8, y2: 6, x: 0, y: 0 },
      { type: "Z" },
    ]);
    expect(contour.d).toBe("M0 0Q5 -8 10 0C12 4 8 6 0 0Z");
    expect(contour.box).toEqual({ x0: 0, y0: -8, x1: 12, y1: 6 });
  });

  it("closes a contour that ends without Z", () => {
    const contours = getOutlineContours(square(0, 0, 4).slice(0, 4));
    expect(contours).toHaveLength(1);
    expect(contours[0].d.endsWith("Z")).toBe(true);
  });
});

describe("outline-trace timeline", () => {
  it("draws the outer contour, then the counters, then fills", () => {
    expect(getOutlineTraceLetter(0, 0)).toEqual({
      outer: 0,
      counter: 0,
      fill: 0,
    });
    const mid = getOutlineTraceLetter(9, 0);
    expect(mid.outer).toBeCloseTo(0.5, 6);
    expect(mid.counter).toBeLessThan(mid.outer);
    expect(mid.fill).toBe(0);
    expect(getOutlineTraceLetter(18, 0).outer).toBe(1);
    expect(getOutlineTraceLetter(22, 0).counter).toBe(1);
    expect(getOutlineTraceLetter(26, 0)).toEqual({
      outer: 1,
      counter: 1,
      fill: 1,
    });
  });

  it("staggers letters", () => {
    const first = getOutlineTraceLetter(10, 0);
    const third = getOutlineTraceLetter(10, 2);
    expect(third.outer).toBeLessThan(first.outer);
    expect(getOutlineTraceLetter(10 + 6, 2)).toEqual(first);
    expect(getOutlineTraceLetter(10, 2, 0)).toEqual(first);
  });

  it("ends when the last letter has filled", () => {
    const count = Array.from(outlineTraceDefaults.text).length;
    const length = getOutlineTraceLength(count);
    expect(length).toBe(6 * 3 + outlineTraceTiming.fill[1]);
    expect(getOutlineTraceLetter(length, count - 1).fill).toBe(1);
    expect(getOutlineTraceLetter(length - 1, count - 1).fill).toBeLessThan(1);
  });

  it("maps frames onto the 30 fps timeline", () => {
    expect(getOutlineTraceTime(30)).toBe(30);
    expect(getOutlineTraceTime(60, { fps: 60 })).toBe(30);
    expect(getOutlineTraceTime(10, { speed: 2 })).toBe(20);
  });
});

describe("outline-trace config", () => {
  it("previews dark type on the reel's orange field", () => {
    const defaults = getDefaults(
      resolveControls("outline-trace", outlineTraceConfig.controls),
    );
    expect(defaults.text).toBe(outlineTraceDefaults.text);
    expect(defaults.fontSize).toBe(outlineTraceDefaults.fontSize);
    expect(defaults.strokeWidth).toBe(outlineTraceDefaults.strokeWidth);
    expect(defaults.stagger).toBe(outlineTraceDefaults.stagger);
    expect(defaults.fill).toBe(true);
    expect(defaults.keepStroke).toBe(false);
    expect(outlineTraceConfig.durationInFrames).toBeGreaterThan(
      getOutlineTraceLength(Array.from(outlineTraceDefaults.text).length),
    );
  });
});
