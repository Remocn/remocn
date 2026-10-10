import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { wcagContrast } from "culori";
import {
  releaseTeaserStatements,
  releaseTeaserTheme,
  resolveReleaseTeaserProps,
} from "../content";
import { createRing, createRotator, dot, project, rotate } from "../geometry";
import {
  atFps,
  characterState,
  fitText,
  graphemes,
  RELEASE_TEASER_FPS,
  RELEASE_TEASER_FRAMES,
  releaseTeaserTimeline,
  ringPose,
  textUnits,
} from "../motion";

const base = path.resolve(import.meta.dir, "../..");

test("the doubled NTSC picture clock preserves all 16.016 seconds", () => {
  expect(RELEASE_TEASER_FRAMES / RELEASE_TEASER_FPS).toBeCloseTo(16.016, 6);
  expect(atFps(960, 30000 / 1001)).toBe(480);
  for (const fps of [24, 25, 30, 50, 60, RELEASE_TEASER_FPS]) {
    const clips = releaseTeaserTimeline.map((clip) => ({
      from: atFps(clip.from, fps),
      to: atFps(clip.to, fps),
    }));
    for (let f = 0; f < atFps(960, fps); f++) {
      expect(
        clips.filter((clip) => f >= clip.from && f < clip.to),
      ).toHaveLength(1);
    }
  }
});

test("the release reveal begins at frame 610 and holds to the last picture frame", () => {
  expect(releaseTeaserTimeline).toHaveLength(6);
  expect(releaseTeaserTimeline.at(-1)).toEqual({
    name: "Release reveal",
    from: 610,
    to: 960,
  });
  expect(ringPose(959).opacity).toBe(0);
  expect(ringPose(790).opacity).toBe(1);
});

test("each chapter has an explicit independently visible Studio sequence", () => {
  const source = readFileSync(
    path.join(base, "release-teaser/index.tsx"),
    "utf8",
  ).replace(/\s+/g, " ");
  for (const clip of releaseTeaserTimeline) {
    const expected =
      clip.from === 0
        ? `name="${clip.name}" from={0} durationInFrames={atFps(${clip.to}, fps)}`
        : `name="${clip.name}" from={atFps(${clip.from}, fps)} durationInFrames={atFps(${clip.to}, fps) - atFps(${clip.from}, fps)}`;
    expect(source).toContain(expected);
  }
});

test("the cached rotation matrix matches the direct transform", () => {
  for (const frame of [0, 104, 610, 690, 959]) {
    const pose = ringPose(frame);
    const transform = createRotator(pose.rx, pose.ry, pose.rz);
    for (const vector of [
      [10, 20, 30],
      [-200, 40, -80],
      [0, 1, 0],
    ] as [number, number, number][]) {
      const actual = transform(vector);
      const expected = rotate(vector, pose.rx, pose.ry, pose.rz);
      for (let axis = 0; axis < 3; axis++)
        expect(actual[axis]).toBeCloseTo(expected[axis], 10);
    }
  }
});

test("content overrides normalize independently and never mutate caller arrays", () => {
  const statements = ["  A new beginning  ", " "];
  const scene = resolveReleaseTeaserProps({
    brandName: "  North  ",
    release: "",
    tagline: " ",
    statements,
    theme: { surface: "", accent: "red" },
    accentColor: "#D7B37B",
  });
  expect(scene.brandName).toBe("North");
  expect(scene.release).toBe("");
  expect(scene.tagline).toBe("Your next chapter starts here.");
  expect(scene.statements).toEqual([
    "A new beginning",
    ...releaseTeaserStatements.slice(1),
  ]);
  expect(scene.theme.surface).toBe(releaseTeaserTheme.surface);
  expect(scene.theme.accent).toBe("#D7B37B");
  expect(statements).toEqual(["  A new beginning  ", " "]);
  expect(resolveReleaseTeaserProps().brandName).toBe("Orvio");
});

test("lighting is finite and bounded, and custom logo paths are normalized", () => {
  for (const [input, expected] of [
    [-1, 0],
    [0, 0],
    [0.5, 0.5],
    [9, 2],
    [Number.NaN, 1],
    [Number.POSITIVE_INFINITY, 1],
  ]) {
    expect(
      resolveReleaseTeaserProps({ lightIntensity: input }).lightIntensity,
    ).toBe(expected);
  }
  expect(
    resolveReleaseTeaserProps({ logoSrc: "  /custom.svg  " }).logoSrc,
  ).toBe("/custom.svg");
  expect(resolveReleaseTeaserProps({ logoSrc: " " }).logoSrc).toBeUndefined();
});

test("the focus reveal is center-out, holds crisp, and disappears before the next beat", () => {
  expect(characterState(12, 104, 5, 11).opacity).toBeGreaterThan(
    characterState(12, 104, 0, 11).opacity,
  );
  for (const index of [0, 5, 10]) {
    expect(characterState(50, 104, index, 11)).toEqual({
      opacity: 1,
      blur: 0,
      y: 0,
    });
    expect(characterState(103, 104, index, 11).opacity).toBe(0);
    expect(characterState(-10, 104, index, 11).opacity).toBe(0);
  }
});

test("Unicode reveals keep grapheme clusters and multiline sizing respects the safe area", () => {
  expect(graphemes("👩🏽‍🎨 Cafe\u0301")).toEqual([
    "👩🏽‍🎨",
    " ",
    "C",
    "a",
    "f",
    "e\u0301",
  ]);
  for (const text of [
    "",
    "W".repeat(70),
    "Створюй сміливо.\nРухайся разом.",
    "a\nb\nc\nd\ne\nf",
    ...releaseTeaserStatements,
  ]) {
    const size = fitText(text);
    expect(size).toBeGreaterThan(0);
    expect(size).toBeLessThanOrEqual(48);
    for (const line of text.split("\n"))
      expect(textUnits(line) * size).toBeLessThanOrEqual(808.001);
    expect(size * 1.15 * text.split("\n").length).toBeLessThanOrEqual(220.001);
  }
});

test("camera and focus states do not depend on playback order", () => {
  const frames = Array.from({ length: 960 }, (_, f) => ({
    pose: ringPose(f),
    text: characterState(f % 104, 104, 2, 11),
  }));
  for (let f = 959; f >= 0; f--) {
    expect({
      pose: ringPose(f),
      text: characterState(f % 104, 104, 2, 11),
    }).toEqual(frames[f]);
    expect(Object.values(frames[f].pose).every(Number.isFinite)).toBe(true);
  }
});

test("reduced motion keeps every background coordinate and light constant", () => {
  const pose = ringPose(0, true);
  for (const frame of [10, 104, 326, 610, 790, 959])
    expect(ringPose(frame, true)).toEqual(pose);
});

test("the original mark is a closed, finite beveled annulus with unit normals", () => {
  const ring = createRing(48);
  expect(ring).toHaveLength(48 * 8 + 2);
  for (const face of ring) {
    expect(Math.hypot(...face.normal)).toBeCloseTo(1, 8);
    expect(face.vertices.flat().every(Number.isFinite)).toBe(true);
  }
  expect(ring[0].normal[2]).toBeCloseTo(1, 8);
  expect(ring[2].normal[0]).toBeGreaterThan(0.9);
  // The two end caps face in opposite directions along the arc's opening.
  expect(
    dot(ring[ring.length - 2].normal, ring[ring.length - 1].normal),
  ).toBeLessThan(-0.7);
});

test("projection remains finite throughout the camera travel and rotation preserves length", () => {
  const ring = createRing(12);
  for (const frame of [0, 100, 400, 600, 650, 700, 790, 959]) {
    const pose = ringPose(frame);
    for (const face of ring) {
      const v = rotate(face.center, pose.rx, pose.ry, pose.rz);
      expect(Math.hypot(...v)).toBeCloseTo(Math.hypot(...face.center), 8);
      expect(
        project(v, pose.scale, pose.x, pose.y).every(Number.isFinite),
      ).toBe(true);
    }
  }
});

test("default typography has readable contrast against its dark background", () => {
  for (const color of [
    releaseTeaserTheme.foreground,
    releaseTeaserTheme.muted,
    releaseTeaserTheme.accent,
  ]) {
    expect(wcagContrast(color, releaseTeaserTheme.background)).toBeGreaterThan(
      4.5,
    );
  }
});

test("the installable graph is closed, self-contained, and free of inherited branding or media", () => {
  const registry = JSON.parse(
    readFileSync(path.join(base, "registry.json"), "utf8"),
  );
  const item = registry.items.find(
    (entry: { name: string }) => entry.name === "release-teaser",
  );
  expect(item.files).toHaveLength(8);
  const files = new Set<string>(
    item.files.map((file: { path: string }) => path.resolve(base, file.path)),
  );
  for (const file of files) {
    expect(existsSync(file)).toBe(true);
    const source = readFileSync(file, "utf8");
    expect(source).not.toMatch(
      /Unity|mi9mwKtAjPQuPHrW|Coming soon|Create faster|Ship sharper|Math\.random|Date\.now|requestAnimationFrame|setInterval/,
    );
    expect(source).not.toMatch(/@\/registry|https?:\/\//);
    for (const match of source.matchAll(/from ["'](\.[^"']+)["']/g)) {
      const stem = path.resolve(path.dirname(file), match[1]);
      expect(
        [".tsx", ".ts", "/index.tsx"].some((ext) => files.has(stem + ext)),
      ).toBe(true);
    }
  }
});
