import { describe, expect, it } from "bun:test";
import { getDefaults, resolveControls } from "@/lib/customizer-config";
import {
  getPathRideArc,
  getPathRideCenters,
  getPathRideFade,
  getPathRideHead,
  getPathRideLine,
  getPathRidePoint,
  getPathRideStraighten,
  getPathRideTail,
  getPathRideTime,
  getPathSample,
  pathRideDefaults,
  pathRideLength,
  samplePath,
} from "..";
import { pathRideConfig } from "../config";

const LINE = samplePath("M 0 0 L 100 0", 11);
const STRAIGHT = { start: 20, left: 300, baseline: 400 };

describe("path-ride sampling", () => {
  it("samples points and unit tangents at even arc lengths", () => {
    expect(LINE.length).toBeCloseTo(100, 6);
    expect(LINE.points).toHaveLength(11);
    expect(LINE.points[5].x).toBeCloseTo(50, 6);
    const mid = getPathSample(LINE, 55);
    expect(mid.x).toBeCloseTo(55, 6);
    expect(mid.y).toBeCloseTo(0, 6);
    expect(mid.tx).toBeCloseTo(1, 6);
    expect(mid.ty).toBeCloseTo(0, 6);
  });

  it("clamps arc lengths to the path", () => {
    expect(getPathSample(LINE, -10).x).toBeCloseTo(0, 6);
    expect(getPathSample(LINE, 500).x).toBeCloseTo(100, 6);
  });

  it("measures the default curve", () => {
    const curve = samplePath(pathRideDefaults.path);
    expect(curve.length).toBeGreaterThan(1200);
    for (const tangent of curve.tangents) {
      expect(Math.hypot(tangent.x, tangent.y)).toBeCloseTo(1, 6);
    }
  });
});

describe("path-ride pose", () => {
  it("lifts letters off the line along the normal", () => {
    const pose = getPathRidePoint(LINE, 40, 0, STRAIGHT, 5);
    expect(pose.x).toBeCloseTo(40, 6);
    expect(pose.y).toBeCloseTo(-5, 6);
    expect(pose.angle).toBeCloseTo(0, 6);
  });

  it("follows a vertical tangent", () => {
    const down = samplePath("M 0 0 L 0 100", 11);
    const pose = getPathRidePoint(down, 50, 0, STRAIGHT, 5);
    expect(pose.x).toBeCloseTo(5, 6);
    expect(pose.y).toBeCloseTo(50, 6);
    expect(pose.angle).toBeCloseTo(Math.PI / 2, 6);
  });

  it("maps arc length one to one onto the straight baseline", () => {
    const down = samplePath("M 0 0 L 0 100", 11);
    const a = getPathRidePoint(down, 30, 1, STRAIGHT);
    const b = getPathRidePoint(down, 70, 1, STRAIGHT);
    expect(a).toEqual({ x: 310, y: 400, angle: 0 });
    expect(b.x - a.x).toBeCloseTo(40, 6);
  });

  it("draws the line between the tail and the head", () => {
    expect(getPathRideLine(LINE, 50, 50, 0, STRAIGHT)).toBe("");
    const d = getPathRideLine(LINE, 25, 75, 0, STRAIGHT);
    expect(d.startsWith("M25.00 0.00")).toBe(true);
    expect(d.endsWith("L75.00 0.00")).toBe(true);
  });
});

describe("path-ride timeline", () => {
  it("draws, straightens, then erases", () => {
    expect(getPathRideHead(0, 1000)).toBe(0);
    expect(getPathRideHead(20, 1000)).toBeCloseTo(500, 6);
    expect(getPathRideHead(40, 1000)).toBe(1000);
    expect(getPathRideStraighten(50)).toBe(0);
    expect(getPathRideStraighten(68)).toBe(1);
    expect(getPathRideTail(52, 1000)).toBe(0);
    expect(getPathRideTail(70, 1000)).toBe(1000);
    expect(pathRideLength).toBe(70);
  });

  it("keeps the last letter closest to the head", () => {
    const { centers, width } = getPathRideCenters([10, 20, 30]);
    expect(centers).toEqual([5, 20, 45]);
    expect(width).toBe(60);
    const arcs = centers.map((c) => getPathRideArc(500, c, width, 40));
    expect(arcs[2]).toBeCloseTo(500 - 12 - 15, 10);
    expect(arcs[0]).toBeLessThan(arcs[1]);
  });

  it("fades letters in over their first half-em", () => {
    expect(getPathRideFade(-5, 40)).toBe(0);
    expect(getPathRideFade(10, 40)).toBe(0.5);
    expect(getPathRideFade(30, 40)).toBe(1);
  });

  it("maps frames onto the 30 fps timeline", () => {
    expect(getPathRideTime(30)).toBe(30);
    expect(getPathRideTime(60, { fps: 60 })).toBe(30);
    expect(getPathRideTime(10, { speed: 2 })).toBe(20);
  });
});

describe("path-ride config", () => {
  it("previews dark type on the reel's orange field", () => {
    const defaults = getDefaults(
      resolveControls("path-ride", pathRideConfig.controls),
    );
    expect(defaults).toMatchObject({
      text: pathRideDefaults.text,
      path: pathRideDefaults.path,
      fontSize: pathRideDefaults.fontSize,
      fontWeight: pathRideDefaults.fontWeight,
      lineWidth: pathRideDefaults.lineWidth,
    });
    expect(pathRideConfig.durationInFrames).toBeGreaterThan(pathRideLength);
  });
});
