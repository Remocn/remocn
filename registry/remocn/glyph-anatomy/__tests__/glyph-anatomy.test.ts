import { describe, expect, it } from "bun:test";
import { getDefaults, resolveControls } from "@/lib/customizer-config";
import {
  getAnatomyContours,
  getAnatomyPath,
  getGlyphAnatomyAnchor,
  getGlyphAnatomyGuide,
  getGlyphAnatomyLength,
  getGlyphAnatomyLetter,
  getGlyphAnatomyPull,
  getGlyphAnatomyTime,
  glyphAnatomyDefaults,
  glyphAnatomyTiming,
} from "..";
import { glyphAnatomyConfig } from "../config";

describe("glyph-anatomy contours", () => {
  it("converts a quadratic into a cubic with handles two thirds out", () => {
    const [contour] = getAnatomyContours([
      { type: "M", x: 0, y: 0 },
      { type: "Q", x1: 30, y1: 30, x: 60, y: 0 },
      { type: "Z" },
    ]);
    expect(contour[0].c1).toEqual({ x: 20, y: 20 });
    expect(contour[0].c2).toEqual({ x: 40, y: 20 });
    expect(contour[0].to).toEqual({ x: 60, y: 0 });
  });

  it("closes an open contour with a straight segment back to its start", () => {
    const [contour] = getAnatomyContours([
      { type: "M", x: 0, y: 0 },
      { type: "L", x: 10, y: 0 },
      { type: "L", x: 10, y: 10 },
      { type: "Z" },
    ]);
    expect(contour).toHaveLength(3);
    expect(contour[2]).toEqual({ from: { x: 10, y: 10 }, to: { x: 0, y: 0 } });
  });

  it("keeps cubics and separates contours", () => {
    const contours = getAnatomyContours([
      { type: "M", x: 0, y: 0 },
      { type: "C", x1: 1, y1: 2, x2: 3, y2: 4, x: 5, y: 0 },
      { type: "Z" },
      { type: "M", x: 20, y: 0 },
      { type: "L", x: 30, y: 0 },
      { type: "Z" },
    ]);
    expect(contours).toHaveLength(2);
    expect(contours[0][0].c1).toEqual({ x: 1, y: 2 });
    expect(contours[0][0].c2).toEqual({ x: 3, y: 4 });
  });
});

describe("glyph-anatomy path", () => {
  const [contour] = getAnatomyContours([
    { type: "M", x: 0, y: 0 },
    { type: "Q", x1: 30, y1: 30, x: 60, y: 0 },
    { type: "Z" },
  ]);

  it("collapses curves onto their chords before the pull", () => {
    expect(getAnatomyPath(contour, () => 0)).toBe(
      "M0.00 0.00C0.00 0.00 60.00 0.00 60.00 0.00L0.00 0.00Z",
    );
  });

  it("puts the handles in place once pulled", () => {
    expect(getAnatomyPath(contour, () => 1)).toBe(
      "M0.00 0.00C20.00 20.00 40.00 20.00 60.00 0.00L0.00 0.00Z",
    );
  });
});

describe("glyph-anatomy timeline", () => {
  it("draws the guides three frames apart", () => {
    expect(getGlyphAnatomyGuide(0, 0)).toBe(0);
    expect(getGlyphAnatomyGuide(10, 0)).toBe(1);
    expect(getGlyphAnatomyGuide(3, 1)).toBe(0);
    expect(getGlyphAnatomyGuide(19, 3)).toBe(1);
  });

  it("pops anchors in path order between frames 8 and 22", () => {
    expect(getGlyphAnatomyAnchor(8, 0, 10)).toBe(0);
    expect(getGlyphAnatomyAnchor(12, 0, 10)).toBeCloseTo(1, 10);
    expect(getGlyphAnatomyAnchor(12, 9, 10)).toBe(0);
    expect(getGlyphAnatomyAnchor(22, 9, 10)).toBeCloseTo(1, 10);
    expect(getGlyphAnatomyAnchor(8, 0, 1)).toBe(0);
  });

  it("pulls each curve with an overshoot, in order", () => {
    let peak = 0;
    for (let t = 18; t <= 26; t += 0.1) {
      peak = Math.max(peak, getGlyphAnatomyPull(t, 0, 5));
    }
    expect(peak).toBeGreaterThan(1.05);
    expect(getGlyphAnatomyPull(26, 0, 5)).toBeCloseTo(1, 10);
    expect(getGlyphAnatomyPull(26, 4, 5)).toBe(0);
    expect(getGlyphAnatomyPull(40, 4, 5)).toBeCloseTo(1, 10);
  });

  it("fills, then fades the scaffolding", () => {
    expect(getGlyphAnatomyLetter(8)).toEqual({
      outline: 0,
      fill: 0,
      scaffold: 1,
    });
    expect(getGlyphAnatomyLetter(50).fill).toBe(1);
    expect(getGlyphAnatomyLetter(50).scaffold).toBeGreaterThan(0);
    expect(getGlyphAnatomyLetter(58).scaffold).toBe(0);
  });

  it("ends when the last letter's scaffolding has faded", () => {
    const count = Array.from(glyphAnatomyDefaults.text).length;
    expect(getGlyphAnatomyLength(count)).toBe(
      glyphAnatomyTiming.fade[1] + 2 * (count - 1),
    );
  });

  it("maps frames onto the 30 fps timeline", () => {
    expect(getGlyphAnatomyTime(30)).toBe(30);
    expect(getGlyphAnatomyTime(60, { fps: 60 })).toBe(30);
    expect(getGlyphAnatomyTime(10, { speed: 2 })).toBe(20);
  });
});

describe("glyph-anatomy config", () => {
  it("previews with the component's defaults", () => {
    const defaults = getDefaults(
      resolveControls("glyph-anatomy", glyphAnatomyConfig.controls),
    );
    expect(defaults).toMatchObject({
      text: glyphAnatomyDefaults.text,
      color: glyphAnatomyDefaults.color,
      guideColor: glyphAnatomyDefaults.guideColor,
      fontSize: glyphAnatomyDefaults.fontSize,
      guides: true,
      keepPoints: false,
    });
    expect(glyphAnatomyConfig.durationInFrames).toBeGreaterThan(
      getGlyphAnatomyLength(Array.from(glyphAnatomyDefaults.text).length),
    );
  });
});
